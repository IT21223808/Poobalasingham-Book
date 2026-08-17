import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DamagedLostType {
  DAMAGED = 'DAMAGED',
  LOST = 'LOST',
}

export class DamagedLostDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsEnum(DamagedLostType)
  type!: DamagedLostType;

  @IsOptional()
  @IsString()
  reason?: string|null;
}