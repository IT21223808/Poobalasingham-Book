import {Body,Controller,UploadedFile,Get,Post,Patch,Delete,UseInterceptors, Param} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { BadRequestException } from "@nestjs/common";

@Controller("products")
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  // Create Product
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(createProductDto);
  }

  // Upload Product Image
 @Post("upload-image")
@UseInterceptors(
  FileInterceptor("image", {
    storage: diskStorage({
      destination: "./uploads/products",
      filename: (req, file, callback) => {
        const uniqueName =
          Date.now() +
          "-" +
          Math.round(Math.random() * 1e9);

        callback(
          null,
          `${uniqueName}${extname(file.originalname)}`,
        );
      },
    }),
  }),
)
uploadProductImage(
  @UploadedFile() file: Express.Multer.File,
) {
  console.log("UPLOAD FILE:", file);

  if (!file) {
    throw new BadRequestException(
      "Image file is required",
    );
  }

  return {
    message: "Product image uploaded successfully",
    imageUrl: `/uploads/products/${file.filename}`,
  };
}

  // Get All Products
@Get()
async findAll() {
  return this.productsService.findAll();
}

// Get Single Product
@Get(":id")
async findOne(@Param("id") id: string) {
  return this.productsService.findOne(id);
}

@Patch(":id")
async update(
  @Param("id") id: string,
  @Body() updateProductDto: UpdateProductDto,
) {
  return this.productsService.update(id, updateProductDto);
}

@Delete(":id")
async remove(@Param("id") id: string) {
  return this.productsService.remove(id);
}
}