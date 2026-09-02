import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { PosSale } from './pos-sale.entity';

@Entity('pos_sale_items')
export class PosSaleItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PosSale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pos_sale_id' })
  posSale!: PosSale;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @Column({ type: 'varchar', length: 100, name: 'product_code' })
  productCode!: string;

  @Column({ type: 'varchar', length: 255, name: 'product_name' })
  productName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode!: string | null;

  @Column({ type: 'decimal', name: 'unit_price', precision: 12, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'decimal', name: 'discount_amount', precision: 12, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ type: 'decimal', name: 'line_total', precision: 12, scale: 2 })
  lineTotal!: number;
}
