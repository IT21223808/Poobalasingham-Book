import { IsNumber, Min } from 'class-validator';

export class CreateOpeningBalanceDto {
  @IsNumber()
  @Min(0)
  openingBalance!: number;
}