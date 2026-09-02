import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';

@Entity('pos_held_bills')
export class PosHeldBill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, name: 'hold_number', unique: true })
  holdNumber!: string;

  @Column({ type: 'integer', name: 'customer_id', nullable: true })
  customerId!: number | null;

  @Column({ type: 'varchar', length: 255, name: 'customer_name', nullable: true })
  customerName!: string | null;

  @Column({ type: 'jsonb', name: 'cart_data' })
  cartData!: Record<string, any>;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', name: 'discount_amount', precision: 12, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ type: 'decimal', name: 'grand_total', precision: 12, scale: 2, default: 0 })
  grandTotal!: number;

  @Column({ type: 'varchar', length: 100, name: 'cashier_id', nullable: true })
  cashierId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
