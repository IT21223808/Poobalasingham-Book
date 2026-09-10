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

@Entity('pos_opening_balances')
@Unique([
  'locationId',
  'tillId',
  'businessDate',
])
export class PosOpeningBalance {
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
    name: 'opening_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  openingBalance!: number;

  @Index()
  @Column({
    name: 'business_date',
    type: 'date',
  })
  businessDate!: string;

  @Column({
    name: 'created_by',
    type: 'integer',
    nullable: true,
  })
  createdBy!: number | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}