import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  EntityManager,
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

import { UserRole } from '../users/user-role.enum';

/* ============================================================
   ACCESS CONTEXT
   ============================================================ */

export interface InventoryAccessContext {
  userId?: string;
  role?: UserRole | string;
  locationId?: string | null;
}

type InventoryContextInput =
  | InventoryAccessContext
  | string
  | undefined;

/* ============================================================
   SERVICE
   ============================================================ */

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

  /* ==========================================================
     CONTEXT NORMALIZER
     ========================================================== */

  private normalizeContext(
    input?: InventoryContextInput,
  ): InventoryAccessContext {
    /*
     * New controller:
     *
     * {
     *   userId,
     *   role,
     *   locationId
     * }
     */
    if (
      input &&
      typeof input === 'object'
    ) {
      return input;
    }

    /*
     * Legacy internal call:
     *
     * stockIn(dto, userId)
     * stockOut(dto, userId)
     *
     * Do NOT give this OWNER access.
     *
     * This is only retained for compatibility.
     */
    if (typeof input === 'string') {
      return {
        userId: input,
        role: undefined,
        locationId: null,
      };
    }

    /*
     * Internal system operation.
     *
     * Purchasing / GRN / Purchase Return
     * currently call stockIn(dto) / stockOut(dto).
     */
    return {
      userId: undefined,
      role: UserRole.OWNER,
      locationId: null,
    };
  }

  /* ==========================================================
     GLOBAL ACCESS
     ========================================================== */

  private isGlobalAccess(
    context: InventoryAccessContext,
  ): boolean {
    return (
      context.role === UserRole.OWNER ||
      context.role === UserRole.ADMIN ||
      context.role === 'OWNER' ||
      context.role === 'ADMIN'
    );
  }

  /* ==========================================================
     RESOLVE LOCATION
     ========================================================== */

  private resolveLocationId(
    context: InventoryAccessContext,
    requestedLocationId?: string | null,
  ): string | null {
    /*
     * OWNER / ADMIN
     *
     * Can operate on any branch.
     */
    if (this.isGlobalAccess(context)) {
      return requestedLocationId ?? null;
    }

    /*
     * MANAGER
     *
     * Only assigned branch.
     */
    if (
      context.role === UserRole.MANAGER ||
      context.role === 'MANAGER'
    ) {
      if (!context.locationId) {
        throw new ForbiddenException(
          'Manager is not assigned to a branch',
        );
      }

      if (
        requestedLocationId &&
        requestedLocationId !== context.locationId
      ) {
        throw new ForbiddenException(
          'You can only access your assigned branch',
        );
      }

      return context.locationId;
    }

    throw new ForbiddenException(
      'You do not have permission to perform this inventory operation',
    );
  }

  /* ==========================================================
     TRANSFER ACCESS
     ========================================================== */

  private validateTransferAccess(
    context: InventoryAccessContext,
    fromLocationId: string,
  ): void {
    if (this.isGlobalAccess(context)) {
      return;
    }

    if (
      context.role === UserRole.MANAGER ||
      context.role === 'MANAGER'
    ) {
      if (!context.locationId) {
        throw new ForbiddenException(
          'Manager is not assigned to a branch',
        );
      }

      if (
        fromLocationId !== context.locationId
      ) {
        throw new ForbiddenException(
          'You can only transfer stock from your assigned branch',
        );
      }

      return;
    }

    throw new ForbiddenException(
      'You do not have permission to transfer stock',
    );
  }

  /* ==========================================================
     RECALCULATE TOTAL PRODUCT STOCK
     ========================================================== */

  private async recalculateProductTotalStock(
    manager: EntityManager,
    productId: string,
  ): Promise<number> {
    const stocks =
      await manager.find(InventoryStock, {
        where: {
          product: {
            id: productId,
          },
        },
      });

    const totalStock =
      stocks.reduce(
        (total, stock) =>
          total +
          Number(stock.quantity ?? 0),
        0,
      );

    const product =
      await manager.findOne(Product, {
        where: {
          id: productId,
        },
      });

    if (product) {
      product.stockQuantity =
        totalStock;

      await manager.save(
        Product,
        product,
      );
    }

    return totalStock;
  }

  /* ==========================================================
     STOCK IN
     ========================================================== */

  async stockIn(
    stockInDto: StockInDto,
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(contextInput);

    const {
      productId,
      quantity,
    } = stockInDto;

    const requestedLocationId =
      (stockInDto as StockInDto & {
        locationId?: string | null;
      }).locationId;

    if (!productId) {
      throw new BadRequestException(
        'Product is required',
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

    const locationId =
      this.resolveLocationId(
        context,
        requestedLocationId,
      );

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(
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

        let location:
          | Location
          | null = null;

        if (locationId) {
          location =
            await manager.findOne(
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

        const previousGlobalStock =
          Number(
            product.stockQuantity ?? 0,
          );

        let previousStock =
          previousGlobalStock;

        let newStock =
          previousGlobalStock;

        let locationPreviousStock = 0;
        let locationNewStock = 0;

        /*
         * BRANCH STOCK
         */
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
                    id: location.id,
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

          previousStock =
            locationPreviousStock;

          newStock =
            locationNewStock;

          await this.recalculateProductTotalStock(
            manager,
            productId,
          );
        }

        /*
         * GLOBAL / LEGACY STOCK
         */
        else {
          newStock =
            previousGlobalStock +
            quantity;

          product.stockQuantity =
            newStock;

          await manager.save(
            Product,
            product,
          );
        }

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
                context.userId ?? null,

              reason: null,

              fromLocation: null,

              toLocation:
                location,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        const latestProduct =
          await manager.findOne(
            Product,
            {
              where: {
                id: productId,
              },
            },
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

            totalStock:
              Number(
                latestProduct?.stockQuantity ??
                  newStock,
              ),

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  /* ==========================================================
     STOCK OUT
     ========================================================== */

  async stockOut(
    stockOutDto: StockOutDto,
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(contextInput);

    const {
      productId,
      quantity,
    } = stockOutDto;

    const requestedLocationId =
      (stockOutDto as StockOutDto & {
        locationId?: string | null;
      }).locationId;

    if (!productId) {
      throw new BadRequestException(
        'Product is required',
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

    const locationId =
      this.resolveLocationId(
        context,
        requestedLocationId,
      );

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(
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

        let location:
          | Location
          | null = null;

        if (locationId) {
          location =
            await manager.findOne(
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

        const previousGlobalStock =
          Number(
            product.stockQuantity ?? 0,
          );

        let previousStock =
          previousGlobalStock;

        let newStock =
          previousGlobalStock;

        let locationPreviousStock = 0;
        let locationNewStock = 0;

        /*
         * BRANCH STOCK
         */
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
                    id: location.id,
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
              `Insufficient stock at ${location.name}. Available stock: ${locationPreviousStock}`,
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

          previousStock =
            locationPreviousStock;

          newStock =
            locationNewStock;

          await this.recalculateProductTotalStock(
            manager,
            productId,
          );
        }

        /*
         * GLOBAL STOCK
         */
        else {
          if (
            quantity >
            previousGlobalStock
          ) {
            throw new BadRequestException(
              `Insufficient stock. Available stock: ${previousGlobalStock}`,
            );
          }

          newStock =
            previousGlobalStock -
            quantity;

          product.stockQuantity =
            newStock;

          await manager.save(
            Product,
            product,
          );
        }

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
                context.userId ?? null,

              reason: null,

              fromLocation:
                location,

              toLocation: null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        const latestProduct =
          await manager.findOne(
            Product,
            {
              where: {
                id: productId,
              },
            },
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

            totalStock:
              Number(
                latestProduct?.stockQuantity ??
                  newStock,
              ),

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  /* ==========================================================
     STOCK TRANSFER
     ========================================================== */

  async stockTransfer(
    dto: StockTransferDto,
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(contextInput);

    const {
      productId,
      quantity,
      fromLocationId,
      toLocationId,
    } = dto;

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

    this.validateTransferAccess(
      context,
      fromLocationId,
    );

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(
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

        if (
          quantity >
          sourcePrevious
        ) {
          throw new BadRequestException(
            `Insufficient stock at ${fromLocation.name}. Available stock: ${sourcePrevious}`,
          );
        }

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

        const destinationPrevious =
          Number(
            destinationStock.quantity ??
              0,
          );

        const sourceNew =
          sourcePrevious -
          quantity;

        const destinationNew =
          destinationPrevious +
          quantity;

        sourceStock.quantity =
          sourceNew;

        await manager.save(
          InventoryStock,
          sourceStock,
        );

        destinationStock.quantity =
          destinationNew;

        await manager.save(
          InventoryStock,
          destinationStock,
        );

        const productTotalStock =
          await this.recalculateProductTotalStock(
            manager,
            productId,
          );

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
                context.userId ?? null,

              reason: null,

              fromLocation,

              toLocation,
            },
          );

        await manager.save(
          StockMovement,
          transferOutMovement,
        );

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
                context.userId ?? null,

              reason: null,

              fromLocation,

              toLocation,
            },
          );

        await manager.save(
          StockMovement,
          transferInMovement,
        );

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

  /* ==========================================================
     STOCK ADJUSTMENT
     ========================================================== */

  async stockAdjustment(
    dto: StockAdjustmentDto,
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(contextInput);

    const {
      productId,
      quantity,
      adjustmentType,
      reason,
    } = dto;

    const requestedLocationId =
      (dto as StockAdjustmentDto & {
        locationId?: string | null;
      }).locationId;

    if (!productId) {
      throw new BadRequestException(
        'Product is required',
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

    if (
      adjustmentType !== 'INCREASE' &&
      adjustmentType !== 'DECREASE'
    ) {
      throw new BadRequestException(
        'Invalid adjustment type',
      );
    }

    const locationId =
      this.resolveLocationId(
        context,
        requestedLocationId,
      );

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(
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

        let location:
          | Location
          | null = null;

        if (locationId) {
          location =
            await manager.findOne(
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

        let previousStock = 0;
        let newStock = 0;

        let movementType:
          | MovementType;

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
                    id: location.id,
                  },
                },
              },
            );

          if (!inventoryStock) {
            if (
              adjustmentType ===
              'DECREASE'
            ) {
              throw new BadRequestException(
                'Product has no stock in this location',
              );
            }

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

          previousStock =
            Number(
              inventoryStock.quantity ?? 0,
            );

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
                `Insufficient stock at ${location.name}. Available stock: ${previousStock}`,
              );
            }

            newStock =
              previousStock -
              quantity;

            movementType =
              MovementType.ADJUSTMENT_OUT;
          }

          inventoryStock.quantity =
            newStock;

          await manager.save(
            InventoryStock,
            inventoryStock,
          );

          await this.recalculateProductTotalStock(
            manager,
            productId,
          );
        } else {
          previousStock =
            Number(
              product.stockQuantity ?? 0,
            );

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
        }

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
                context.userId ?? null,

              reason:
                reason ?? null,

              fromLocation:
                adjustmentType ===
                'DECREASE'
                  ? location
                  : null,

              toLocation:
                adjustmentType ===
                'INCREASE'
                  ? location
                  : null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        const latestProduct =
          await manager.findOne(
            Product,
            {
              where: {
                id: productId,
              },
            },
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

            locationId:
              location?.id ?? null,

            locationName:
              location?.name ?? null,

            adjustmentType,

            quantityAdjusted:
              quantity,

            previousStock,

            newStock,

            totalStock:
              Number(
                latestProduct?.stockQuantity ??
                  newStock,
              ),

            reason:
              reason ?? null,

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  /* ==========================================================
     PHYSICAL STOCK COUNT
     ========================================================== */

  async physicalStockCount(
    dto: PhysicalStockCountDto,
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(contextInput);

    const {
      productId,
      physicalQuantity,
      note,
    } = dto;

    const requestedLocationId =
      (dto as PhysicalStockCountDto & {
        locationId?: string | null;
      }).locationId;

    if (!productId) {
      throw new BadRequestException(
        'Product is required',
      );
    }

    if (
      physicalQuantity === undefined ||
      physicalQuantity === null
    ) {
      throw new BadRequestException(
        'Physical quantity is required',
      );
    }

    if (physicalQuantity < 0) {
      throw new BadRequestException(
        'Physical quantity cannot be negative',
      );
    }

    const locationId =
      this.resolveLocationId(
        context,
        requestedLocationId,
      );

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(
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

        let location:
          | Location
          | null = null;

        let inventoryStock:
          | InventoryStock
          | null = null;

        if (locationId) {
          location =
            await manager.findOne(
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

          inventoryStock =
            await manager.findOne(
              InventoryStock,
              {
                where: {
                  product: {
                    id: productId,
                  },
                  location: {
                    id: location.id,
                  },
                },
              },
            );
        }

        const systemStock =
          location
            ? Number(
                inventoryStock?.quantity ??
                  0,
              )
            : Number(
                product.stockQuantity ??
                  0,
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

              locationId:
                location?.id ?? null,

              locationName:
                location?.name ?? null,

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

        if (location) {
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

          inventoryStock.quantity =
            physicalQuantity;

          await manager.save(
            InventoryStock,
            inventoryStock,
          );

          await this.recalculateProductTotalStock(
            manager,
            productId,
          );
        } else {
          product.stockQuantity =
            physicalQuantity;

          await manager.save(
            Product,
            product,
          );
        }

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
                context.userId ?? null,

              reason:
                note ??
                `Physical stock count adjustment: ${
                  difference > 0
                    ? 'increase'
                    : 'decrease'
                }`,

              fromLocation:
                difference < 0
                  ? location
                  : null,

              toLocation:
                difference > 0
                  ? location
                  : null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        const latestProduct =
          await manager.findOne(
            Product,
            {
              where: {
                id: productId,
              },
            },
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

            locationId:
              location?.id ?? null,

            locationName:
              location?.name ?? null,

            systemStock,

            physicalStock:
              physicalQuantity,

            difference,

            newStock:
              physicalQuantity,

            totalStock:
              Number(
                latestProduct?.stockQuantity ??
                  physicalQuantity,
              ),

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  /* ==========================================================
     DAMAGED / LOST
     ========================================================== */

  async recordDamagedLost(
    dto: DamagedLostDto,
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(contextInput);

    const {
      productId,
      quantity,
      type,
      reason,
    } = dto;

    const requestedLocationId =
      (dto as DamagedLostDto & {
        locationId?: string | null;
      }).locationId;

    if (!productId) {
      throw new BadRequestException(
        'Product is required',
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

    if (
      type !==
        DamagedLostType.DAMAGED &&
      type !==
        DamagedLostType.LOST
    ) {
      throw new BadRequestException(
        'Invalid damaged/lost type',
      );
    }

    const locationId =
      this.resolveLocationId(
        context,
        requestedLocationId,
      );

    return this.dataSource.transaction(
      async (manager) => {
        const product =
          await manager.findOne(
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

        let location:
          | Location
          | null = null;

        if (locationId) {
          location =
            await manager.findOne(
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

        let previousStock = 0;
        let newStock = 0;

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
                    id: location.id,
                  },
                },
              },
            );

          if (!inventoryStock) {
            throw new BadRequestException(
              `Product has no stock at ${location.name}`,
            );
          }

          previousStock =
            Number(
              inventoryStock.quantity ?? 0,
            );

          if (
            quantity >
            previousStock
          ) {
            throw new BadRequestException(
              `Insufficient stock at ${location.name}. Available stock: ${previousStock}`,
            );
          }

          newStock =
            previousStock -
            quantity;

          inventoryStock.quantity =
            newStock;

          await manager.save(
            InventoryStock,
            inventoryStock,
          );

          await this.recalculateProductTotalStock(
            manager,
            productId,
          );
        } else {
          previousStock =
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

          newStock =
            previousStock -
            quantity;

          product.stockQuantity =
            newStock;

          await manager.save(
            Product,
            product,
          );
        }

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
                context.userId ?? null,

              fromLocation:
                location,

              toLocation: null,
            },
          );

        await manager.save(
          StockMovement,
          movement,
        );

        const latestProduct =
          await manager.findOne(
            Product,
            {
              where: {
                id: productId,
              },
            },
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

            locationId:
              location?.id ?? null,

            locationName:
              location?.name ?? null,

            type,

            quantity,

            previousStock,

            newStock,

            totalStock:
              Number(
                latestProduct?.stockQuantity ??
                  newStock,
              ),

            reason:
              reason ?? null,

            movementId:
              movement.id,
          },
        };
      },
    );
  }

  /* ==========================================================
     MOVEMENTS
     ========================================================== */

  async getMovements(
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(
        contextInput,
      );

    /*
     * OWNER / ADMIN
     */
    if (
      this.isGlobalAccess(context)
    ) {
      const movements =
        await this.stockMovementRepository.find(
          {
            relations: {
              product: true,
              fromLocation: true,
              toLocation: true,
            },

            order: {
              createdAt: 'DESC',
            },
          },
        );

      return {
        success: true,
        data: movements,
      };
    }

    /*
     * MANAGER
     */
    const locationId =
      this.resolveLocationId(
        context,
      );

    if (!locationId) {
      throw new ForbiddenException(
        'Manager is not assigned to a branch',
      );
    }

    const movements =
      await this.stockMovementRepository.find(
        {
          where: [
            {
              fromLocation: {
                id: locationId,
              },
            },
            {
              toLocation: {
                id: locationId,
              },
            },
          ],

          relations: {
            product: true,
            fromLocation: true,
            toLocation: true,
          },

          order: {
            createdAt: 'DESC',
          },
        },
      );

    return {
      success: true,
      data: movements,
    };
  }

  /* ==========================================================
     DASHBOARD
     ========================================================== */

  async getDashboard(
    contextInput?: InventoryContextInput,
  ) {
    const context =
      this.normalizeContext(
        contextInput,
      );

    /*
     * OWNER / ADMIN
     */
    if (
      this.isGlobalAccess(context)
    ) {
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
          .filter((product) => {
            const reorderLevel =
              Number(
                product.reorderLevel ?? 0,
              );

            const stock =
              Number(
                product.stockQuantity ?? 0,
              );

            return (
              reorderLevel > 0 &&
              stock <= reorderLevel
            );
          })
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
        await this.locationRepository.count(
          {
            where: {
              isActive: true,
            },
          },
        );

      const recentMovements =
        await this.stockMovementRepository.find(
          {
            relations: {
              product: true,
              fromLocation: true,
              toLocation: true,
            },

            order: {
              createdAt: 'DESC',
            },

            take: 5,
          },
        );

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

    /*
     * MANAGER
     */
    const locationId =
      this.resolveLocationId(
        context,
      );

    if (!locationId) {
      throw new ForbiddenException(
        'Manager is not assigned to a branch',
      );
    }

    const location =
      await this.locationRepository.findOne(
        {
          where: {
            id: locationId,
            isActive: true,
          },
        },
      );

    if (!location) {
      throw new NotFoundException(
        'Assigned branch not found or inactive',
      );
    }

    const stocks =
      await this.inventoryStockRepository.find(
        {
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
        },
      );

    const totalProducts =
      new Set(
        stocks.map(
          (stock) =>
            stock.product.id,
        ),
      ).size;

    const totalStock =
      stocks.reduce(
        (total, stock) =>
          total +
          Number(
            stock.quantity ?? 0,
          ),
        0,
      );

    const lowStockProducts =
      stocks
        .filter((stock) => {
          const reorderLevel =
            Number(
              stock.product.reorderLevel ??
                0,
            );

          const quantity =
            Number(
              stock.quantity ?? 0,
            );

          return (
            reorderLevel > 0 &&
            quantity <= reorderLevel
          );
        })
        .map((stock) => ({
          id:
            stock.product.id,

          productName:
            stock.product.productName,

          stockQuantity:
            Number(
              stock.quantity ?? 0,
            ),

          reorderLevel:
            Number(
              stock.product.reorderLevel ??
                0,
            ),

          locationId:
            location.id,

          locationName:
            location.name,
        }));

    const recentMovements =
      await this.stockMovementRepository.find(
        {
          where: [
            {
              fromLocation: {
                id: locationId,
              },
            },
            {
              toLocation: {
                id: locationId,
              },
            },
          ],

          relations: {
            product: true,
            fromLocation: true,
            toLocation: true,
          },

          order: {
            createdAt: 'DESC',
          },

          take: 5,
        },
      );

    return {
      success: true,

      data: {
        summary: {
          totalProducts,

          totalStock,

          lowStock:
            lowStockProducts.length,

          locations: 1,

          locationId:
            location.id,

          locationName:
            location.name,
        },

        recentMovements,

        lowStockProducts,
      },
    };
  }

  /* ==========================================================
     CREATE LOCATION / BRANCH
     ========================================================== */

  async createLocation(
    dto: CreateLocationDto,
  ) {
    const existing =
      await this.locationRepository.findOne(
        {
          where: {
            name: dto.name,
          },
        },
      );

    if (existing) {
      throw new BadRequestException(
        'Location already exists',
      );
    }

    const location =
      this.locationRepository.create(
        {
          name: dto.name,

          description:
            dto.description,

          isActive:
            dto.isActive ?? true,
        },
      );

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

  /* ==========================================================
     GET LOCATIONS / BRANCHES
     ========================================================== */

  async getLocations() {
    const locations =
      await this.locationRepository.find(
        {
          order: {
            createdAt: 'DESC',
          },
        },
      );

    return {
      success: true,
      data: locations,
    };
  }

  /* ==========================================================
     GET SINGLE LOCATION
     ========================================================== */

  async getLocation(
    id: string,
  ) {
    const location =
      await this.locationRepository.findOne(
        {
          where: {
            id,
          },
        },
      );

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

  /* ==========================================================
     UPDATE LOCATION
     ========================================================== */

  async updateLocation(
    id: string,
    dto: UpdateLocationDto,
  ) {
    const location =
      await this.locationRepository.findOne(
        {
          where: {
            id,
          },
        },
      );

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
        await this.locationRepository.findOne(
          {
            where: {
              name: dto.name,
            },
          },
        );

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

  /* ==========================================================
     DELETE LOCATION
     ========================================================== */

  async deleteLocation(
    id: string,
  ) {
    const location =
      await this.locationRepository.findOne(
        {
          where: {
            id,
          },
        },
      );

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

  /* ==========================================================
     LOCATION STOCK
     ========================================================== */

  async getLocationStock(
    locationId: string,
  ) {
    const location =
      await this.locationRepository.findOne(
        {
          where: {
            id: locationId,
          },
        },
      );

    if (!location) {
      throw new NotFoundException(
        `Location with ID ${locationId} not found`,
      );
    }

    const stocks =
      await this.inventoryStockRepository.find(
        {
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
        },
      );

    return {
      success: true,
      data: stocks,
    };
  }
}