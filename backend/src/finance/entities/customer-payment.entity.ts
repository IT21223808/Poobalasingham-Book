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
import { PosSale } from '../../pos/entities/pos-sale.entity';
import { FinancePaymentMethod } from './finance-transaction.entity';

@Entity('customer_payments')
export class CustomerPayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ unique: true })
  paymentNumber!: string;

  @Index()
  @Column()
  customerId!: number;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  salesInvoiceId?: string | null;

  @ManyToOne(() => PosSale, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'salesInvoiceId' })
  salesInvoice?: PosSale | null;

  @Index()
  @Column({
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
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

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reference?: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}