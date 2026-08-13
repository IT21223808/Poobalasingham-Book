import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

import { Product } from '../products/entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      StockMovement,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}