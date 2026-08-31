import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique
} from 'typeorm';

import { GoodsReceivedNote } from './grn.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('grn_items')
@Unique(['grnId','productId'])
export class GrnItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  grnId!: number;

  @Column('uuid')
  productId!: string;

  @Column()
  orderedQuantity!: number;

  @Column()
  receivedQuantity!: number;

  // GRN relationship
  @ManyToOne(
    () => GoodsReceivedNote,
    (grn) => grn.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'grnId' })
  grn!: GoodsReceivedNote;

  // Product relationship
  @ManyToOne(
    () => Product,
    {
      eager: false,
    },
  )
  @JoinColumn({ name: 'productId' })
  product!: Product;
}