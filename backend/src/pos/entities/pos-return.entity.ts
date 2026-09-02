import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { PosReturnItem } from './pos-return-item.entity';

@Entity('pos_returns')
export class PosReturn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, name: 'return_number', unique: true })
  returnNumber!: string;

  @Column({ type: 'uuid', name: 'pos_sale_id' })
  posSaleId!: string;

  @Column({ type: 'varchar', length: 100, name: 'invoice_number' })
  invoiceNumber!: string;

  @Column({ type: 'integer', name: 'customer_id', nullable: true })
  customerId!: number | null;

  @Column({ type: 'varchar', length: 100, name: 'cashier_id', nullable: true })
  cashierId!: string | null;

  @Column({ type: 'decimal', name: 'total_return_amount', precision: 12, scale: 2 })
  totalReturnAmount!: number;

  @Column({ type: 'text' })
  reason!: string;

  @OneToMany(() => PosReturnItem, (item) => item.posReturn, { cascade: true })
  items!: PosReturnItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
