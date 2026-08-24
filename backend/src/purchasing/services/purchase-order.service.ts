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

import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

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
      // ----------------------------------------------------------
      // Validate requisition
      // ----------------------------------------------------------

      if (!dto.requisitionId) {
        throw new BadRequestException(
          'Purchase requisition is required',
        );
      }

      // ----------------------------------------------------------
      // Validate supplier
      // ----------------------------------------------------------

      if (!dto.supplierId) {
        throw new BadRequestException(
          'Supplier is required',
        );
      }

      // ----------------------------------------------------------
      // Find requisition
      // ----------------------------------------------------------

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
          'Purchase requisition not found',
        );
      }

      // ----------------------------------------------------------
      // Validate requisition status
      // ----------------------------------------------------------

      if (
        requisition.status ===
        PurchaseRequisitionStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled requisition cannot be converted to purchase order',
        );
      }

      // ----------------------------------------------------------
      // Validate items
      // ----------------------------------------------------------

      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase order item is required',
        );
      }

      // ----------------------------------------------------------
      // Product IDs
      // ----------------------------------------------------------

      const productIds = dto.items.map(
        (item) => item.productId,
      );

      const uniqueProductIds = [
        ...new Set(productIds),
      ];

      // ----------------------------------------------------------
      // Duplicate products
      // ----------------------------------------------------------

      if (
        uniqueProductIds.length !==
        productIds.length
      ) {
        throw new BadRequestException(
          'Duplicate products are not allowed',
        );
      }

      // ----------------------------------------------------------
      // Validate products
      // ----------------------------------------------------------

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

      // ----------------------------------------------------------
      // Validate requisition items
      // ----------------------------------------------------------

      for (const item of dto.items) {
        const requisitionItem =
          requisition.items.find(
            (reqItem) =>
              String(reqItem.productId) ===
              String(item.productId),
          );

        if (!requisitionItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of the purchase requisition`,
          );
        }

        if (
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
        ) {
          throw new BadRequestException(
            'Quantity must be greater than 0',
          );
        }

        if (
          item.quantity >
          requisitionItem.quantity
        ) {
          throw new BadRequestException(
            `PO quantity for product ${item.productId} cannot exceed requisition quantity`,
          );
        }

        if (
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice <= 0
        ) {
          throw new BadRequestException(
            'Unit price must be greater than 0',
          );
        }
      }

      // ----------------------------------------------------------
      // Calculate total
      // ----------------------------------------------------------

      let totalAmount = 0;

      const items = dto.items.map(
        (item) => {
          const subtotal =
            item.quantity *
            item.unitPrice;

          totalAmount += subtotal;

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal,
          };
        },
      );

      // ----------------------------------------------------------
      // Generate PO number
      // ----------------------------------------------------------

      const poNumber =
        await this.generatePurchaseOrderNumber(
          queryRunner,
        );

      // ----------------------------------------------------------
      // Create Purchase Order
      // ----------------------------------------------------------

      const purchaseOrder =
        queryRunner.manager.create(
          PurchaseOrder,
          {
            poNumber,

            requisitionId:
              dto.requisitionId,

            // NEW
            supplierId:
              dto.supplierId,

            status:
              PurchaseOrderStatus.PENDING,

            totalAmount,

            discountAmount:
              dto.discountAmount ?? 0,

            taxAmount:
              dto.taxAmount ?? 0,

            expectedDeliveryDate:
              dto.expectedDeliveryDate ?? null,
          },
        );

      // ----------------------------------------------------------
      // Save Purchase Order
      // ----------------------------------------------------------

      const savedPO =
        await queryRunner.manager.save(
          purchaseOrder,
        );

      // ----------------------------------------------------------
      // Create Purchase Order Items
      // ----------------------------------------------------------

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
        purchaseOrderItems,
      );

      // ----------------------------------------------------------
      // Update requisition status
      // ----------------------------------------------------------

      if (
        'APPROVED' in
        PurchaseRequisitionStatus
      ) {
        requisition.status =
          PurchaseRequisitionStatus.APPROVED;

        await queryRunner.manager.save(
          requisition,
        );
      }

      // ----------------------------------------------------------
      // Commit
      // ----------------------------------------------------------

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

  async findPurchaseOrder(id: number) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
        {
          where: {
            id,
          },

          relations: {
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
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
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

    // ----------------------------------------------------------
    // Cannot update received PO
    // ----------------------------------------------------------

    if (
      purchaseOrder.status ===
      PurchaseOrderStatus.RECEIVED
    ) {
      throw new BadRequestException(
        'Received purchase order cannot be updated',
      );
    }

    // ----------------------------------------------------------
    // Supplier validation
    // ----------------------------------------------------------

    if (
      dto.supplierId === undefined ||
      dto.supplierId === null
    ) {
      throw new BadRequestException(
        'Supplier is required',
      );
    }

    // ----------------------------------------------------------
    // Items validation
    // ----------------------------------------------------------

    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'At least one purchase order item is required',
      );
    }

    // ----------------------------------------------------------
    // Product IDs
    // ----------------------------------------------------------

    const productIds = dto.items.map(
      (item) => item.productId,
    );

    const uniqueProductIds = [
      ...new Set(productIds),
    ];

    if (
      uniqueProductIds.length !==
      productIds.length
    ) {
      throw new BadRequestException(
        'Duplicate products are not allowed',
      );
    }

    // ----------------------------------------------------------
    // Validate products
    // ----------------------------------------------------------

    const products =
      await this.productRepository.findBy(
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

    // ----------------------------------------------------------
    // Calculate total
    // ----------------------------------------------------------

    let totalAmount = 0;

    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          'Quantity must be greater than 0',
        );
      }

      if (item.unitPrice <= 0) {
        throw new BadRequestException(
          'Unit price must be greater than 0',
        );
      }

      totalAmount +=
        item.quantity *
        item.unitPrice;
    }

    // ----------------------------------------------------------
    // Transaction
    // ----------------------------------------------------------

    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // --------------------------------------------------------
      // Update PO
      // --------------------------------------------------------

      purchaseOrder.totalAmount =
        totalAmount;

      // NEW
      purchaseOrder.supplierId =
        dto.supplierId;

      if (dto.requisitionId) {
        purchaseOrder.requisitionId =
          dto.requisitionId;
      }

      if (
        dto.discountAmount !== undefined
      ) {
        purchaseOrder.discountAmount =
          dto.discountAmount;
      }

      if (
        dto.taxAmount !== undefined
      ) {
        purchaseOrder.taxAmount =
          dto.taxAmount;
      }

     if (dto.expectedDeliveryDate !== undefined) {
  purchaseOrder.expectedDeliveryDate =
    dto.expectedDeliveryDate
      ? new Date(dto.expectedDeliveryDate)
      : null;
}
      await queryRunner.manager.save(
        PurchaseOrder,
        purchaseOrder,
      );

      // --------------------------------------------------------
      // Delete old items
      // --------------------------------------------------------

      await queryRunner.manager.delete(
        PurchaseOrderItem,
        {
          purchaseOrderId:
            purchaseOrder.id,
        },
      );

      // --------------------------------------------------------
      // Create new items
      // --------------------------------------------------------

      const items = dto.items.map(
        (item) =>
          queryRunner.manager.create(
            PurchaseOrderItem,
            {
              purchaseOrderId:
                purchaseOrder.id,

              productId:
                item.productId,

              quantity:
                item.quantity,

              unitPrice:
                item.unitPrice,

              subtotal:
                item.quantity *
                item.unitPrice,
            },
          ),
      );

      await queryRunner.manager.save(
        items,
      );

      // --------------------------------------------------------
      // Commit
      // --------------------------------------------------------

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

  async approvePurchaseOrder(id: number) {
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

  async cancelPurchaseOrder(id: number) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
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

    if (
      purchaseOrder.status ===
      PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Purchase order is already cancelled',
      );
    }

    if (
      purchaseOrder.status ===
      PurchaseOrderStatus.RECEIVED
    ) {
      throw new BadRequestException(
        'Received purchase order cannot be cancelled',
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

  async deletePurchaseOrder(id: number) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne(
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

    if (
      purchaseOrder.status ===
      PurchaseOrderStatus.RECEIVED
    ) {
      throw new BadRequestException(
        'Received purchase order cannot be deleted',
      );
    }

    await this.purchaseOrderRepository.manager.delete(
      PurchaseOrderItem,
      {
        purchaseOrderId: id,
      },
    );

    await this.purchaseOrderRepository.delete(
      id,
    );

    return {
      message:
        'Purchase order deleted successfully',
      id,
    };
  }
}