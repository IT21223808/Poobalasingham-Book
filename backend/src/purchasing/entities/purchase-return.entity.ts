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

  @Column({
    type: 'int',
  })
  purchaseOrderId!: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  invoiceId!: number | null;

  @Column({
  type: 'enum',
  enum: PurchaseReturnStatus,
  default: PurchaseReturnStatus.PENDING,
})
status!: PurchaseReturnStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  reason!: string | null;

  @OneToMany(
    () => PurchaseReturnItem,
    (item) => item.purchaseReturn,
    {
      cascade: true,
    },
  )
  items!: PurchaseReturnItem[];

  @CreateDateColumn()
  createdAt!: Date;
}