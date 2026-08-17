import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';
import { Location } from './location.entity';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',

  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  PHYSICAL_COUNT = 'PHYSICAL_COUNT',
  DAMAGED = 'DAMAGED',
  LOST = 'LOST',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  // FROM LOCATION
  @ManyToOne(() => Location, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'from_location_id' })
  fromLocation!: Location | null;

  // TO LOCATION
  @ManyToOne(() => Location, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'to_location_id' })
  toLocation!: Location | null;

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: MovementType,
  })
  movementType!: MovementType;

  @Column('int')
  quantity!: number;

  @Column({
    name: 'previous_stock',
    type: 'int',
  })
  previousStock!: number;

  @Column({
    name: 'new_stock',
    type: 'int',
  })
  newStock!: number;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  reason!: string | null;

  @Column({
    name: 'user_id',
    type: 'varchar',
    nullable: true,
  })
  userId!: string | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}