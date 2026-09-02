import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PurchaseInvoice } from '../../purchasing/entities/purchase-invoice.entity';
import { FinancePaymentMethod } from './finance-transaction.entity';

@Entity('supplier_payments')
export class SupplierPayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ unique: true })
  paymentNumber!: string;

  @Index()
  @Column()
  supplierId!: number;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplierId' })
  supplier!: Supplier;

  @Index()
  @Column()
  purchaseInvoiceId!: number;

  @ManyToOne(() => PurchaseInvoice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'purchaseInvoiceId' })
  purchaseInvoice!: PurchaseInvoice;

  @Index()
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  paymentDate!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  amount!: number;

  @Column({
    type: 'enum',
    enum: FinancePaymentMethod,
    default: FinancePaymentMethod.CASH,
  })
  paymentMethod!: FinancePaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
