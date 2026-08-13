import { IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StockOutDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}