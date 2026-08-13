import {IsNotEmpty,IsOptional,IsString,IsNumber,Min,MinLength,IsUUID} from "class-validator";
import { Type } from "class-transformer";

export class CreateProductDto {
  // Basic Information
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  productCode!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  productName!: string;

  // Category & Subcategory
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  // Book Details
  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  edition?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  // Pricing
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  // Stock
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  // Image
  @IsOptional()
  @IsString()
  imageUrl?: string;
}