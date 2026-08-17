import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StockAdjustmentDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsIn(['INCREASE', 'DECREASE'])
  adjustmentType!: 'INCREASE' | 'DECREASE';

  @IsOptional()
  @IsString()
  reason?: string;
}