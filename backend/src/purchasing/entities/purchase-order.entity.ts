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

  @Column({ unique: true })
  poNumber!: string;

  @Column()
  requisitionId!: number;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
  })
  status!: PurchaseOrderStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  @OneToMany(
    () => PurchaseOrderItem,
    (item) => item.purchaseOrder,
    { cascade: true },
  )
  items!: PurchaseOrderItem[];

  @CreateDateColumn()
  createdAt!: Date;
}