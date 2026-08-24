import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  PurchaseInvoiceStatus,
} from '../entities/purchase-invoice.entity';

export class UpdatePurchaseInvoiceItemDto {
  @IsInt()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0.01)
  unitPrice!: number;
}

export class UpdatePurchaseInvoiceDto {
  // ---------------------------------------------------------
  // REFERENCES
  // ---------------------------------------------------------

  @IsOptional()
  @IsInt()
  @Min(1)
  supplierId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  purchaseOrderId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  grnId?: number;

  // ---------------------------------------------------------
  // DATES
  // ---------------------------------------------------------

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  // ---------------------------------------------------------
  // ITEMS
  // ---------------------------------------------------------

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseInvoiceItemDto)
  items?: UpdatePurchaseInvoiceItemDto[];

  // ---------------------------------------------------------
  // AMOUNTS
  // ---------------------------------------------------------

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  // ---------------------------------------------------------
  // PAYMENT STATUS
  // ---------------------------------------------------------

  @IsOptional()
  @IsEnum(PurchaseInvoiceStatus)
  paymentStatus?: PurchaseInvoiceStatus;
}