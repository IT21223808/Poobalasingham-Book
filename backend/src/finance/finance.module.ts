import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

import { ExpenseCategory } from './entities/expense-category.entity';
import { FinanceTransaction } from './entities/finance-transaction.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { CustomerPayment } from './entities/customer-payment.entity';

import { PurchaseInvoice } from '../purchasing/entities/purchase-invoice.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PosSale } from '../pos/entities/pos-sale.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpenseCategory,
      FinanceTransaction,
      SupplierPayment,
      CustomerPayment,
      PurchaseInvoice,
      Supplier,
      Customer,
      PosSale,
      Product,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
