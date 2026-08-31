import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { PurchaseInvoiceStatus } from '../entities/purchase-invoice.entity';


export class UpdatePurchaseInvoiceItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0.01)
  unitPrice!: number;
}
export class UpdatePurchaseInvoiceDto {

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

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseInvoiceItemDto)
  items?: UpdatePurchaseInvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsEnum(PurchaseInvoiceStatus)
  paymentStatus?: PurchaseInvoiceStatus;
}