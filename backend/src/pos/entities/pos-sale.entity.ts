import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Location } from '../../inventory/entities/location.entity';
import { Till } from '../../tills/entities/till.entity';

import { PosSaleItem } from './pos-sale-item.entity';
import { PosPayment } from './pos-payment.entity';

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  PARTIALLY_RETURNED = 'PARTIALLY_RETURNED',
}

@Entity('pos_sales')
export class PosSale {
  
  // ID
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // INVOICE NUMBER
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'invoice_number',
    unique: true,
  })
  invoiceNumber!: string;

  // CLIENT SALE ID
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'client_sale_id',
    nullable: true,
  })
  clientSaleId!: string | null;

  // AMOUNTS
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
  // STATUS
  // ============================================================

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
  })
  status!: SaleStatus;

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
  // CASHIER
  // ============================================================

  @Column({
    type: 'varchar',
    length: 100,
    name: 'cashier_id',
    nullable: true,
  })
  cashierId!: string | null;

  // ============================================================
  // NOTES
  // ============================================================

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

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
  // SALE ITEMS
  // ============================================================

  @OneToMany(
    () => PosSaleItem,
    (item) => item.posSale,
    {
      cascade: true,
    },
  )
  items!: PosSaleItem[];

  // ============================================================
  // PAYMENTS
  // ============================================================

  @OneToMany(
    () => PosPayment,
    (payment) => payment.posSale,
    {
      cascade: true,
    },
  )
  payments!: PosPayment[];

  // ============================================================
  // CREATED / UPDATED
  // ============================================================

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;
}