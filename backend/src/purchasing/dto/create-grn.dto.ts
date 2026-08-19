import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGrnItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsInt()
  @IsPositive()
  receivedQuantity!: number;
}

export class CreateGrnDto {
  @IsInt()
  @IsPositive()
  purchaseOrderId!: number;

 @IsNotEmpty()
@IsUUID()
locationId!: string;;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGrnItemDto)
  items!: CreateGrnItemDto[];
}