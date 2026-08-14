import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';
import { Location } from './location.entity';

@Entity('inventory_stocks')
@Unique(['product', 'location'])
export class InventoryStock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product!: Product;

  @ManyToOne(() => Location, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'location_id',
  })
  location!: Location;

  @Column({
    type: 'integer',
    default: 0,
  })
  quantity!: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;
}