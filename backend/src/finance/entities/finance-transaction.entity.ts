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
import { Customer } from '../../customers/entities/customer.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PurchaseInvoice } from '../../purchasing/entities/purchase-invoice.entity';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum FinancePaymentMethod {
  CASH = 'CASH',
  BANK = 'BANK',
}

@Entity('finance_transactions')
export class FinanceTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ unique: true })
  transactionNumber!: string;

  @Index()
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  transactionDate!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType;

  @Index()
  @Column({
    type: 'enum',
    enum: FinancePaymentMethod,
  })
  paymentMethod!: FinancePaymentMethod;

  @Column({ type: 'varchar', length: 255 })
  category!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  amount!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  customerId?: number | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  supplierId?: number | null;

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  purchaseInvoiceId?: number | null;

  @ManyToOne(() => PurchaseInvoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'purchaseInvoiceId' })
  purchaseInvoice?: PurchaseInvoice | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
