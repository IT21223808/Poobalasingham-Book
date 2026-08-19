import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  Min,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseRequisitionItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePurchaseRequisitionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequisitionItemDto)
  items!: PurchaseRequisitionItemDto[];
}