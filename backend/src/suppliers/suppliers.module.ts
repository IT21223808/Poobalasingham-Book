import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
import { GoodsReceivedNote } from '../purchasing/entities/grn.entity';
import { PurchaseInvoice } from '../purchasing/entities/purchase-invoice.entity';
import { PurchaseReturn } from '../purchasing/entities/purchase-return.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      PurchaseOrder,
      GoodsReceivedNote,
      PurchaseInvoice,
      PurchaseReturn,
    ]),
  ],

  controllers: [
    SuppliersController,
  ],

  providers: [
    SuppliersService,
  ],

  exports: [
    SuppliersService,
  ],
})
export class SuppliersModule {}