import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PurchaseRequisitionItem } from './purchase-requisition-item.entity';

export enum PurchaseRequisitionStatus {
  PENDING = 'PENDING',

  APPROVED = 'APPROVED',

  REJECTED = 'REJECTED',

  CANCELLED = 'CANCELLED',
}

@Entity('purchase_requisitions')
export class PurchaseRequisition {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  requisitionNumber!: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: 'System',
  })
  requestedBy!: string;

  @Column({
    type: 'enum',
    enum: PurchaseRequisitionStatus,
    default: PurchaseRequisitionStatus.PENDING,
  })
  status!: PurchaseRequisitionStatus;

  @Column({
    type: 'date',
  })
  requestedDate!: string;

  @Column({
    type: 'date',
  })
  requiredDate!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @OneToMany(
    () => PurchaseRequisitionItem,
    (item) => item.requisition,
    {
      cascade: true,
    },
  )
  items!: PurchaseRequisitionItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}