import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FinancePaymentMethod } from '../entities/finance-transaction.entity';

export class CreateSupplierPaymentDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  supplierId!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  purchaseInvoiceId!: number;

  @IsOptional()
  @IsString()
  paymentDate?: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsNotEmpty()
  @IsEnum(FinancePaymentMethod)
  paymentMethod!: FinancePaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
