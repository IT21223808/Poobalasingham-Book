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
} from "class-validator";

import { Type } from "class-transformer";

import { PaymentMethodEnum } from "../entities/pos-payment.entity";

/* =========================================================
   PAYMENT DTO
========================================================= */

export class CreatePosPaymentDto {
  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountReceived?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  changeAmount?: number;

  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

/* =========================================================
   SALE ITEM DTO
========================================================= */

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

/* =========================================================
   SALE DTO
========================================================= */

export class CreatePosSaleDto {
  /**
   * Browser generated ID.
   * Required for exact-once offline retry behaviour,
   * but optional so old online clients can still work.
   */
  @IsOptional()
  @IsString()
  clientSaleId?: string;

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

  /**
   * Branch / POS location.
   */
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsNumber()
  @Min(0)
  grandTotal!: number;

  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => CreatePosSaleItemDto)
  items!: CreatePosSaleItemDto[];

  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => CreatePosPaymentDto)
  payments!: CreatePosPaymentDto[];

  @IsOptional()
  @IsString()
  heldBillId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
