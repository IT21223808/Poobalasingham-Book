import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  FinancePaymentMethod,
  TransactionType,
} from '../entities/finance-transaction.entity';

export class FinanceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(FinancePaymentMethod)
  paymentMethod?: FinancePaymentMethod;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
}
