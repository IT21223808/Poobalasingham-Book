import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
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
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, name: 'invoice_number', unique: true })
  invoiceNumber!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', name: 'discount_amount', precision: 12, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ type: 'decimal', name: 'grand_total', precision: 12, scale: 2, default: 0 })
  grandTotal!: number;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
  })
  status!: SaleStatus;

  @Column({ type: 'integer', name: 'customer_id', nullable: true })
  customerId!: number | null;

  @Column({ type: 'varchar', length: 255, name: 'customer_name', nullable: true })
  customerName!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'cashier_id', nullable: true })
  cashierId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => PosSaleItem, (item) => item.posSale, { cascade: true })
  items!: PosSaleItem[];

  @OneToMany(() => PosPayment, (payment) => payment.posSale, { cascade: true })
  payments!: PosPayment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
