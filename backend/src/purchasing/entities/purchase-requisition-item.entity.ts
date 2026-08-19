import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseRequisition } from './purchase-requisition.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_requisition_items')
export class PurchaseRequisitionItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
requisitionId!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @ManyToOne(
    () => PurchaseRequisition,
    (requisition) => requisition.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'requisitionId' })
  requisition!: PurchaseRequisition;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;
}