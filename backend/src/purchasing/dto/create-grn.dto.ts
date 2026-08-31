import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGRNItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNumber()
  @IsPositive()
  receivedQuantity!: number;
}

export class CreateGrnDto {
  @IsInt()
  @IsPositive()
  purchaseOrderId!: number;

  @IsNotEmpty()
  @IsUUID()
  locationId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGRNItemDto)
  items!: CreateGRNItemDto[];
}