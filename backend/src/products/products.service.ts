import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Product } from "./entities/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

import { Category } from "../categories/entities/category.entity";
import { Subcategory } from "../subcategories/entities/subcategory.entity";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
  ) {}

  // =========================================================
  // GENERATE UNIQUE BARCODE
  // =========================================================
  private async generateUniqueBarcode(): Promise<string> {
    while (true) {
      // Generate 12 random digits
      const randomPart = Math.floor(
        100000000000 +
          Math.random() * 900000000000,
      ).toString();

      // Calculate EAN-13 check digit
      let sum = 0;

      for (let i = 0; i < 12; i++) {
        const digit = Number(randomPart[i]);

        if (i % 2 === 0) {
          sum += digit;
        } else {
          sum += digit * 3;
        }
      }

      const checkDigit =
        (10 - (sum % 10)) % 10;

      const barcode =
        `${randomPart}${checkDigit}`;

      // Check whether barcode already exists
      const existing =
        await this.productRepository.findOne({
          where: {
            barcode,
          },
          select: {
            id: true,
          },
        });

      if (!existing) {
        return barcode;
      }
    }
  }

  // =========================================================
  // CREATE PRODUCT
  // =========================================================
  async create(
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    console.log(
      "========== CREATE PRODUCT ==========",
    );

    console.log(
      "DTO BARCODE:",
      createProductDto.barcode,
    );

    // -------------------------------------------------------
    // Check duplicate product code
    // -------------------------------------------------------
    const existingProduct =
      await this.productRepository.findOne({
        where: {
          productCode:
            createProductDto.productCode,
        },
      });

    if (existingProduct) {
      throw new ConflictException(
        "Product code already exists",
      );
    }

    // -------------------------------------------------------
    // BARCODE
    //
    // If barcode is provided:
    //   validate duplicate
    //
    // If barcode is empty / undefined:
    //   automatically generate
    // -------------------------------------------------------

    let barcode =
      createProductDto.barcode?.trim();

    console.log(
      "BARCODE BEFORE GENERATION:",
      barcode,
    );

    if (barcode) {
      // Manual barcode provided
      const existingBarcode =
        await this.productRepository.findOne({
          where: {
            barcode,
          },
        });

      if (existingBarcode) {
        throw new ConflictException(
          "Barcode already exists",
        );
      }
    } else {
      // Automatically generate barcode
      barcode =
        await this.generateUniqueBarcode();
    }

    console.log(
      "FINAL BARCODE:",
      barcode,
    );

    // -------------------------------------------------------
    // Check duplicate ISBN
    // -------------------------------------------------------
    const isbn =
      createProductDto.isbn?.trim();

    if (isbn) {
      const existingIsbn =
        await this.productRepository.findOne({
          where: {
            isbn,
          },
        });

      if (existingIsbn) {
        throw new ConflictException(
          "ISBN already exists",
        );
      }
    }

    // -------------------------------------------------------
    // Get Category
    // -------------------------------------------------------
    let category:
      | Category
      | undefined;

    if (createProductDto.categoryId) {
      const foundCategory =
        await this.categoryRepository.findOne({
          where: {
            id: createProductDto.categoryId,
          },
        });

      if (!foundCategory) {
        throw new NotFoundException(
          "Category not found",
        );
      }

      category = foundCategory;
    }

    // -------------------------------------------------------
    // Get Subcategory
    // -------------------------------------------------------
    let subcategory:
      | Subcategory
      | undefined;

    if (createProductDto.subcategoryId) {
      const foundSubcategory =
        await this.subcategoryRepository.findOne({
          where: {
            id: createProductDto.subcategoryId,
          },
          relations: {
            category: true,
          },
        });

      if (!foundSubcategory) {
        throw new NotFoundException(
          "Subcategory not found",
        );
      }

      // Check subcategory belongs to selected category
      if (
        category &&
        foundSubcategory.category.id !==
          category.id
      ) {
        throw new BadRequestException(
          "Subcategory does not belong to the selected category",
        );
      }

      subcategory = foundSubcategory;
    }

    // -------------------------------------------------------
    // Remove relationship IDs
    // -------------------------------------------------------
    const {
      categoryId,
      subcategoryId,
      ...productData
    } = createProductDto;

    // -------------------------------------------------------
    // Create Product
    // -------------------------------------------------------
    const product =
      this.productRepository.create({
        ...productData,

        // IMPORTANT:
        // Always use the processed/generated barcode
        barcode,

        // Use trimmed ISBN
        isbn: isbn || undefined,

        category,
        subcategory,
      });

    console.log(
      "PRODUCT BEFORE SAVE:",
      product,
    );

    // -------------------------------------------------------
    // Save Product
    // -------------------------------------------------------
    const savedProduct =
      await this.productRepository.save(product);

    console.log(
      "PRODUCT AFTER SAVE:",
      savedProduct,
    );

    console.log(
      "====================================",
    );

    return savedProduct;
  }

  // =========================================================
  // GET ALL PRODUCTS
  // =========================================================
  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: {
        category: true,
        subcategory: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  // =========================================================
  // GET ONE PRODUCT
  // =========================================================
  async findOne(
    id: string,
  ): Promise<Product> {
    const product =
      await this.productRepository.findOne({
        where: {
          id,
        },
        relations: {
          category: true,
          subcategory: true,
        },
      });

    if (!product) {
      throw new NotFoundException(
        "Product not found",
      );
    }

    return product;
  }

  // =========================================================
  // UPDATE PRODUCT
  // =========================================================
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product =
      await this.findOne(id);

    // -------------------------------------------------------
    // Check duplicate product code
    // -------------------------------------------------------
    if (
      updateProductDto.productCode &&
      updateProductDto.productCode !==
        product.productCode
    ) {
      const existingProduct =
        await this.productRepository.findOne({
          where: {
            productCode:
              updateProductDto.productCode,
          },
        });

      if (existingProduct) {
        throw new ConflictException(
          "Product code already exists",
        );
      }
    }

    // -------------------------------------------------------
    // BARCODE UPDATE
    //
    // If barcode is supplied:
    //   validate duplicate
    //
    // If barcode is blank:
    //   keep existing barcode
    //
    // If existing barcode is NULL:
    //   generate a new barcode
    // -------------------------------------------------------

    let barcode =
      updateProductDto.barcode?.trim();

    if (barcode) {
      // New barcode provided
      if (
        barcode !== product.barcode
      ) {
        const existingBarcode =
          await this.productRepository.findOne({
            where: {
              barcode,
            },
            select: {
              id: true,
            },
          });

        if (
          existingBarcode &&
          existingBarcode.id !== product.id
        ) {
          throw new ConflictException(
            "Barcode already exists",
          );
        }
      }
    } else {
      // No barcode entered during edit
      //
      // Keep existing barcode if available.
      // If old product has NULL barcode,
      // generate one automatically.
      barcode =
        product.barcode ||
        (await this.generateUniqueBarcode());
    }

    // -------------------------------------------------------
    // Check duplicate ISBN
    // -------------------------------------------------------
    const isbn =
      updateProductDto.isbn?.trim();

    if (
      isbn &&
      isbn !== product.isbn
    ) {
      const existingIsbn =
        await this.productRepository.findOne({
          where: {
            isbn,
          },
          select: {
            id: true,
          },
        });

      if (
        existingIsbn &&
        existingIsbn.id !== product.id
      ) {
        throw new ConflictException(
          "ISBN already exists",
        );
      }
    }

    // -------------------------------------------------------
    // Get updated category
    // -------------------------------------------------------
    let category =
      product.category;

    if (updateProductDto.categoryId) {
      const foundCategory =
        await this.categoryRepository.findOne({
          where: {
            id: updateProductDto.categoryId,
          },
        });

      if (!foundCategory) {
        throw new NotFoundException(
          "Category not found",
        );
      }

      category = foundCategory;
    }

    // -------------------------------------------------------
    // Get updated subcategory
    // -------------------------------------------------------
    let subcategory =
      product.subcategory;

    if (
      updateProductDto.subcategoryId
    ) {
      const foundSubcategory =
        await this.subcategoryRepository.findOne({
          where: {
            id:
              updateProductDto.subcategoryId,
          },
          relations: {
            category: true,
          },
        });

      if (!foundSubcategory) {
        throw new NotFoundException(
          "Subcategory not found",
        );
      }

      if (
        category &&
        foundSubcategory.category.id !==
          category.id
      ) {
        throw new BadRequestException(
          "Subcategory does not belong to the selected category",
        );
      }

      subcategory =
        foundSubcategory;
    }

    // -------------------------------------------------------
    // Remove relationship IDs
    // -------------------------------------------------------
    const {
      categoryId,
      subcategoryId,
      ...productData
    } = updateProductDto;

    // -------------------------------------------------------
    // Update Product
    // -------------------------------------------------------
    Object.assign(product, {
      ...productData,

      // IMPORTANT:
      // Always preserve / update barcode
      barcode,

      // Preserve trimmed ISBN
      isbn: isbn || undefined,

      category,
      subcategory,
    });

    return await this.productRepository.save(
      product,
    );
  }

  // =========================================================
  // DELETE PRODUCT
  // =========================================================
  async remove(id: string) {
    const product =
      await this.findOne(id);

    await this.productRepository.remove(
      product,
    );

    return {
      message:
        "Product deleted successfully",
    };
  }
}