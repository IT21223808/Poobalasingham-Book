import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PurchaseInvoice } from './purchase-invoice.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_invoice_items')
export class PurchaseInvoiceItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  invoiceId!: number;

  @Column()
  productId!: string;

  @Column({
    type: 'int',
  })
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

  // =========================================================
  // INVOICE RELATION
  // =========================================================

  @ManyToOne(
    () => PurchaseInvoice,
    (invoice) => invoice.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'invoiceId',
  })
  invoice!: PurchaseInvoice;

  // =========================================================
  // PRODUCT RELATION
  // =========================================================

  @ManyToOne(() => Product)
  @JoinColumn({
    name: 'productId',
  })
  product!: Product;
}