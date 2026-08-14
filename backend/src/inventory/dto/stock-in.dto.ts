import { IsUUID, IsInt, Min ,IsOptional} from 'class-validator';
import { Type } from 'class-transformer';

export class StockInDto {
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