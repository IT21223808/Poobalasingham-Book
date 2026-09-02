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

export class CreateCustomerPaymentDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  customerId!: number;

  @IsOptional()
  @IsString()
  salesInvoiceId?: string;

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
