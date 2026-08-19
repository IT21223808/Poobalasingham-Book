import {Column,Entity,JoinColumn,ManyToOne,PrimaryGeneratedColumn,} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  purchaseOrderId!: number;

  @Column()
  productId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  subtotal!: number;

  @ManyToOne(
    () => PurchaseOrder,
    (purchaseOrder) => purchaseOrder.items,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder!: PurchaseOrder;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;
}