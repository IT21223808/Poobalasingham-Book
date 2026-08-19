import {Column,CreateDateColumn,Entity,OneToMany,PrimaryGeneratedColumn,} from 'typeorm';
import { PurchaseRequisitionItem } from './purchase-requisition-item.entity';

export enum PurchaseRequisitionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED',
}

@Entity('purchase_requisitions')
export class PurchaseRequisition {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  requisitionNumber!: string;

  @Column({
    type: 'enum',
    enum: PurchaseRequisitionStatus,
    default: PurchaseRequisitionStatus.PENDING,
  })
  status!: PurchaseRequisitionStatus;

  @OneToMany(
    () => PurchaseRequisitionItem,
    (item) => item.requisition,
    { cascade: true },
  )
  items!: PurchaseRequisitionItem[];

  @CreateDateColumn()
  createdAt!: Date;
}