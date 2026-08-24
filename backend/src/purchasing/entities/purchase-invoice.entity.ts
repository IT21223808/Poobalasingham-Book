import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PurchaseInvoiceItem } from './purchase-invoice-item.entity';

export enum PurchaseInvoiceStatus {
  DRAFT = 'DRAFT',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_invoices')
export class PurchaseInvoice {
  @PrimaryGeneratedColumn()
  id!: number;

  // =========================================================
  // INVOICE NUMBER
  // =========================================================

  @Column({ unique: true })
  invoiceNumber!: string;

  // =========================================================
  // REFERENCES
  // =========================================================

  @Column({
    type: 'int',
    nullable: true,
  })
  supplierId!: number | null;

  @Column()
  purchaseOrderId!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  grnId!: number | null;

  // =========================================================
  // DATES
  // =========================================================

  @Column({
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  invoiceDate!: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  dueDate!: string | null;

  // =========================================================
  // PAYMENT STATUS
  // =========================================================

  @Column({
    type: 'enum',
    enum: PurchaseInvoiceStatus,
    default: PurchaseInvoiceStatus.DRAFT,
  })
  paymentStatus!: PurchaseInvoiceStatus;

  // =========================================================
  // AMOUNTS
  // =========================================================

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
  discount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  tax!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  grandTotal!: number;

  // =========================================================
  // ITEMS
  // =========================================================

  @OneToMany(
    () => PurchaseInvoiceItem,
    (item) => item.invoice,
    {
      cascade: true,
    },
  )
  items!: PurchaseInvoiceItem[];

  // =========================================================
  // TIMESTAMPS
  // =========================================================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}