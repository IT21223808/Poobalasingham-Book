import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

/* =========================================================
   PURCHASE REQUISITION ITEM
========================================================= */

export class PurchaseRequisitionItemDto {

  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

/* =========================================================
   CREATE PURCHASE REQUISITION
========================================================= */

export class CreatePurchaseRequisitionDto {

  @IsNotEmpty()
  @IsString()
  requestedBy!: string;

  @IsNotEmpty()
  @IsDateString()
  requestedDate!: string;

  @IsNotEmpty()
  @IsDateString()
  requiredDate!: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequisitionItemDto)
  items!: PurchaseRequisitionItemDto[];
}