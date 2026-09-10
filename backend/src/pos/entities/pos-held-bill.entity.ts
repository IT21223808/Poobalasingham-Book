import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Location } from '../../inventory/entities/location.entity';
import { Till } from '../../tills/entities/till.entity';

@Entity('pos_held_bills')
export class PosHeldBill {
  // ============================================================
  // ID
  // ============================================================

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================
  // HOLD NUMBER
  // ============================================================

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'hold_number',
    unique: true,
  })
  holdNumber!: string;

  // ============================================================
  // CUSTOMER
  // ============================================================

  @Column({
    type: 'integer',
    name: 'customer_id',
    nullable: true,
  })
  customerId!: number | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'customer_name',
    nullable: true,
  })
  customerName!: string | null;

  // ============================================================
  // CART
  // ============================================================

  @Column({
    type: 'jsonb',
    name: 'cart_data',
  })
  cartData!: Record<string, any>;

  // ============================================================
  // AMOUNTS
  // ============================================================

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  subtotal!: number;

  @Column({
    type: 'decimal',
    name: 'discount_amount',
    precision: 12,
    scale: 2,
    default: 0,
  })
  discountAmount!: number;

  @Column({
    type: 'decimal',
    name: 'grand_total',
    precision: 12,
    scale: 2,
    default: 0,
  })
  grandTotal!: number;

  // ============================================================
  // CASHIER
  // ============================================================

  @Index()
  @Column({
    type: 'varchar',
    length: 100,
    name: 'cashier_id',
    nullable: true,
  })
  cashierId!: string | null;

  // ============================================================
  // BRANCH / LOCATION
  // ============================================================

  @Index()
  @Column({
    type: 'uuid',
    name: 'location_id',
    nullable: false,
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

  // ============================================================
  // TILL
  // ============================================================

 @Index()
@Column({
  type: 'integer',
  name: 'till_id',
  nullable: true,
})
tillId!: number | null;

@ManyToOne(() => Till, {
  nullable: true,
  onDelete: 'SET NULL',
})
@JoinColumn({ name: 'till_id' })
till!: Till | null;

  // ============================================================
  // CREATED AT
  // ============================================================

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}