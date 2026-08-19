import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Location } from './entities/location.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { InventoryStock } from './entities/inventory-stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      StockMovement,
      Location,
      InventoryStock,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}