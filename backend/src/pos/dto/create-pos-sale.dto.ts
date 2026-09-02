import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodEnum } from '../entities/pos-payment.entity';

export class CreatePosPaymentDto {
  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  amountReceived?: number;

  @IsOptional()
  @IsNumber()
  changeAmount?: number;

  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

export class CreatePosSaleItemDto {
  @IsUUID()
  productId!: string;

  @IsString()
  productCode!: string;

  @IsString()
  productName!: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  lineTotal!: number;
}

export class CreatePosSaleDto {
  @IsOptional()
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  grandTotal!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePosSaleItemDto)
  items!: CreatePosSaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePosPaymentDto)
  payments!: CreatePosPaymentDto[];

  @IsOptional()
  @IsString()
  heldBillId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
