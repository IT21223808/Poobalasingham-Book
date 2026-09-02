import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

import { PosSale } from '../pos/entities/pos-sale.entity';
import { PosSaleItem } from '../pos/entities/pos-sale-item.entity';
import { PosPayment } from '../pos/entities/pos-payment.entity';
import { PosReturn } from '../pos/entities/pos-return.entity';
import { PosReturnItem } from '../pos/entities/pos-return-item.entity';
import { PosHeldBill } from '../pos/entities/pos-held-bill.entity';

import { Product } from '../products/entities/product.entity';

import { ReportCsvService } from './csv/report-csv.service';
import { ReportPdfService } from './pdf/report-pdf.service';

import { InventoryStock } from '../inventory/entities/inventory-stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';

import { Supplier } from '../suppliers/entities/supplier.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';

import { Customer } from '../customers/entities/customer.entity';
import { CustomerPayment } from '../finance/entities/customer-payment.entity';

import { GoodsReceivedNote } from '../purchasing/entities/grn.entity';
import { GrnItem } from '../purchasing/entities/grn-item.entity';
import { FinanceModule } from '../finance/finance.module';
import { FinanceTransaction } from '../finance/entities/finance-transaction.entity';
import { PurchaseInvoice } from '../purchasing/entities/purchase-invoice.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,

      PosSale,
      PosSaleItem,
      PosPayment,
      PosReturn,
      PosReturnItem,
      PosHeldBill,

      InventoryStock,
      StockMovement,

      Supplier,
      PurchaseOrder,

      Customer,
CustomerPayment,

GoodsReceivedNote,
GrnItem,

FinanceTransaction,
  PurchaseInvoice,
    ]),
     FinanceModule,
  ],

  controllers: [
    ReportsController,
  ],

  providers: [
    ReportsService,
    ReportCsvService,
    ReportPdfService,
  ],

  exports: [
    ReportsService,
    ReportCsvService,
    ReportPdfService,
  ],
})
export class ReportsModule {}