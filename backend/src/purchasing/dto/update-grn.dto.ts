import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGrnItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsInt()
  @IsPositive()
  receivedQuantity!: number;
}

export class UpdateGrnDto {
  @IsInt()
  @IsPositive()
  purchaseOrderId!: number;

  @IsNotEmpty()
  @IsUUID()
  locationId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGrnItemDto)
  items!: UpdateGrnItemDto[];
}