import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseReturnItem } from './purchase-return-item.entity';

export enum PurchaseReturnStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_returns')
export class PurchaseReturn {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  returnNumber!: string;

  @Column()
  purchaseOrderId!: number;

  @Column({ nullable: true })
  invoiceId!: number;

  @Column({
    type: 'enum',
    enum: PurchaseReturnStatus,
    default: PurchaseReturnStatus.COMPLETED,
  })
  status!: PurchaseReturnStatus;

  @Column({ nullable: true })
  reason!: string;

  @OneToMany(
    () => PurchaseReturnItem,
    (item) => item.purchaseReturn,
    { cascade: true },
  )
  items!: PurchaseReturnItem[];

  @CreateDateColumn()
  createdAt!: Date;
}