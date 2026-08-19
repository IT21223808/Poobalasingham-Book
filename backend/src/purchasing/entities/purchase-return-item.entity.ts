import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseReturn } from './purchase-return.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_return_items')
export class PurchaseReturnItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  returnId!: number;

  @Column({ type: 'uuid' })
productId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @ManyToOne(
    () => PurchaseReturn,
    (purchaseReturn) => purchaseReturn.items,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'returnId' })
  purchaseReturn!: PurchaseReturn;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;
}