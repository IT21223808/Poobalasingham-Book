import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  // Used by Expense Report and other searchable reports
  @IsOptional()
  @IsString()
  search?: string;

  // Used by Expense Report
  @IsOptional()
  @IsString()
  category?: string;

  // CASH / BANK
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}