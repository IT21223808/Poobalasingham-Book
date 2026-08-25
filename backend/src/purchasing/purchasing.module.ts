import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PurchasingController } from './purchasing.controller';
import { PurchasingService } from './purchasing.service';

// Services
import { PurchaseRequisitionService } from './services/purchase-requisition.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { GoodsReceiptService } from './services/goods-receipt.service';
import { PurchaseInvoiceService } from './services/purchase-invoice.service';
import { PurchaseReturnService } from './services/purchase-return.service';
import { PurchasePaymentService } from './services/purchase-payment.service';

// Entities
import { PurchaseRequisition } from './entities/purchase-requisition.entity';
import { PurchaseRequisitionItem } from './entities/purchase-requisition-item.entity';

import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';

import { GoodsReceivedNote } from './entities/grn.entity';
import { GrnItem } from './entities/grn-item.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { PurchasePayment } from './entities/purchase-payment.entity';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Purchase Requisition
      PurchaseRequisition,
      PurchaseRequisitionItem,

      PurchaseOrder,
      PurchaseOrderItem,

      GoodsReceivedNote,
      GrnItem,

      PurchaseInvoice,
      PurchaseInvoiceItem,

      PurchaseReturn,
      PurchaseReturnItem,

      PurchasePayment,

      Product,
      Supplier,
    ]),

    InventoryModule,
  ],

  controllers: [
    PurchasingController,
  ],

  providers: [
    PurchasingService,

    PurchaseRequisitionService,
    PurchaseOrderService,
    GoodsReceiptService,
    PurchaseInvoiceService,
    PurchaseReturnService,

    // Purchase Payment
    PurchasePaymentService,
  ],

  exports: [
    PurchasingService,
    PurchasePaymentService,
  ],
})
export class PurchasingModule {}