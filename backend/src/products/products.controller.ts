import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import {AppPermission,} from '../common/permissions/permissions';
import {RequirePermissions,} from '../common/decorators/permissions.decorator';

@Controller('products')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@RequirePermissions(AppPermission.PRODUCTS)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  // CREATE PRODUCT
  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(
      createProductDto,
    );
  }

  // UPLOAD PRODUCT IMAGE
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',

        filename: (
          req,
          file,
          callback,
        ) => {
          const uniqueName =
            Date.now() +
            '-' +
            Math.round(
              Math.random() * 1e9,
            );

          callback(
            null,
            `${uniqueName}${extname(
              file.originalname,
            )}`,
          );
        },
      }),
    }),
  )
  uploadProductImage(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    console.log(
      'UPLOAD FILE:',
      file,
    );

    if (!file) {
      throw new BadRequestException(
        'Image file is required',
      );
    }

    return {
      message:
        'Product image uploaded successfully',

      imageUrl:
        `/uploads/products/${file.filename}`,
    };
  }

  // GET ALL PRODUCTS
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  // GET SINGLE PRODUCT
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(id);
  }

  // UPDATE PRODUCT
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
    );
  }

  // DELETE PRODUCT
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.productsService.remove(id);
  }
}