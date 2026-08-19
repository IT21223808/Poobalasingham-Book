import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseInvoiceItem } from './purchase-invoice-item.entity';

export enum PurchaseInvoiceStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_invoices')
export class PurchaseInvoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  invoiceNumber!: string;

  @Column()
  purchaseOrderId!: number;

  @Column({ nullable: true })
  grnId!: number;

  @Column({
    type: 'enum',
    enum: PurchaseInvoiceStatus,
    default: PurchaseInvoiceStatus.DRAFT,
  })
  status!: PurchaseInvoiceStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  subtotal!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  taxAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  discountAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  @OneToMany(
    () => PurchaseInvoiceItem,
    (item) => item.invoice,
    { cascade: true },
  )
  items!: PurchaseInvoiceItem[];

  @CreateDateColumn()
  createdAt!: Date;
}