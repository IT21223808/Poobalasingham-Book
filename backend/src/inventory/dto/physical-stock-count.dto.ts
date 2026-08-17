import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PhysicalStockCountDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  physicalQuantity!: number;

  @IsOptional()
  @IsString()
  note?: string;
}