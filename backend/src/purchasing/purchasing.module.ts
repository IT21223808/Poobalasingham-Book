import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasingController } from './purchasing.controller';
import { PurchasingService } from './purchasing.service';
import { PurchaseRequisition } from './entities/purchase-requisition.entity';
import { PurchaseRequisitionItem } from './entities/purchase-requisition-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { GoodsReceivedNote } from './entities/grn.entity';
import { GrnItem } from './entities/grn-item.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequisition,
      PurchaseRequisitionItem,
      PurchaseOrder,
      PurchaseOrderItem,
      GoodsReceivedNote,
      GrnItem,
      PurchaseInvoice,
      PurchaseInvoiceItem,
      Product,
      PurchaseReturn,
  PurchaseReturnItem,
    ]),

    InventoryModule,
  ],

  controllers: [
    PurchasingController,
  ],

  providers: [
    PurchasingService,
  ],
})
export class PurchasingModule {}