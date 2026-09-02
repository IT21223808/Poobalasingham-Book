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

export class CreateExpenseDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsNotEmpty()
  @IsString()
  expenseCategory!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

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
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purchaseInvoiceId?: number;
}
