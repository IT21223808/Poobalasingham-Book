import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  In,
  QueryRunner,
  Repository,
} from 'typeorm';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../entities/purchase-order.entity';

import { PurchaseOrderItem } from '../entities/purchase-order-item.entity';

import {
  PurchaseRequisition,
  PurchaseRequisitionStatus,
} from '../entities/purchase-requisition.entity';

import { Product } from '../../products/entities/product.entity';

import { Supplier } from '../../suppliers/entities/supplier.entity';

import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';

import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,

    @InjectRepository(PurchaseOrderItem)
    private readonly purchaseOrderItemRepository: Repository<PurchaseOrderItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(PurchaseRequisition)
    private readonly purchaseRequisitionRepository: Repository<PurchaseRequisition>,

    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,

    private readonly dataSource: DataSource,
  ) {}

  // ============================================================
  // CREATE PURCHASE ORDER
  // ============================================================

  async createPurchaseOrder(
    dto: CreatePurchaseOrderDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ========================================================
      // BASIC VALIDATION
      // ========================================================

      if (
        dto.requisitionId === undefined ||
        dto.requisitionId === null
      ) {
        throw new BadRequestException(
          'Purchase requisition is required',
        );
      }

      if (
        dto.supplierId === undefined ||
        dto.supplierId === null
      ) {
        throw new BadRequestException(
          'Supplier is required',
        );
      }

      if (
        !Number.isInteger(
          Number(dto.supplierId),
        ) ||
        Number(dto.supplierId) <= 0
      ) {
        throw new BadRequestException(
          'A valid supplier is required',
        );
      }

      if (!dto.poDate) {
        throw new BadRequestException(
          'PO date is required',
        );
      }

      if (!dto.expectedDeliveryDate) {
        throw new BadRequestException(
          'Expected delivery date is required',
        );
      }

      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase order item is required',
        );
      }

      // ========================================================
      // DATE VALIDATION
      // ========================================================

      const poDate = new Date(dto.poDate);

      const expectedDeliveryDate =
        new Date(dto.expectedDeliveryDate);

      if (
        Number.isNaN(
          poDate.getTime(),
        )
      ) {
        throw new BadRequestException(
          'Invalid PO date',
        );
      }

      if (
        Number.isNaN(
          expectedDeliveryDate.getTime(),
        )
      ) {
        throw new BadRequestException(
          'Invalid expected delivery date',
        );
      }

      if (
        expectedDeliveryDate.getTime() <
        poDate.getTime()
      ) {
        throw new BadRequestException(
          'Expected delivery date cannot be before PO date',
        );
      }

      // ========================================================
      // FIND REQUISITION
      // ========================================================

      const requisition =
        await queryRunner.manager.findOne(
          PurchaseRequisition,
          {
            where: {
              id: dto.requisitionId,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!requisition) {
        throw new NotFoundException(
          `Purchase requisition ${dto.requisitionId} not found`,
        );
      }

      // ========================================================
      // REQUISITION STATUS
      // ========================================================

      if (
        requisition.status ===
        PurchaseRequisitionStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled requisition cannot be converted to purchase order',
        );
      }

      if (
        requisition.status !==
        PurchaseRequisitionStatus.APPROVED
      ) {
        throw new BadRequestException(
          `Purchase order can only be created from an APPROVED requisition. Current status: ${requisition.status}`,
        );
      }

      // ========================================================
      // VALIDATE SUPPLIER
      // ========================================================

      const supplierId =
        Number(dto.supplierId);

      const supplier =
        await queryRunner.manager.findOne(
          Supplier,
          {
            where: {
              id: supplierId,
            },
          },
        );

      if (!supplier) {
        throw new NotFoundException(
          `Supplier ${supplierId} not found`,
        );
      }

      // If your Supplier entity has isActive
      if (
        'isActive' in supplier &&
        supplier.isActive === false
      ) {
        throw new BadRequestException(
          'Selected supplier is inactive',
        );
      }

      // ========================================================
      // PRODUCT IDS
      // ========================================================

      const productIds =
        dto.items.map(
          (item) => item.productId,
        );

      const uniqueProductIds = [
        ...new Set(productIds),
      ];

      // ========================================================
      // DUPLICATE PRODUCTS
      // ========================================================

      if (
        uniqueProductIds.length !==
        productIds.length
      ) {
        throw new BadRequestException(
          'Duplicate products are not allowed in purchase order',
        );
      }

      // ========================================================
      // VALIDATE PRODUCTS
      // ========================================================

      const products =
        await queryRunner.manager.findBy(
          Product,
          {
            id: In(uniqueProductIds),
          },
        );

      if (
        products.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      // ========================================================
      // VALIDATE REQUISITION ITEMS
      // ========================================================

      for (const item of dto.items) {
        const requisitionItem =
          requisition.items.find(
            (reqItem) =>
              String(
                reqItem.productId,
              ) ===
              String(
                item.productId,
              ),
          );

        if (!requisitionItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of the purchase requisition`,
          );
        }

        if (
          !Number.isFinite(
            Number(item.quantity),
          ) ||
          Number(item.quantity) <= 0
        ) {
          throw new BadRequestException(
            `Quantity for product ${item.productId} must be greater than 0`,
          );
        }

        if (
          Number(item.quantity) >
          Number(requisitionItem.quantity)
        ) {
          throw new BadRequestException(
            `PO quantity for product ${item.productId} cannot exceed requisition quantity ${requisitionItem.quantity}`,
          );
        }

        if (
          !Number.isFinite(
            Number(item.unitPrice),
          ) ||
          Number(item.unitPrice) < 0
        ) {
          throw new BadRequestException(
            `Unit price for product ${item.productId} cannot be negative`,
          );
        }
      }

      // ========================================================
      // AMOUNTS
      // ========================================================

      const discountAmount =
        Number(dto.discountAmount ?? 0);

      const taxAmount =
        Number(dto.taxAmount ?? 0);

      if (
        !Number.isFinite(
          discountAmount,
        ) ||
        discountAmount < 0
      ) {
        throw new BadRequestException(
          'Discount amount cannot be negative',
        );
      }

      if (
        !Number.isFinite(
          taxAmount,
        ) ||
        taxAmount < 0
      ) {
        throw new BadRequestException(
          'Tax amount cannot be negative',
        );
      }

      // ========================================================
      // CALCULATE SUBTOTAL
      // ========================================================

      let subtotal = 0;

      const items = dto.items.map(
        (item) => {
          const quantity =
            Number(item.quantity);

          const unitPrice =
            Number(item.unitPrice);

          const itemSubtotal =
            quantity * unitPrice;

          subtotal += itemSubtotal;

          return {
            productId:
              item.productId,

            quantity,

            unitPrice,

            subtotal:
              itemSubtotal,
          };
        },
      );

      // ========================================================
      // FINAL TOTAL
      // ========================================================

      const totalAmount =
        Math.max(
          0,
          subtotal -
            discountAmount +
            taxAmount,
        );

      // ========================================================
      // GENERATE PO NUMBER
      // ========================================================

      const poNumber =
        await this.generatePurchaseOrderNumber(
          queryRunner,
        );

      // ========================================================
      // CREATE PURCHASE ORDER
      // ========================================================

      const purchaseOrder =
        queryRunner.manager.create(
          PurchaseOrder,
          {
            poNumber,

            requisitionId:
              dto.requisitionId,

            supplierId,

            poDate,

            expectedDeliveryDate,

            discountAmount,

            taxAmount,

            totalAmount,

            notes: dto.notes?.trim() || null,

            status:
              PurchaseOrderStatus.PENDING,
          },
        );

      // ========================================================
      // SAVE PURCHASE ORDER
      // ========================================================

      const savedPO =
        await queryRunner.manager.save(
          PurchaseOrder,
          purchaseOrder,
        );

      // ========================================================
      // CREATE PURCHASE ORDER ITEMS
      // ========================================================

      const purchaseOrderItems =
        items.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseOrderItem,
              {
                purchaseOrderId:
                  savedPO.id,

                productId:
                  item.productId,

                quantity:
                  item.quantity,

                unitPrice:
                  item.unitPrice,

                subtotal:
                  item.subtotal,
              },
            ),
        );

      await queryRunner.manager.save(
        PurchaseOrderItem,
        purchaseOrderItems,
      );

      // ========================================================
      // COMMIT
      // ========================================================

      await queryRunner.commitTransaction();

      return this.findPurchaseOrder(
        savedPO.id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============================================================
  // GENERATE PURCHASE ORDER NUMBER
  // ============================================================

  private async generatePurchaseOrderNumber(
    queryRunner?: QueryRunner,
  ): Promise<string> {
    const repository =
      queryRunner?.manager.getRepository(
        PurchaseOrder,
      ) ??
      this.purchaseOrderRepository;

    const count =
      await repository.count();

    return `PO-${String(
      count + 1,
    ).padStart(5, '0')}`;
  }

  // ============================================================
  // FIND ONE PURCHASE ORDER
  // ============================================================

  async findPurchaseOrder(
    id: number,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
        {
          where: {
            id,
          },

          relations: {
            supplier: true,

            items: {
              product: true,
            },
          },
        },
      );

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase order ${id} not found`,
      );
    }

    return purchaseOrder;
  }

  // ============================================================
  // FIND ALL PURCHASE ORDERS
  // ============================================================

  async findAllPurchaseOrders() {
    try {
      return await this.purchaseOrderRepository.find(
        {
          relations: {
            supplier: true,

            items: {
              product: true,
            },
          },

          order: {
            createdAt: 'DESC',
          },
        },
      );
    } catch (error) {
      console.error(
        'Failed to fetch purchase orders:',
        error,
      );

      throw new BadRequestException(
        'Failed to fetch purchase orders',
      );
    }
  }

  // ============================================================
  // UPDATE PURCHASE ORDER
  // ============================================================

  async updatePurchaseOrder(
    id: number,
    dto: UpdatePurchaseOrderDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ========================================================
      // FIND PURCHASE ORDER
      // ========================================================

      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Purchase order ${id} not found`,
        );
      }

      // ========================================================
      // STATUS VALIDATION
      // ========================================================

      if (
        purchaseOrder.status !==
        PurchaseOrderStatus.PENDING
      ) {
        throw new BadRequestException(
          `Purchase order cannot be updated from ${purchaseOrder.status} status`,
        );
      }

      // ========================================================
      // SUPPLIER
      // ========================================================

      const supplierId =
        dto.supplierId ??
        purchaseOrder.supplierId;

      if (
        supplierId === undefined ||
        supplierId === null ||
        !Number.isInteger(
          Number(supplierId),
        ) ||
        Number(supplierId) <= 0
      ) {
        throw new BadRequestException(
          'A valid supplier is required',
        );
      }

      const numericSupplierId =
        Number(supplierId);

      // ========================================================
      // VALIDATE SUPPLIER
      // ========================================================

      const supplier =
        await queryRunner.manager.findOne(
          Supplier,
          {
            where: {
              id: numericSupplierId,
            },
          },
        );

      if (!supplier) {
        throw new NotFoundException(
          `Supplier ${numericSupplierId} not found`,
        );
      }

      if (
        'isActive' in supplier &&
        supplier.isActive === false
      ) {
        throw new BadRequestException(
          'Selected supplier is inactive',
        );
      }

      // ========================================================
      // FIND REQUISITION
      // ========================================================

      const requisition =
        await queryRunner.manager.findOne(
          PurchaseRequisition,
          {
            where: {
              id:
                purchaseOrder.requisitionId,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!requisition) {
        throw new NotFoundException(
          `Purchase requisition ${purchaseOrder.requisitionId} not found`,
        );
      }

      // ========================================================
      // REQUISITION STATUS
      // ========================================================

      if (
        requisition.status !==
        PurchaseRequisitionStatus.APPROVED
      ) {
        throw new BadRequestException(
          'Purchase order can only be updated while the requisition is APPROVED',
        );
      }

      // ========================================================
      // ITEMS
      // ========================================================

      const items =
        dto.items !== undefined
          ? dto.items
          : purchaseOrder.items;

      if (
        !items ||
        items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase order item is required',
        );
      }

      // ========================================================
      // PRODUCT IDS
      // ========================================================

      const productIds =
        items.map(
          (item) =>
            item.productId,
        );

      const uniqueProductIds = [
        ...new Set(productIds),
      ];

      // ========================================================
      // DUPLICATE PRODUCTS
      // ========================================================

      if (
        uniqueProductIds.length !==
        productIds.length
      ) {
        throw new BadRequestException(
          'Duplicate products are not allowed',
        );
      }

      // ========================================================
      // VALIDATE PRODUCTS
      // ========================================================

      const products =
        await queryRunner.manager.findBy(
          Product,
          {
            id: In(
              uniqueProductIds,
            ),
          },
        );

      if (
        products.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      // ========================================================
      // VALIDATE ITEMS + SUBTOTAL
      // ========================================================

      let subtotal = 0;

      for (const item of items) {
        const requisitionItem =
          requisition.items.find(
            (reqItem) =>
              String(
                reqItem.productId,
              ) ===
              String(
                item.productId,
              ),
          );

        if (!requisitionItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of the purchase requisition`,
          );
        }

        const quantity =
          Number(item.quantity);

        const unitPrice =
          Number(item.unitPrice);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          throw new BadRequestException(
            `Quantity for product ${item.productId} must be greater than 0`,
          );
        }

        if (
          quantity >
          Number(
            requisitionItem.quantity,
          )
        ) {
          throw new BadRequestException(
            `PO quantity for product ${item.productId} cannot exceed requisition quantity ${requisitionItem.quantity}`,
          );
        }

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {
          throw new BadRequestException(
            `Unit price for product ${item.productId} cannot be negative`,
          );
        }

        subtotal +=
          quantity * unitPrice;
      }

      // ========================================================
      // DISCOUNT
      // ========================================================

      const discountAmount =
        Number(
          dto.discountAmount ??
            purchaseOrder.discountAmount ??
            0,
        );

      if (
        !Number.isFinite(
          discountAmount,
        ) ||
        discountAmount < 0
      ) {
        throw new BadRequestException(
          'Discount amount cannot be negative',
        );
      }

      // ========================================================
      // TAX
      // ========================================================

      const taxAmount =
        Number(
          dto.taxAmount ??
            purchaseOrder.taxAmount ??
            0,
        );

      if (
        !Number.isFinite(
          taxAmount,
        ) ||
        taxAmount < 0
      ) {
        throw new BadRequestException(
          'Tax amount cannot be negative',
        );
      }

      // ========================================================
      // TOTAL
      // ========================================================

      const totalAmount =
        Math.max(
          0,
          subtotal -
            discountAmount +
            taxAmount,
        );

      // ========================================================
      // DATES
      // ========================================================

      let poDate =
        purchaseOrder.poDate;

      let expectedDeliveryDate =
        purchaseOrder.expectedDeliveryDate;

      if (dto.poDate) {
        poDate =
          new Date(dto.poDate);

        if (
          Number.isNaN(
            poDate.getTime(),
          )
        ) {
          throw new BadRequestException(
            'Invalid PO date',
          );
        }
      }

      if (
        dto.expectedDeliveryDate
      ) {
        expectedDeliveryDate =
          new Date(
            dto.expectedDeliveryDate,
          );

        if (
          Number.isNaN(
            expectedDeliveryDate.getTime(),
          )
        ) {
          throw new BadRequestException(
            'Invalid expected delivery date',
          );
        }
      }

      if (
        expectedDeliveryDate &&
        poDate &&
        expectedDeliveryDate.getTime() <
          poDate.getTime()
      ) {
        throw new BadRequestException(
          'Expected delivery date cannot be before PO date',
        );
      }

      // ========================================================
      // UPDATE PURCHASE ORDER
      // ========================================================

      purchaseOrder.supplierId =
        numericSupplierId;

      purchaseOrder.poDate =
        poDate;

      purchaseOrder.expectedDeliveryDate =
        expectedDeliveryDate;

      purchaseOrder.discountAmount =
        discountAmount;

      purchaseOrder.taxAmount =
        taxAmount;

      purchaseOrder.totalAmount =
        totalAmount;

        purchaseOrder.notes =
  dto.notes !== undefined
    ? dto.notes.trim() || null
    : purchaseOrder.notes;
    
      await queryRunner.manager.save(
        PurchaseOrder,
        purchaseOrder,
      );

      // ========================================================
      // DELETE OLD ITEMS
      // ========================================================

      await queryRunner.manager.delete(
        PurchaseOrderItem,
        {
          purchaseOrderId:
            purchaseOrder.id,
        },
      );

      // ========================================================
      // CREATE NEW ITEMS
      // ========================================================

      const newItems =
        items.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseOrderItem,
              {
                purchaseOrderId:
                  purchaseOrder.id,

                productId:
                  item.productId,

                quantity:
                  Number(item.quantity),

                unitPrice:
                  Number(item.unitPrice),

                subtotal:
                  Number(item.quantity) *
                  Number(item.unitPrice),
              },
            ),
        );

      await queryRunner.manager.save(
        PurchaseOrderItem,
        newItems,
      );

      // ========================================================
      // COMMIT
      // ========================================================

      await queryRunner.commitTransaction();

      return this.findPurchaseOrder(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============================================================
  // APPROVE PURCHASE ORDER
  // ============================================================

  async approvePurchaseOrder(
    id: number,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
        {
          where: {
            id,
          },
        },
      );

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase order ${id} not found`,
      );
    }

    if (
      purchaseOrder.status !==
      PurchaseOrderStatus.PENDING
    ) {
      throw new BadRequestException(
        `Purchase order cannot be approved from ${purchaseOrder.status} status`,
      );
    }

    purchaseOrder.status =
      PurchaseOrderStatus.APPROVED;

    await this.purchaseOrderRepository.save(
      purchaseOrder,
    );

    return this.findPurchaseOrder(id);
  }

  // ============================================================
  // CANCEL PURCHASE ORDER
  // ============================================================

  async cancelPurchaseOrder(
    id: number,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
        {
          where: {
            id,
          },
        },
      );

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase order ${id} not found`,
      );
    }

    if (
      purchaseOrder.status ===
      PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Purchase order is already cancelled',
      );
    }

    if (
      purchaseOrder.status !==
        PurchaseOrderStatus.PENDING &&
      purchaseOrder.status !==
        PurchaseOrderStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Purchase order cannot be cancelled from ${purchaseOrder.status} status`,
      );
    }

    purchaseOrder.status =
      PurchaseOrderStatus.CANCELLED;

    await this.purchaseOrderRepository.save(
      purchaseOrder,
    );

    return this.findPurchaseOrder(id);
  }

  // ============================================================
  // DELETE PURCHASE ORDER
  // ============================================================

  async deletePurchaseOrder(
    id: number,
  ) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
        {
          where: {
            id,
          },
        },
      );

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase order ${id} not found`,
      );
    }

    if (
      purchaseOrder.status !==
        PurchaseOrderStatus.PENDING &&
      purchaseOrder.status !==
        PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Purchase order cannot be deleted from ${purchaseOrder.status} status`,
      );
    }

    // ========================================================
    // TRANSACTION
    // ========================================================

    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // --------------------------------------------------------
      // DELETE ITEMS
      // --------------------------------------------------------

      await queryRunner.manager.delete(
        PurchaseOrderItem,
        {
          purchaseOrderId: id,
        },
      );

      // --------------------------------------------------------
      // DELETE PURCHASE ORDER
      // --------------------------------------------------------

      await queryRunner.manager.delete(
        PurchaseOrder,
        id,
      );

      await queryRunner.commitTransaction();

      return {
        message:
          'Purchase order deleted successfully',

        id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}