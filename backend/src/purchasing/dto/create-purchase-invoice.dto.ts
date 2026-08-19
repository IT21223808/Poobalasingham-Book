import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  Min,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class PurchaseInvoiceItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  unitPrice!: number;
}

export class CreatePurchaseInvoiceDto {
  @IsNotEmpty()
  @IsInt()
  purchaseOrderId!: number;

  @IsNotEmpty()
  @IsInt()
  grnId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceItemDto)
  items!: PurchaseInvoiceItemDto[];

  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @IsNumber()
  @Min(0)
  discountAmount!: number;
}