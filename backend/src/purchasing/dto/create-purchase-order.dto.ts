import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreatePurchaseOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreatePurchaseOrderDto {
  // Purchase Requisition
  @IsInt()
  @Min(1)
  requisitionId!: number;

@IsInt()
  supplierId!: number;
  
  // PO Date
  @IsDateString()
  poDate!: string;

  // Expected Delivery Date
  @IsDateString()
  expectedDeliveryDate!: string;

  // Discount
  @IsNumber()
  @Min(0)
  discountAmount!: number;

  // Tax
  @IsNumber()
  @Min(0)
  taxAmount!: number;

  // PO Items
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items!: CreatePurchaseOrderItemDto[];
}