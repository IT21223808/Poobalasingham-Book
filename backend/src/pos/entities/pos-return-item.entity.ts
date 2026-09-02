import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { PosReturn } from './pos-return.entity';

@Entity('pos_return_items')
export class PosReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PosReturn, (ret) => ret.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pos_return_id' })
  posReturn!: PosReturn;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @Column({ type: 'varchar', length: 255, name: 'product_name' })
  productName!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'decimal', name: 'refund_unit_price', precision: 12, scale: 2 })
  refundUnitPrice!: number;

  @Column({ type: 'decimal', name: 'line_total', precision: 12, scale: 2 })
  lineTotal!: number;
}
