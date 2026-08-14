import { IsInt, IsUUID, Min,IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StockOutDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsUUID()
  locationId?: string;
}