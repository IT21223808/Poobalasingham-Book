import {
  IsInt,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StockTransferDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  fromLocationId!: string;

  @IsUUID()
  toLocationId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}