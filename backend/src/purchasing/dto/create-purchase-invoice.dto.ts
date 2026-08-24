import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreatePurchaseInvoiceItemDto {
  @IsUUID()
  productId!: number | string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;
}

export class CreatePurchaseInvoiceDto {
  // =========================================================
  // SUPPLIER
  // =========================================================

  @IsInt()
  @IsPositive()
  supplierId!: number;

  // =========================================================
  // REFERENCES
  // =========================================================

  @IsInt()
  @IsPositive()
  purchaseOrderId!: number;

  @IsInt()
  @IsPositive()
  grnId!: number;

  // =========================================================
  // DATES
  // =========================================================

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  // =========================================================
  // DISCOUNT
  // =========================================================

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  // =========================================================
  // TAX
  // =========================================================

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  // =========================================================
  // ITEMS
  // =========================================================

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseInvoiceItemDto)
  items!: CreatePurchaseInvoiceItemDto[];
}