import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FinancePaymentMethod,
  TransactionType,
} from '../entities/finance-transaction.entity';

export class CreateFinanceTransactionDto {
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNotEmpty()
  @IsEnum(FinancePaymentMethod)
  paymentMethod!: FinancePaymentMethod;

  @IsNotEmpty()
  @IsString()
  category!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purchaseInvoiceId?: number;
}
