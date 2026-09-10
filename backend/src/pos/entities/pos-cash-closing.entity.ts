import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Location } from '../../inventory/entities/location.entity';
import { Till } from '../../tills/entities/till.entity';

@Entity('pos_cash_closings')
@Unique([
  'locationId',
  'tillId',
  'businessDate',
])
export class PosCashClosing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({
    name: 'location_id',
    type: 'uuid',
  })
  locationId!: string;

  @ManyToOne(() => Location, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'location_id',
  })
  location!: Location;

  @Index()
  @Column({
    name: 'till_id',
    type: 'integer',
    nullable: true,
  })
  tillId!: number | null;

  @ManyToOne(() => Till, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'till_id',
  })
  till!: Till | null;

  @Column({
    name: 'business_date',
    type: 'date',
  })
  businessDate!: string;

  @Column({
    name: 'opening_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  openingBalance!: number;

  @Column({
    name: 'cash_sales',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  cashSales!: number;

  @Column({
    name: 'refunds',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  refunds!: number;

  @Column({
    name: 'expected_cash',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  expectedCash!: number;

  @Column({
    name: 'actual_cash',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  actualCash!: number;

  @Column({
    name: 'difference',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  difference!: number;

  @Column({
    name: 'closed_by',
    type: 'integer',
    nullable: true,
  })
  closedBy!: number | null;

  @CreateDateColumn({
    name: 'closed_at',
  })
  closedAt!: Date;
}