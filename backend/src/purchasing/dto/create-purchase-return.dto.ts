import {ArrayMinSize,IsUUID,IsArray,IsInt,IsNotEmpty,IsOptional,IsString,Min,ValidateNested,} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseReturnItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePurchaseReturnDto {
  @IsNotEmpty()
  @IsInt()
  purchaseOrderId!: number;

  @IsOptional()
  @IsInt()
  invoiceId?: number;

  @IsNotEmpty()
  @IsUUID()
  locationId!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseReturnItemDto)
  items!: PurchaseReturnItemDto[];
}