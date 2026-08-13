import { IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StockInDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}