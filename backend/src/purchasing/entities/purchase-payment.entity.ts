import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseInvoice } from './purchase-invoice.entity';

@Entity('purchase_payments')
export class PurchasePayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  purchaseInvoiceId!: number;

  @ManyToOne(
    () => PurchaseInvoice,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'purchaseInvoiceId',
  })
  purchaseInvoice!: PurchaseInvoice;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  amount!: number;

  @Column({
    type: 'date',
  })
  paymentDate!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  paymentMethod!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  referenceNumber?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}