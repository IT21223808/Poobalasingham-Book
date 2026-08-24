import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  // PO Number
  @Column({ unique: true })
  poNumber!: string;

  // Purchase Requisition Reference
  @Column()
  requisitionId!: number;

  @Column({ type: 'integer', nullable: true })
supplierId!: number | null;

  // PO Date
  @Column({
  type: 'date',
  default: () => 'CURRENT_DATE',
})
poDate!: Date;

  // Expected Delivery Date
  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate!: Date | null;

  // Discount Amount
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  discountAmount!: number;

  // Tax Amount
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  taxAmount!: number;

  // Final Total Amount
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  // Status
  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
  })
  status!: PurchaseOrderStatus;

  // Purchase Order Items
  @OneToMany(
    () => PurchaseOrderItem,
    (item) => item.purchaseOrder,
    {
      cascade: true,
    },
  )
  items!: PurchaseOrderItem[];

  // Created Date
  @CreateDateColumn()
  createdAt!: Date;
}