import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseOrderItem } from './purchase-order-item.entity';

import { Supplier } from '../../suppliers/entities/supplier.entity';

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

  // =========================================================
  // PO NUMBER
  // =========================================================

  @Column({ unique: true })
  poNumber!: string;

  // =========================================================
  // PURCHASE REQUISITION REFERENCE
  // =========================================================

  @Column()
  requisitionId!: number;

  // =========================================================
  // SUPPLIER
  // =========================================================

  @Column({
    type: 'int',
  })
  supplierId!: number;

  @ManyToOne(
    () => Supplier,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'supplierId',
  })
  supplier!: Supplier;

  // =========================================================
  // PO DATE
  // =========================================================

  @Column({
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  poDate!: Date;

  @Column({
    type: 'date',
    nullable: true,
  })
  expectedDeliveryDate!: Date | null;

  // =========================================================
  // DISCOUNT
  // =========================================================

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
  taxAmount!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
  })
  status!: PurchaseOrderStatus;

  @Column({
  type: 'text',
  nullable: true,
})
notes!: string | null;

  @OneToMany(
    () => PurchaseOrderItem,
    (item) => item.purchaseOrder,
    {
      cascade: true,
    },
  )
  items!: PurchaseOrderItem[];

  @CreateDateColumn()
  createdAt!: Date;
}