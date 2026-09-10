import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CloseCashDto {
  @IsUUID()
  locationId!: string;

  @IsOptional()
  @IsNumber()
  tillId?: number | null;

  @IsString()
  businessDate!: string;

  @IsNumber()
  @Min(0)
  openingBalance!: number;

    @IsNumber()
  @Min(0)
  actualCash!: number;
  
  @IsOptional()
  @IsNumber()
  cashSales?: number;

  @IsOptional()
  @IsNumber()
  refunds?: number;

  @IsOptional()
  @IsNumber()
  closedBy?: number | null;
}