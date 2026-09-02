import {
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnSaleItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  refundUnitPrice!: number;
}

export class ReturnSaleDto {
  @IsUUID()
  saleId!: string;

  @IsString()
  reason!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnSaleItemDto)
  items!: ReturnSaleItemDto[];
}
