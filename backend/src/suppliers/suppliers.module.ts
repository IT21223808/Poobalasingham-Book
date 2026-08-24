import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
import { GoodsReceivedNote } from '../purchasing/entities/grn.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      PurchaseOrder,
      GoodsReceivedNote,
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