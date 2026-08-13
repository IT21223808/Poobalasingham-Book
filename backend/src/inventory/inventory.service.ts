import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';

import {
  MovementType,
  StockMovement,
} from './entities/stock-movement.entity';

import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,

    private readonly dataSource: DataSource,
  ) {}

  // ========================================
  // STOCK IN
  // ========================================

  async stockIn(
    stockInDto: StockInDto,
    userId?: string,
  ) {
    const { productId, quantity } = stockInDto;

    // Validate quantity
    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        // Find product
        const product = await manager.findOne(
          Product,
          {
            where: {
              id: productId,
            },
          },
        );

        // Validate product exists
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        // Previous stock
        const previousStock =
          Number(product.stockQuantity ?? 0);

        // New stock
        const newStock =
          previousStock + quantity;

        // Update product stock
        product.stockQuantity = newStock;

        await manager.save(
          Product,
          product,
        );

        // Create movement
        const movement =
          manager.create(StockMovement, {
            product,
            movementType: MovementType.IN,
            quantity,
            previousStock,
            newStock,
            userId,
          });

        // Save movement
        await manager.save(
          StockMovement,
          movement,
        );

        return {
          success: true,
          message: 'Stock added successfully',
          data: {
            productId: product.id,
            productName: product.productName,
            quantityAdded: quantity,
            previousStock,
            newStock,
            movementId: movement.id,
          },
        };
      },
    );
  }

  // ========================================
  // STOCK OUT
  // ========================================

  async stockOut(
    stockOutDto: StockOutDto,
    userId?: string,
  ) {
    const { productId, quantity } =
      stockOutDto;

    // Validate quantity
    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        // Find product
        const product = await manager.findOne(
          Product,
          {
            where: {
              id: productId,
            },
          },
        );

        // Validate product exists
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        // Previous stock
        const previousStock =
          Number(product.stockQuantity ?? 0);

        // Validate sufficient stock
        if (quantity > previousStock) {
          throw new BadRequestException(
            `Insufficient stock. Available stock: ${previousStock}`,
          );
        }

        // New stock
        const newStock =
          previousStock - quantity;

        // Update product stock
        product.stockQuantity = newStock;

        await manager.save(
          Product,
          product,
        );

        // Create movement
        const movement =
          manager.create(StockMovement, {
            product,
            movementType: MovementType.OUT,
            quantity,
            previousStock,
            newStock,
            userId,
          });

        // Save movement
        await manager.save(
          StockMovement,
          movement,
        );

        return {
          success: true,
          message: 'Stock removed successfully',
          data: {
            productId: product.id,
            productName: product.productName,
            quantityRemoved: quantity,
            previousStock,
            newStock,
            movementId: movement.id,
          },
        };
      },
    );
  }

  // ========================================
  // MOVEMENT HISTORY
  // ========================================

  async getMovements() {
    const movements =
      await this.stockMovementRepository.find({
        relations: {
          product: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    return {
      success: true,
      data: movements,
    };
  }
}