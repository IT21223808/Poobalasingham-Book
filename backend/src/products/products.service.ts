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

  // CREATE PRODUCT
  async create(
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    // Check duplicate product code
    const existingProduct =
      await this.productRepository.findOne({
        where: {
          productCode: createProductDto.productCode,
        },
      });

    if (existingProduct) {
      throw new ConflictException(
        "Product code already exists",
      );
    }

    // Check duplicate barcode
    if (createProductDto.barcode) {
      const existingBarcode =
        await this.productRepository.findOne({
          where: {
            barcode: createProductDto.barcode,
          },
        });

      if (existingBarcode) {
        throw new ConflictException(
          "Barcode already exists",
        );
      }
    }

    // Check duplicate ISBN
    if (createProductDto.isbn) {
      const existingIsbn =
        await this.productRepository.findOne({
          where: {
            isbn: createProductDto.isbn,
          },
        });

      if (existingIsbn) {
        throw new ConflictException(
          "ISBN already exists",
        );
      }
    }

    // Get Category
    let category: Category | undefined;

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

    // Get Subcategory
    let subcategory: Subcategory | undefined;

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
        foundSubcategory.category.id !== category.id
      ) {
        throw new BadRequestException(
          "Subcategory does not belong to the selected category",
        );
      }

      subcategory = foundSubcategory;
    }

    // Remove relationship IDs from product data
    const {
      categoryId,
      subcategoryId,
      ...productData
    } = createProductDto;

    // Create product
    const product = this.productRepository.create({
      ...productData,
      category,
      subcategory,
    });

    return await this.productRepository.save(product);
  }

  // GET ALL PRODUCTS
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

  // GET ONE PRODUCT
  async findOne(id: string): Promise<Product> {
    const product =
      await this.productRepository.findOne({
        where: { id },
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

  // UPDATE PRODUCT
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Check duplicate product code
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

    // Check duplicate barcode
    if (
      updateProductDto.barcode &&
      updateProductDto.barcode !== product.barcode
    ) {
      const existingBarcode =
        await this.productRepository.findOne({
          where: {
            barcode: updateProductDto.barcode,
          },
        });

      if (existingBarcode) {
        throw new ConflictException(
          "Barcode already exists",
        );
      }
    }

    // Check duplicate ISBN
    if (
      updateProductDto.isbn &&
      updateProductDto.isbn !== product.isbn
    ) {
      const existingIsbn =
        await this.productRepository.findOne({
          where: {
            isbn: updateProductDto.isbn,
          },
        });

      if (existingIsbn) {
        throw new ConflictException(
          "ISBN already exists",
        );
      }
    }

    // Get updated category
    let category = product.category;

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

    // Get updated subcategory
    let subcategory = product.subcategory;

    if (updateProductDto.subcategoryId) {
      const foundSubcategory =
        await this.subcategoryRepository.findOne({
          where: {
            id: updateProductDto.subcategoryId,
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

      subcategory = foundSubcategory;
    }

    // Remove relationship IDs
    const {
      categoryId,
      subcategoryId,
      ...productData
    } = updateProductDto;

    Object.assign(product, {
      ...productData,
      category,
      subcategory,
    });

    return await this.productRepository.save(product);
  }

  // DELETE PRODUCT
  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);

    return {
      message: "Product deleted successfully",
    };
  }
}