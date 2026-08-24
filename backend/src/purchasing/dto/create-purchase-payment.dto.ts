import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum PurchasePaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
}

export class CreatePurchasePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  paymentDate!: string;

  @IsEnum(PurchasePaymentMethod)
  paymentMethod!: PurchasePaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}