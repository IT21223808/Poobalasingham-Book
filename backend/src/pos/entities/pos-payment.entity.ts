import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { PosSale } from './pos-sale.entity';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  CARD = 'CARD',
  QR = 'QR',
}

@Entity('pos_payments')
export class PosPayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PosSale, (sale) => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pos_sale_id' })
  posSale!: PosSale;

  @Column({
    type: 'enum',
    enum: PaymentMethodEnum,
    name: 'payment_method',
  })
  paymentMethod!: PaymentMethodEnum;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', name: 'amount_received', precision: 12, scale: 2, nullable: true })
  amountReceived!: number | null;

  @Column({ type: 'decimal', name: 'change_amount', precision: 12, scale: 2, nullable: true })
  changeAmount!: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'reference_number',
    nullable: true,
  })
  referenceNumber!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
