import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import {MovementType,StockMovement} from './entities/stock-movement.entity';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { InventoryStock } from './entities/inventory-stock.entity';
import { StockTransferDto } from './dto/stock-transfer.dto';

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

  // ========================================
  // STOCK IN
  // ========================================

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
      const product = await manager.findOne(
        Product,
        {
          where: {
            id: productId,
          },
        },
      );

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${productId} not found`,
        );
      }

      // Location validation
      let location: Location | null = null;

      if (locationId) {
        location = await manager.findOne(
          Location,
          {
            where: {
              id: locationId,
              isActive: true,
            },
          },
        );

        if (!location) {
          throw new NotFoundException(
            `Location with ID ${locationId} not found`,
          );
        }
      }

      // Product total stock
      const previousStock =
        Number(product.stockQuantity ?? 0);

      const newStock =
        previousStock + quantity;

      product.stockQuantity = newStock;

      await manager.save(Product, product);

      // Location-wise stock
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
          Number(inventoryStock.quantity ?? 0);

        locationNewStock =
          locationPreviousStock + quantity;

        inventoryStock.quantity =
          locationNewStock;

        await manager.save(
          InventoryStock,
          inventoryStock,
        );
      }

      // Movement
      const movement =
        manager.create(StockMovement, {
          product,
          movementType: MovementType.IN,
          quantity,
          previousStock,
          newStock,
          userId,
        });

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
          locationId:
            location?.id ?? null,
          locationName:
            location?.name ?? null,
          quantityAdded: quantity,
          previousStock,
          newStock,
          locationPreviousStock,
          locationNewStock,
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
      const product = await manager.findOne(
        Product,
        {
          where: {
            id: productId,
          },
        },
      );

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${productId} not found`,
        );
      }

      // Location validation
      let location: Location | null = null;

      if (locationId) {
        location = await manager.findOne(
          Location,
          {
            where: {
              id: locationId,
              isActive: true,
            },
          },
        );

        if (!location) {
          throw new NotFoundException(
            `Location with ID ${locationId} not found`,
          );
        }
      }

      const previousStock =
        Number(product.stockQuantity ?? 0);

      // Check total stock
      if (quantity > previousStock) {
        throw new BadRequestException(
          `Insufficient stock. Available stock: ${previousStock}`,
        );
      }

      let locationPreviousStock = 0;
      let locationNewStock = 0;

      // Location stock
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
          locationPreviousStock - quantity;

        inventoryStock.quantity =
          locationNewStock;

        await manager.save(
          InventoryStock,
          inventoryStock,
        );
      }

      // Update total product stock
      const newStock =
        previousStock - quantity;

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
          locationId:
            location?.id ?? null,
          locationName:
            location?.name ?? null,
          quantityRemoved: quantity,
          previousStock,
          newStock,
          locationPreviousStock,
          locationNewStock,
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


  async createLocation(
  dto: CreateLocationDto,
) {
  const existing = await this.dataSource
    .getRepository(Location)
    .findOne({
      where: {
        name: dto.name,
      },
    });

  if (existing) {
    throw new BadRequestException(
      'Location already exists',
    );
  }

  const location = this.dataSource
    .getRepository(Location)
    .create({
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

  const saved = await this.dataSource
    .getRepository(Location)
    .save(location);

  return {
    success: true,
    message: 'Location created successfully',
    data: saved,
  };
}

async getLocations() {
  const locations = await this.dataSource
    .getRepository(Location)
    .find({
      order: {
        createdAt: 'DESC',
      },
    });

  return {
    success: true,
    data: locations,
  };
}

async getLocation(id: string) {
  const location = await this.dataSource
    .getRepository(Location)
    .findOne({
      where: { id },
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

async updateLocation(
  id: string,
  dto: UpdateLocationDto,
) {
  const repository =
    this.dataSource.getRepository(Location);

  const location = await repository.findOne({
    where: { id },
  });

  if (!location) {
    throw new NotFoundException(
      `Location with ID ${id} not found`,
    );
  }

  if (dto.name && dto.name !== location.name) {
    const existing = await repository.findOne({
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

  Object.assign(location, dto);

  const updated =
    await repository.save(location);

  return {
    success: true,
    message: 'Location updated successfully',
    data: updated,
  };
}

async deleteLocation(id: string) {
  const repository =
    this.dataSource.getRepository(Location);

  const location = await repository.findOne({
    where: { id },
  });

  if (!location) {
    throw new NotFoundException(
      `Location with ID ${id} not found`,
    );
  }

  await repository.remove(location);

  return {
    success: true,
    message: 'Location deleted successfully',
  };
}

async getLocationStock(locationId: string) {
  const location =
    await this.dataSource
      .getRepository(Location)
      .findOne({
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
    await this.dataSource
      .getRepository(InventoryStock)
      .find({
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

  if (fromLocationId === toLocationId) {
    throw new BadRequestException(
      'Source and destination locations must be different',
    );
  }

  return this.dataSource.transaction(
    async (manager) => {
      const product = await manager.findOne(
        Product,
        {
          where: { id: productId },
        },
      );

      if (!product) {
        throw new NotFoundException(
          'Product not found',
        );
      }

      const fromLocation =
        await manager.findOne(Location, {
          where: {
            id: fromLocationId,
            isActive: true,
          },
        });

      const toLocation =
        await manager.findOne(Location, {
          where: {
            id: toLocationId,
            isActive: true,
          },
        });

      if (!fromLocation) {
        throw new NotFoundException(
          'Source location not found',
        );
      }

      if (!toLocation) {
        throw new NotFoundException(
          'Destination location not found',
        );
      }

      const sourceStock =
        await manager.findOne(
          InventoryStock,
          {
            where: {
              product: { id: productId },
              location: {
                id: fromLocationId,
              },
            },
          },
        );

      if (!sourceStock) {
        throw new BadRequestException(
          'Product has no stock in source location',
        );
      }

      const availableStock =
        Number(sourceStock.quantity ?? 0);

      if (quantity > availableStock) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${availableStock}`,
        );
      }

      let destinationStock =
        await manager.findOne(
          InventoryStock,
          {
            where: {
              product: { id: productId },
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

      const sourcePrevious =
        availableStock;

      const sourceNew =
        sourcePrevious - quantity;

      const destinationPrevious =
        Number(
          destinationStock.quantity ?? 0,
        );

      const destinationNew =
        destinationPrevious + quantity;

      sourceStock.quantity =
        sourceNew;

      destinationStock.quantity =
        destinationNew;

      await manager.save(
        InventoryStock,
        sourceStock,
      );

      await manager.save(
        InventoryStock,
        destinationStock,
      );

      // Product total stock does NOT change
      // because stock only moved between locations.

      const movement =
        manager.create(StockMovement, {
          product,
          movementType:
            MovementType.TRANSFER_OUT,
          quantity,
          previousStock:
            sourcePrevious,
          newStock: sourceNew,
          userId,
        });

      await manager.save(
        StockMovement,
        movement,
      );

      return {
        success: true,
        message:
          'Stock transferred successfully',
        data: {
          productId: product.id,
          productName:
            product.productName,

          fromLocation: {
            id: fromLocation.id,
            name: fromLocation.name,
            previousStock:
              sourcePrevious,
            newStock: sourceNew,
          },

          toLocation: {
            id: toLocation.id,
            name: toLocation.name,
            previousStock:
              destinationPrevious,
            newStock: destinationNew,
          },

          quantityTransferred:
            quantity,

          movementId:
            movement.id,
        },
      };
    },
  );
}
}
