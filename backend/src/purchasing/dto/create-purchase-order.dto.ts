import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsUUID,
  Min,
  IsString,
  IsOptional,
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

  @IsInt()
  @Min(1)
  requisitionId!: number;

  @IsInt()
  @Min(1)
  supplierId!: number;

  @IsDateString()
  poDate!: string;

  @IsDateString()
  expectedDeliveryDate!: string;

  @IsNumber()
  @Min(0)
  discountAmount!: number;

  @IsNumber()
  @Min(0)
  taxAmount!: number;

  @IsOptional()
@IsString()
notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items!: CreatePurchaseOrderItemDto[];
}