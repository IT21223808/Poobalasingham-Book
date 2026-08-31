import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PurchaseInvoiceItem } from './purchase-invoice-item.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { GoodsReceivedNote } from './grn.entity';

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

  @Column({ unique: true })
  invoiceNumber!: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  supplierId!: number | null;

  @ManyToOne(
    () => Supplier,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'supplierId',
  })
  supplier!: Supplier | null;

  @Column()
  purchaseOrderId!: number;

  @ManyToOne(
    () => PurchaseOrder,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'purchaseOrderId',
  })
  purchaseOrder!: PurchaseOrder;

  @Column({
    type: 'int',
    nullable: true,
  })
  grnId!: number | null;

  @ManyToOne(
    () => GoodsReceivedNote,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'grnId',
  })
  grn!: GoodsReceivedNote | null;

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

  @Column({
    type: 'enum',
    enum: PurchaseInvoiceStatus,
    default: PurchaseInvoiceStatus.DRAFT,
  })
  paymentStatus!: PurchaseInvoiceStatus;

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

  @OneToMany(
    () => PurchaseInvoiceItem,
    (item) => item.invoice,
    {
      cascade: true,
    },
  )
  items!: PurchaseInvoiceItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}