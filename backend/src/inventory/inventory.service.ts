import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  Repository,
} from 'typeorm';

import { Product } from '../products/entities/product.entity';

import {
  MovementType,
  StockMovement,
} from './entities/stock-movement.entity';

import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';

import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

import { Location } from './entities/location.entity';
import { InventoryStock } from './entities/inventory-stock.entity';

import { StockTransferDto } from './dto/stock-transfer.dto';

import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

import { PhysicalStockCountDto } from './dto/physical-stock-count.dto';

import {
  DamagedLostDto,
  DamagedLostType,
} from './dto/damaged-lost.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,

    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(InventoryStock)
    private readonly inventoryStockRepository: Repository<InventoryStock>,

    private readonly dataSource: DataSource,
  ) {}

  // ======================================================
  // STOCK IN
  // ======================================================

  async stockIn(
    stockInDto: StockInDto,
    userId?: string,
  ) {
    const {
      productId,
      quantity,
      locationId,
    } = stockInDto;

    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        // ----------------------------------------
        // PRODUCT
        // ----------------------------------------

        const product =
          await manager.findOne(Product, {
            where: {
              id: productId,
            },
          });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        // ----------------------------------------
        // LOCATION
        // ----------------------------------------

        let location: Location | null = null;

        if (locationId) {
          location =
            await manager.findOne(Location, {
              where: {
                id: locationId,
                isActive: true,
              },
            });

          if (!location) {
            throw new NotFoundException(
              `Location with ID ${locationId} not found`,
            );
          }
        }

        // ----------------------------------------
        // PRODUCT TOTAL STOCK
        // ----------------------------------------

        const previousStock =
          Number(product.stockQuantity ?? 0);

        const newStock =
          previousStock + quantity;

        product.stockQuantity =
          newStock;

        await manager.save(
          Product,
          product,
        );

        // ----------------------------------------
        // LOCATION STOCK
        // ----------------------------------------

        let locationPreviousStock = 0;
        let locationNewStock = 0;

        if (location) {
          let inventoryStock =
            await manager.findOne(
              InventoryStock,
              {
                where: {
                  product: {
                    id: productId,
                  },
                  location: {
                    id: locationId,
                  },
                },
              },
            );

          if (!inventoryStock) {
            inventoryStock =
              manager.create(
                InventoryStock,
                {
                  product,
                  location,
                  quantity: 0,
                },
              );
          }

          locationPreviousStock =
            Number(
              inventoryStock.quantity ?? 0,
            );

          locationNewStock =
            locationPreviousStock +
            quantity;

          inventoryStock.quantity =
            locationNewStock;

          await manager.save(
            InventoryStock,
            inventoryStock,
          );
        }

        // ----------------------------------------
        // MOVEMENT
        // ----------------------------------------

        const movement =
          manager.create(
            StockMovement,
            {
              product,

              movementType:
                MovementType.IN,

              quantity,

              previousStock,

              newStock,

              userId:
                userId ?? null,

              reason: null,

              // Stock In = destination only
              fromLocation: null,

              toLocation:
                location ?? null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        return {
          success: true,

          message:
            'Stock added successfully',

          data: {
            productId:
              product.id,

            productName:
              product.productName,

            locationId:
              location?.id ?? null,

            locationName:
              location?.name ?? null,

            quantityAdded:
              quantity,

            previousStock,

            newStock,

            locationPreviousStock,

            locationNewStock,

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  // ======================================================
  // STOCK OUT
  // ======================================================

  async stockOut(
    stockOutDto: StockOutDto,
    userId?: string,
  ) {
    const {
      productId,
      quantity,
      locationId,
    } = stockOutDto;

    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        // ----------------------------------------
        // PRODUCT
        // ----------------------------------------

        const product =
          await manager.findOne(Product, {
            where: {
              id: productId,
            },
          });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        // ----------------------------------------
        // LOCATION
        // ----------------------------------------

        let location: Location | null = null;

        if (locationId) {
          location =
            await manager.findOne(Location, {
              where: {
                id: locationId,
                isActive: true,
              },
            });

          if (!location) {
            throw new NotFoundException(
              `Location with ID ${locationId} not found`,
            );
          }
        }

        // ----------------------------------------
        // PRODUCT TOTAL STOCK
        // ----------------------------------------

        const previousStock =
          Number(product.stockQuantity ?? 0);

        if (quantity > previousStock) {
          throw new BadRequestException(
            `Insufficient stock. Available stock: ${previousStock}`,
          );
        }

        // ----------------------------------------
        // LOCATION STOCK
        // ----------------------------------------

        let locationPreviousStock = 0;
        let locationNewStock = 0;

        if (location) {
          const inventoryStock =
            await manager.findOne(
              InventoryStock,
              {
                where: {
                  product: {
                    id: productId,
                  },
                  location: {
                    id: locationId,
                  },
                },
              },
            );

          if (!inventoryStock) {
            throw new BadRequestException(
              'Product has no stock in this location',
            );
          }

          locationPreviousStock =
            Number(
              inventoryStock.quantity ?? 0,
            );

          if (
            quantity >
            locationPreviousStock
          ) {
            throw new BadRequestException(
              `Insufficient location stock. Available stock at ${location.name}: ${locationPreviousStock}`,
            );
          }

          locationNewStock =
            locationPreviousStock -
            quantity;

          inventoryStock.quantity =
            locationNewStock;

          await manager.save(
            InventoryStock,
            inventoryStock,
          );
        }

        // ----------------------------------------
        // UPDATE PRODUCT TOTAL
        // ----------------------------------------

        const newStock =
          previousStock - quantity;

        product.stockQuantity =
          newStock;

        await manager.save(
          Product,
          product,
        );

        // ----------------------------------------
        // MOVEMENT
        // ----------------------------------------

        const movement =
          manager.create(
            StockMovement,
            {
              product,

              movementType:
                MovementType.OUT,

              quantity,

              previousStock,

              newStock,

              userId:
                userId ?? null,

              reason: null,

              // Stock Out = source only
              fromLocation:
                location ?? null,

              toLocation: null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        return {
          success: true,

          message:
            'Stock removed successfully',

          data: {
            productId:
              product.id,

            productName:
              product.productName,

            locationId:
              location?.id ?? null,

            locationName:
              location?.name ?? null,

            quantityRemoved:
              quantity,

            previousStock,

            newStock,

            locationPreviousStock,

            locationNewStock,

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  // ======================================================
  // STOCK TRANSFER
  // ======================================================

  async stockTransfer(
    dto: StockTransferDto,
    userId?: string,
  ) {
    const {
      productId,
      fromLocationId,
      toLocationId,
      quantity,
    } = dto;

    // ----------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------

    if (!productId) {
      throw new BadRequestException(
        'Product is required',
      );
    }

    if (!fromLocationId) {
      throw new BadRequestException(
        'Source location is required',
      );
    }

    if (!toLocationId) {
      throw new BadRequestException(
        'Destination location is required',
      );
    }

    if (
      fromLocationId ===
      toLocationId
    ) {
      throw new BadRequestException(
        'Source and destination locations must be different',
      );
    }

    if (
      quantity === undefined ||
      quantity === null ||
      quantity <= 0
    ) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        // ========================================
        // PRODUCT
        // ========================================

        const product =
          await manager.findOne(Product, {
            where: {
              id: productId,
            },
          });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        // ========================================
        // SOURCE LOCATION
        // ========================================

        const fromLocation =
          await manager.findOne(
            Location,
            {
              where: {
                id: fromLocationId,
                isActive: true,
              },
            },
          );

        if (!fromLocation) {
          throw new NotFoundException(
            `Source location with ID ${fromLocationId} not found`,
          );
        }

        // ========================================
        // DESTINATION LOCATION
        // ========================================

        const toLocation =
          await manager.findOne(
            Location,
            {
              where: {
                id: toLocationId,
                isActive: true,
              },
            },
          );

        if (!toLocation) {
          throw new NotFoundException(
            `Destination location with ID ${toLocationId} not found`,
          );
        }

        // ========================================
        // SOURCE STOCK
        // ========================================

        const sourceStock =
          await manager.findOne(
            InventoryStock,
            {
              where: {
                product: {
                  id: productId,
                },
                location: {
                  id: fromLocationId,
                },
              },
            },
          );

        if (!sourceStock) {
          throw new BadRequestException(
            `Product has no stock at ${fromLocation.name}`,
          );
        }

        const sourcePrevious =
          Number(
            sourceStock.quantity ?? 0,
          );

        // ========================================
        // SOURCE VALIDATION
        // ========================================

        if (
          quantity >
          sourcePrevious
        ) {
          throw new BadRequestException(
            `Insufficient stock at ${fromLocation.name}. Available stock: ${sourcePrevious}`,
          );
        }

        // ========================================
        // DESTINATION STOCK
        // ========================================

        let destinationStock =
          await manager.findOne(
            InventoryStock,
            {
              where: {
                product: {
                  id: productId,
                },
                location: {
                  id: toLocationId,
                },
              },
            },
          );

        if (!destinationStock) {
          destinationStock =
            manager.create(
              InventoryStock,
              {
                product,
                location: toLocation,
                quantity: 0,
              },
            );
        }

        // ========================================
        // CALCULATE
        // ========================================

        const destinationPrevious =
          Number(
            destinationStock.quantity ?? 0,
          );

        const sourceNew =
          sourcePrevious -
          quantity;

        const destinationNew =
          destinationPrevious +
          quantity;

        // ========================================
        // UPDATE SOURCE
        // ========================================

        sourceStock.quantity =
          sourceNew;

        await manager.save(
          InventoryStock,
          sourceStock,
        );

        // ========================================
        // UPDATE DESTINATION
        // ========================================

        destinationStock.quantity =
          destinationNew;

        await manager.save(
          InventoryStock,
          destinationStock,
        );

        // ========================================
        // PRODUCT TOTAL
        // ========================================

        const productTotalStock =
          Number(
            product.stockQuantity ?? 0,
          );

        // ========================================
        // TRANSFER OUT
        // ========================================

        const transferOutMovement =
          manager.create(
            StockMovement,
            {
              product,

              movementType:
                MovementType.TRANSFER_OUT,

              quantity,

              previousStock:
                sourcePrevious,

              newStock:
                sourceNew,

              userId:
                userId ?? null,

              reason: null,

              fromLocation:
                fromLocation,

              toLocation:
                toLocation,
            },
          );

        await manager.save(
          StockMovement,
          transferOutMovement,
        );

        // ========================================
        // TRANSFER IN
        // ========================================

        const transferInMovement =
          manager.create(
            StockMovement,
            {
              product,

              movementType:
                MovementType.TRANSFER_IN,

              quantity,

              previousStock:
                destinationPrevious,

              newStock:
                destinationNew,

              userId:
                userId ?? null,

              reason: null,

              fromLocation:
                fromLocation,

              toLocation:
                toLocation,
            },
          );

        await manager.save(
          StockMovement,
          transferInMovement,
        );

        // ========================================
        // RESPONSE
        // ========================================

        return {
          success: true,

          message:
            'Stock transferred successfully',

          data: {
            productId:
              product.id,

            productName:
              product.productName,

            fromLocation: {
              id:
                fromLocation.id,

              name:
                fromLocation.name,

              previousStock:
                sourcePrevious,

              newStock:
                sourceNew,
            },

            toLocation: {
              id:
                toLocation.id,

              name:
                toLocation.name,

              previousStock:
                destinationPrevious,

              newStock:
                destinationNew,
            },

            quantityTransferred:
              quantity,

            productTotalStock,

            movementId:
              transferOutMovement.id,

            transferOutMovementId:
              transferOutMovement.id,

            transferInMovementId:
              transferInMovement.id,
          },
        };
      },
    );
  }

  // ======================================================
  // STOCK ADJUSTMENT
  // ======================================================

  async stockAdjustment(
    dto: StockAdjustmentDto,
    userId?: string,
  ) {
    const {
      productId,
      quantity,
      adjustmentType,
      reason,
    } = dto;

    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(Product, {
            where: {
              id: productId,
            },
          });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        const previousStock =
          Number(
            product.stockQuantity ?? 0,
          );

        let newStock: number;
        let movementType: MovementType;

        if (
          adjustmentType ===
          'INCREASE'
        ) {
          newStock =
            previousStock +
            quantity;

          movementType =
            MovementType.ADJUSTMENT_IN;
        } else {
          if (
            quantity >
            previousStock
          ) {
            throw new BadRequestException(
              `Insufficient stock. Available stock: ${previousStock}`,
            );
          }

          newStock =
            previousStock -
            quantity;

          movementType =
            MovementType.ADJUSTMENT_OUT;
        }

        product.stockQuantity =
          newStock;

        await manager.save(
          Product,
          product,
        );

        const movement =
          manager.create(
            StockMovement,
            {
              product,

              movementType,

              quantity,

              previousStock,

              newStock,

              userId:
                userId ?? null,

              reason:
                reason ?? null,

              fromLocation: null,

              toLocation: null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        return {
          success: true,

          message:
            'Stock adjusted successfully',

          data: {
            productId:
              product.id,

            productName:
              product.productName,

            adjustmentType,

            quantityAdjusted:
              quantity,

            previousStock,

            newStock,

            reason:
              reason ?? null,

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  // ======================================================
  // PHYSICAL STOCK COUNT
  // ======================================================

  async physicalStockCount(
    dto: PhysicalStockCountDto,
    userId?: string,
  ) {
    const {
      productId,
      physicalQuantity,
      note,
    } = dto;

    if (physicalQuantity < 0) {
      throw new BadRequestException(
        'Physical quantity cannot be negative',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(Product, {
            where: {
              id: productId,
            },
          });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        const systemStock =
          Number(
            product.stockQuantity ?? 0,
          );

        const difference =
          physicalQuantity -
          systemStock;

        if (difference === 0) {
          return {
            success: true,

            message:
              'Physical count matches system stock',

            data: {
              productId:
                product.id,

              productName:
                product.productName,

              systemStock,

              physicalStock:
                physicalQuantity,

              difference: 0,

              newStock:
                systemStock,

              movementId: null,
            },
          };
        }

        product.stockQuantity =
          physicalQuantity;

        await manager.save(
          Product,
          product,
        );

        const movement =
          manager.create(
            StockMovement,
            {
              product,

              movementType:
                MovementType.PHYSICAL_COUNT,

              quantity:
                Math.abs(difference),

              previousStock:
                systemStock,

              newStock:
                physicalQuantity,

              userId:
                userId ?? null,

              reason:
                note ??
                `Physical stock count adjustment: ${
                  difference > 0
                    ? 'increase'
                    : 'decrease'
                }`,

              fromLocation: null,

              toLocation: null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        return {
          success: true,

          message:
            'Physical stock count applied successfully',

          data: {
            productId:
              product.id,

            productName:
              product.productName,

            systemStock,

            physicalStock:
              physicalQuantity,

            difference,

            newStock:
              physicalQuantity,

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  // ======================================================
  // DAMAGED / LOST ITEMS
  // ======================================================

  async recordDamagedLost(
    dto: DamagedLostDto,
    userId?: string,
  ) {
    const {
      productId,
      quantity,
      type,
      reason,
    } = dto;

    if (quantity <= 0) {
      throw new BadRequestException(
        'Quantity must be greater than 0',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(Product, {
            where: {
              id: productId,
            },
          });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found`,
          );
        }

        const previousStock =
          Number(
            product.stockQuantity ?? 0,
          );

        if (
          quantity >
          previousStock
        ) {
          throw new BadRequestException(
            `Insufficient stock. Available stock: ${previousStock}`,
          );
        }

        const newStock =
          previousStock -
          quantity;

        product.stockQuantity =
          newStock;

        await manager.save(
          Product,
          product,
        );

        const movementType =
          type ===
          DamagedLostType.DAMAGED
            ? MovementType.DAMAGED
            : MovementType.LOST;

        const movement =
          manager.create(
            StockMovement,
            {
              product,

              movementType,

              quantity,

              previousStock,

              newStock,

              reason:
                reason ?? null,

              userId:
                userId ?? null,

              fromLocation: null,

              toLocation: null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        return {
          success: true,

          message:
            type ===
            DamagedLostType.DAMAGED
              ? 'Damaged stock recorded successfully'
              : 'Lost stock recorded successfully',

          data: {
            productId:
              product.id,

            productName:
              product.productName,

            type,

            quantity,

            previousStock,

            newStock,

            reason:
              reason ?? null,

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  // ======================================================
  // MOVEMENT HISTORY
  // ======================================================

  async getMovements() {
    const movements =
      await this.stockMovementRepository.find({
        relations: {
          product: true,

          fromLocation: true,

          toLocation: true,
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

  // INVENTORY DASHBOARD  

  async getDashboard() {
    const products =
      await this.productRepository.find();

    const totalProducts =
      products.length;

    const totalStock =
      products.reduce(
        (total, product) =>
          total +
          Number(
            product.stockQuantity ?? 0,
          ),
        0,
      );

    const lowStockProducts =
      products
        .filter(
          (product) =>
            Number(
              product.reorderLevel ?? 0,
            ) > 0 &&
            Number(
              product.stockQuantity ?? 0,
            ) <=
              Number(
                product.reorderLevel ?? 0,
              ),
        )
        .map((product) => ({
          id: product.id,

          productName:
            product.productName,

          stockQuantity:
            Number(
              product.stockQuantity ?? 0,
            ),

          reorderLevel:
            Number(
              product.reorderLevel ?? 0,
            ),
        }));

    const locations =
      await this.locationRepository.count({
        where: {
          isActive: true,
        },
      });

    const recentMovements =
      await this.stockMovementRepository.find({
        relations: {
          product: true,

          fromLocation: true,

          toLocation: true,
        },

        order: {
          createdAt: 'DESC',
        },

        take: 5,
      });

    return {
      success: true,

      data: {
        summary: {
          totalProducts,

          totalStock,

          lowStock:
            lowStockProducts.length,

          locations,
        },

        recentMovements,

        lowStockProducts,
      },
    };
  }

  // CREATE LOCATION
  async createLocation(
    dto: CreateLocationDto,
  ) {
    const existing =
      await this.locationRepository.findOne({
        where: {
          name: dto.name,
        },
      });

    if (existing) {
      throw new BadRequestException(
        'Location already exists',
      );
    }

    const location =
      this.locationRepository.create({
        name: dto.name,

        description:
          dto.description,

        isActive:
          dto.isActive ?? true,
      });

    const saved =
      await this.locationRepository.save(
        location,
      );

    return {
      success: true,

      message:
        'Location created successfully',

      data: saved,
    };
  }
  // GET LOCATIONS

  async getLocations() {
    const locations =
      await this.locationRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });

    return {
      success: true,

      data: locations,
    };
  }
  // GET LOCATION

  async getLocation(
    id: string,
  ) {
    const location =
      await this.locationRepository.findOne({
        where: {
          id,
        },
      });

    if (!location) {
      throw new NotFoundException(
        `Location with ID ${id} not found`,
      );
    }

    return {
      success: true,

      data: location,
    };
  }

  // UPDATE LOCATION

  async updateLocation(
    id: string,
    dto: UpdateLocationDto,
  ) {
    const location =
      await this.locationRepository.findOne({
        where: {
          id,
        },
      });

    if (!location) {
      throw new NotFoundException(
        `Location with ID ${id} not found`,
      );
    }

    if (
      dto.name &&
      dto.name !== location.name
    ) {
      const existing =
        await this.locationRepository.findOne({
          where: {
            name: dto.name,
          },
        });

      if (existing) {
        throw new BadRequestException(
          'Location already exists',
        );
      }
    }

    Object.assign(
      location,
      dto,
    );

    const updated =
      await this.locationRepository.save(
        location,
      );

    return {
      success: true,

      message:
        'Location updated successfully',

      data: updated,
    };
  }

  // DELETE LOCATION

  async deleteLocation(
    id: string,
  ) {
    const location =
      await this.locationRepository.findOne({
        where: {
          id,
        },
      });

    if (!location) {
      throw new NotFoundException(
        `Location with ID ${id} not found`,
      );
    }

    await this.locationRepository.remove(
      location,
    );

    return {
      success: true,

      message:
        'Location deleted successfully',
    };
  }

  // LOCATION-WISE STOCK

  async getLocationStock(
    locationId: string,
  ) {
    const location =
      await this.locationRepository.findOne({
        where: {
          id: locationId,
        },
      });

    if (!location) {
      throw new NotFoundException(
        `Location with ID ${locationId} not found`,
      );
    }

    const stocks =
      await this.inventoryStockRepository.find({
        where: {
          location: {
            id: locationId,
          },
        },

        relations: {
          product: true,

          location: true,
        },

        order: {
          updatedAt: 'DESC',
        },
      });

    return {
      success: true,

      data: stocks,
    };
  }
}