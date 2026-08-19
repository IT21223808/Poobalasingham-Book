import {BadRequestException,Injectable,NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {DataSource,In,QueryRunner,Repository} from 'typeorm';
import {PurchaseRequisition,PurchaseRequisitionStatus} from './entities/purchase-requisition.entity';
import { PurchaseRequisitionItem } from './entities/purchase-requisition-item.entity';
import {PurchaseOrder,PurchaseOrderStatus} from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import {GoodsReceivedNote,GrnStatus} from './entities/grn.entity';
import { GrnItem } from './entities/grn-item.entity';
import {PurchaseInvoice,PurchaseInvoiceStatus} from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import {PurchaseReturn,PurchaseReturnStatus,} from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateGrnDto } from './dto/create-grn.dto';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PurchasingService {
  constructor(
    // PURCHASE REQUISITION REPOSITORY
    @InjectRepository(PurchaseRequisition)
    private readonly requisitionRepository: Repository<PurchaseRequisition>,

    // PRODUCT REPOSITORY
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    // PURCHASE ORDER REPOSITORY
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,

    // GRN REPOSITORY
    @InjectRepository(GoodsReceivedNote)
    private readonly grnRepository: Repository<GoodsReceivedNote>,

    // PURCHASE INVOICE REPOSITORY
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,

    // PURCHASE RETURN REPOSITORY
    @InjectRepository(PurchaseReturn)
    private readonly purchaseReturnRepository: Repository<PurchaseReturn>,

    // INVENTORY SERVICE
    private readonly inventoryService: InventoryService,

    // DATASOURCE
    private readonly dataSource: DataSource,
  ) {}

  // =========================================================
  // CREATE PURCHASE REQUISITION
  // =========================================================

  async create(
    dto: CreatePurchaseRequisitionDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // CHECK ITEMS
      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase requisition item is required',
        );
      }

      // GET PRODUCT IDS
      const productIds = dto.items.map(
        (item) => item.productId,
      );

      // DUPLICATE PRODUCT CHECK
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

      // CHECK PRODUCTS EXIST
      const products =
        await this.productRepository.findBy({
          id: In(uniqueProductIds),
        });

      if (
        products.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      // VALIDATE QUANTITIES
      for (const item of dto.items) {
        if (item.quantity <= 0) {
          throw new BadRequestException(
            'Quantity must be greater than 0',
          );
        }
      }

      // GENERATE REQUISITION NUMBER
      const requisitionNumber =
        await this.generateRequisitionNumber();

      // CREATE REQUISITION
      const requisition =
        queryRunner.manager.create(
          PurchaseRequisition,
          {
            requisitionNumber,
            status:
              PurchaseRequisitionStatus.PENDING,
          },
        );

      const savedRequisition =
        await queryRunner.manager.save(
          requisition,
        );

      // CREATE REQUISITION ITEMS
      const items = dto.items.map(
        (item) =>
          queryRunner.manager.create(
            PurchaseRequisitionItem,
            {
              requisition:
                savedRequisition,

              productId:
                item.productId,

              quantity:
                item.quantity,
            },
          ),
      );

      await queryRunner.manager.save(items);

      // COMMIT TRANSACTION
      await queryRunner.commitTransaction();

      return this.findOne(
        savedRequisition.id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // GET ALL PURCHASE REQUISITIONS
  // =========================================================

  async findAll() {
    return this.requisitionRepository.find({
      relations: {
        items: {
          product: true,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =========================================================
  // GET SINGLE PURCHASE REQUISITION
  // =========================================================

  async findOne(id: number) {
    const requisition =
      await this.requisitionRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!requisition) {
      throw new NotFoundException(
        `Purchase requisition ${id} not found`,
      );
    }

    return requisition;
  }

  // =========================================================
  // GENERATE REQUISITION NUMBER
  // =========================================================

  private async generateRequisitionNumber(): Promise<string> {
    const count =
      await this.requisitionRepository.count();

    const nextNumber = count + 1;

    return `PR-${String(nextNumber).padStart(
      5,
      '0',
    )}`;
  }

  // =========================================================
  // CREATE PURCHASE ORDER
  // =========================================================

  async createPurchaseOrder(
    dto: CreatePurchaseOrderDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // CHECK PURCHASE REQUISITION
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

      // CHECK PO ITEMS
      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase order item is required',
        );
      }

      // GET PRODUCT IDS
      const productIds = dto.items.map(
        (item) => item.productId,
      );

      // DUPLICATE PRODUCT CHECK
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

      // VALIDATE PO ITEMS AGAINST REQUISITION
      const requisitionItems =
        requisition.items;

      for (const item of dto.items) {
        const requisitionItem =
          requisitionItems.find(
            (reqItem) =>
              String(reqItem.productId) ===
              String(item.productId),
          );

        if (!requisitionItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of the purchase requisition`,
          );
        }

        // QUANTITY VALIDATION
        if (item.quantity <= 0) {
          throw new BadRequestException(
            'Quantity must be greater than 0',
          );
        }

        // PO QUANTITY CANNOT EXCEED REQUISITION
        if (
          item.quantity >
          requisitionItem.quantity
        ) {
          throw new BadRequestException(
            `PO quantity for product ${item.productId} cannot exceed requisition quantity`,
          );
        }

        // UNIT PRICE VALIDATION
        if (item.unitPrice <= 0) {
          throw new BadRequestException(
            'Unit price must be greater than 0',
          );
        }
      }

      // CHECK PRODUCTS EXIST
      const existingProducts =
        await this.productRepository.findBy({
          id: In(uniqueProductIds),
        });

      if (
        existingProducts.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      // CALCULATE TOTAL AMOUNT
      let totalAmount = 0;

      const items = dto.items.map((item) => {
        const subtotal =
          item.quantity *
          item.unitPrice;

        totalAmount += subtotal;

        return {
          productId:
            item.productId,

          quantity:
            item.quantity,

          unitPrice:
            item.unitPrice,

          subtotal,
        };
      });

      // GENERATE PO NUMBER
      const poNumber =
        await this.generatePurchaseOrderNumber();

      // CREATE PURCHASE ORDER
      const purchaseOrder =
        queryRunner.manager.create(
          PurchaseOrder,
          {
            poNumber,

            requisitionId:
              dto.requisitionId,

            status:
              PurchaseOrderStatus.PENDING,

            totalAmount,
          },
        );

      const savedPO =
        await queryRunner.manager.save(
          purchaseOrder,
        );

      // CREATE PURCHASE ORDER ITEMS
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

      // COMMIT TRANSACTION
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

  // =========================================================
  // GENERATE PURCHASE ORDER NUMBER
  // =========================================================

  private async generatePurchaseOrderNumber(): Promise<string> {
    const count =
      await this.purchaseOrderRepository.count();

    const nextNumber = count + 1;

    return `PO-${String(nextNumber).padStart(
      5,
      '0',
    )}`;
  }

  // =========================================================
  // GET SINGLE PURCHASE ORDER
  // =========================================================

  async findPurchaseOrder(id: number) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!purchaseOrder) {
      throw new NotFoundException(
        `Purchase order ${id} not found`,
      );
    }

    return purchaseOrder;
  }

  // =========================================================
  // GET ALL PURCHASE ORDERS
  // =========================================================

  async findAllPurchaseOrders() {
    return this.purchaseOrderRepository.find({
      relations: {
        items: {
          product: true,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =========================================================
  // CREATE GRN
  // =========================================================

  async createGrn(
    dto: CreateGrnDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // CHECK LOCATION
      if (!dto.locationId) {
        throw new BadRequestException(
          'Location is required for GRN',
        );
      }

      // CHECK PURCHASE ORDER
      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id: dto.purchaseOrderId,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!purchaseOrder) {
        throw new NotFoundException(
          'Purchase order not found',
        );
      }

      // CANCELLED PO CHECK
      if (
        purchaseOrder.status ===
        PurchaseOrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled purchase order cannot receive goods',
        );
      }

      // CHECK GRN ITEMS
      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one GRN item is required',
        );
      }

      // GET PRODUCT IDS
      const productIds = dto.items.map(
        (item) => item.productId,
      );

      // DUPLICATE PRODUCT CHECK
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

      // CHECK PRODUCTS EXIST
      const existingProducts =
        await this.productRepository.findBy({
          id: In(uniqueProductIds),
        });

      if (
        existingProducts.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      // VALIDATE GRN ITEMS
      const grnItems = dto.items.map((item) => {
        const purchaseOrderItem =
          purchaseOrder.items.find(
            (poItem) =>
              String(poItem.productId) ===
              String(item.productId),
          );

        if (!purchaseOrderItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of this purchase order`,
          );
        }

        if (
          item.receivedQuantity <= 0
        ) {
          throw new BadRequestException(
            'Received quantity must be greater than 0',
          );
        }

        if (
          item.receivedQuantity >
          purchaseOrderItem.quantity
        ) {
          throw new BadRequestException(
            `Received quantity for product ${item.productId} cannot exceed ordered quantity`,
          );
        }

        return {
          productId:
            item.productId,

          orderedQuantity:
            purchaseOrderItem.quantity,

          receivedQuantity:
            item.receivedQuantity,
        };
      });

      // GENERATE GRN NUMBER
      const grnNumber =
        await this.generateGrnNumber();

      // CREATE GRN
      const grn =
        queryRunner.manager.create(
          GoodsReceivedNote,
          {
            grnNumber,

            purchaseOrderId:
              dto.purchaseOrderId,

            status:
              GrnStatus.RECEIVED,
          },
        );

      const savedGrn =
        await queryRunner.manager.save(grn);

      // CREATE GRN ITEMS
      const items = grnItems.map(
        (item) =>
          queryRunner.manager.create(
            GrnItem,
            {
              grnId:
                savedGrn.id,

              productId:
                item.productId,

              orderedQuantity:
                item.orderedQuantity,

              receivedQuantity:
                item.receivedQuantity,
            },
          ),
      );

      await queryRunner.manager.save(items);

      // UPDATE INVENTORY STOCK
      for (const item of grnItems) {
        await this.inventoryService.stockIn({
          productId:
            item.productId,

          quantity:
            item.receivedQuantity,

          locationId:
            String(dto.locationId),
        });
      }

      // COMMIT TRANSACTION
      await queryRunner.commitTransaction();

      return this.findGrn(
        savedGrn.id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // GENERATE GRN NUMBER
  // =========================================================

  private async generateGrnNumber(): Promise<string> {
    const count =
      await this.grnRepository.count();

    const nextNumber = count + 1;

    return `GRN-${String(nextNumber).padStart(
      5,
      '0',
    )}`;
  }

  // =========================================================
  // GET ALL GRNs
  // =========================================================

  async findAllGrns() {
    return this.grnRepository.find({
      relations: {
        items: {
          product: true,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =========================================================
  // GET SINGLE GRN
  // =========================================================

  async findGrn(id: number) {
    const grn =
      await this.grnRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!grn) {
      throw new NotFoundException(
        `GRN ${id} not found`,
      );
    }

    return grn;
  }

  // =========================================================
  // CREATE PURCHASE INVOICE
  // =========================================================

  async createPurchaseInvoice(
    dto: CreatePurchaseInvoiceDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // CHECK PURCHASE ORDER
      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id: dto.purchaseOrderId,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!purchaseOrder) {
        throw new NotFoundException(
          'Purchase order not found',
        );
      }

      // CHECK GRN
      const grn =
        await queryRunner.manager.findOne(
          GoodsReceivedNote,
          {
            where: {
              id: dto.grnId,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!grn) {
        throw new NotFoundException(
          'GRN not found',
        );
      }

      // CHECK GRN BELONGS TO PURCHASE ORDER
      if (
        grn.purchaseOrderId !==
        purchaseOrder.id
      ) {
        throw new BadRequestException(
          'GRN does not belong to this purchase order',
        );
      }

      // CHECK INVOICE ITEMS
      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase invoice item is required',
        );
      }

      // GET PRODUCT IDS
      const productIds = dto.items.map(
        (item) => item.productId,
      );

      // DUPLICATE PRODUCT CHECK
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

      // CHECK PRODUCTS EXIST
      const products =
        await this.productRepository.findBy({
          id: In(uniqueProductIds),
        });

      if (
        products.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      // VALIDATE INVOICE ITEMS
      let subtotal = 0;

      const items = dto.items.map((item) => {
        const grnItem =
          grn.items.find(
            (grnItem) =>
              String(grnItem.productId) ===
              String(item.productId),
          );

        if (!grnItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of this GRN`,
          );
        }

        if (item.quantity <= 0) {
          throw new BadRequestException(
            'Invoice quantity must be greater than 0',
          );
        }

        if (
          item.quantity >
          grnItem.receivedQuantity
        ) {
          throw new BadRequestException(
            `Invoice quantity cannot exceed received quantity for product ${item.productId}`,
          );
        }

        if (item.unitPrice <= 0) {
          throw new BadRequestException(
            'Unit price must be greater than 0',
          );
        }

        const itemSubtotal =
          item.quantity *
          item.unitPrice;

        subtotal += itemSubtotal;

        return {
          productId:
            item.productId,

          quantity:
            item.quantity,

          unitPrice:
            item.unitPrice,

          subtotal:
            itemSubtotal,
        };
      });

      // CALCULATE TOTAL
      const totalAmount =
        subtotal +
        dto.taxAmount -
        dto.discountAmount;

      if (totalAmount < 0) {
        throw new BadRequestException(
          'Total amount cannot be negative',
        );
      }

      // GENERATE INVOICE NUMBER
      const invoiceNumber =
        await this.generateInvoiceNumber();

      // CREATE PURCHASE INVOICE
      const invoice =
        queryRunner.manager.create(
          PurchaseInvoice,
          {
            invoiceNumber,

            purchaseOrderId:
              dto.purchaseOrderId,

            grnId:
              dto.grnId,

            status:
              PurchaseInvoiceStatus.POSTED,

            subtotal,

            taxAmount:
              dto.taxAmount,

            discountAmount:
              dto.discountAmount,

            totalAmount,
          },
        );

      const savedInvoice =
        await queryRunner.manager.save(
          invoice,
        );

      // CREATE PURCHASE INVOICE ITEMS
      const invoiceItems =
        items.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseInvoiceItem,
              {
                invoiceId:
                  savedInvoice.id,

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
        invoiceItems,
      );

      // COMMIT TRANSACTION
      await queryRunner.commitTransaction();

      return this.findPurchaseInvoice(
        savedInvoice.id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // GENERATE INVOICE NUMBER
  // =========================================================

  private async generateInvoiceNumber(): Promise<string> {
    const count =
      await this.purchaseInvoiceRepository.count();

    const nextNumber = count + 1;

    return `INV-${String(nextNumber).padStart(
      5,
      '0',
    )}`;
  }

  // =========================================================
  // GET SINGLE PURCHASE INVOICE
  // =========================================================

  async findPurchaseInvoice(id: number) {
    const invoice =
      await this.purchaseInvoiceRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        `Purchase invoice ${id} not found`,
      );
    }

    return invoice;
  }

  // =========================================================
  // GET ALL PURCHASE INVOICES
  // =========================================================

  async findAllPurchaseInvoices() {
    return this.purchaseInvoiceRepository.find({
      relations: {
        items: {
          product: true,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =========================================================
  // CREATE PURCHASE RETURN
  // =========================================================

  async createPurchaseReturn(
    dto: CreatePurchaseReturnDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // CHECK PURCHASE ORDER
      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id: dto.purchaseOrderId,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!purchaseOrder) {
        throw new NotFoundException(
          'Purchase order not found',
        );
      }

      // CHECK INVOICE
      if (dto.invoiceId) {
        const invoice =
          await queryRunner.manager.findOne(
            PurchaseInvoice,
            {
              where: {
                id: dto.invoiceId,
              },
            },
          );

        if (!invoice) {
          throw new NotFoundException(
            'Purchase invoice not found',
          );
        }

        // CHECK INVOICE BELONGS TO PURCHASE ORDER
        if (
          invoice.purchaseOrderId !==
          purchaseOrder.id
        ) {
          throw new BadRequestException(
            'Invoice does not belong to this purchase order',
          );
        }
      }

      // CHECK RETURN ITEMS
      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase return item is required',
        );
      }

      // GET PRODUCT IDS
      const productIds = dto.items.map(
        (item) => item.productId,
      );

      // DUPLICATE PRODUCT CHECK
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

      // CHECK PRODUCTS EXIST
      const products =
        await this.productRepository.findBy({
          id: In(uniqueProductIds),
        });

      if (
        products.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      // VALIDATE RETURN ITEMS
      const returnItems =
        await Promise.all(
          dto.items.map(
            async (item) => {
              // CHECK PRODUCT IS PART OF PURCHASE ORDER
              const poItem =
                purchaseOrder.items.find(
                  (poItem) =>
                    String(
                      poItem.productId,
                    ) ===
                    String(
                      item.productId,
                    ),
                );

              if (!poItem) {
                throw new BadRequestException(
                  `Product ${item.productId} is not part of this purchase order`,
                );
              }

              // QUANTITY VALIDATION
              if (item.quantity <= 0) {
                throw new BadRequestException(
                  'Return quantity must be greater than 0',
                );
              }

              // GET RECEIVED QUANTITY
              const receivedQuantity =
                await this.getReceivedQuantity(
                  purchaseOrder.id,
                  item.productId,
                  queryRunner,
                );

              // GET ALREADY RETURNED QUANTITY
              const returnedQuantity =
                await this.getReturnedQuantity(
                  purchaseOrder.id,
                  item.productId,
                  queryRunner,
                );

              // AVAILABLE RETURN QUANTITY
              const availableReturnQuantity =
                receivedQuantity -
                returnedQuantity;

              // CHECK RETURN QUANTITY
              if (
                item.quantity >
                availableReturnQuantity
              ) {
                throw new BadRequestException(
                  `Return quantity for product ${item.productId} exceeds available quantity`,
                );
              }

              return {
                productId:
                  item.productId,

                quantity:
                  item.quantity,
              };
            },
          ),
        );

      // GENERATE RETURN NUMBER
      const returnNumber =
        await this.generateReturnNumber();

      // CREATE PURCHASE RETURN
      const purchaseReturn =
        queryRunner.manager.create(
          PurchaseReturn,
          {
            returnNumber,

            purchaseOrderId:
              dto.purchaseOrderId,

            invoiceId:
              dto.invoiceId,

            reason:
              dto.reason,

            status:
              PurchaseReturnStatus.COMPLETED,
          },
        );

      const savedReturn =
        await queryRunner.manager.save(
          purchaseReturn,
        );

      // CREATE PURCHASE RETURN ITEMS
      const items =
        returnItems.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseReturnItem,
              {
                returnId:
                  savedReturn.id,

                productId:
                  item.productId,

                quantity:
                  item.quantity,
              },
            ),
        );

      await queryRunner.manager.save(
        items,
      );

      // =====================================================
      // UPDATE INVENTORY STOCK OUT
      // =====================================================

      for (const item of returnItems) {
        await this.inventoryService.stockOut({
          productId:
            item.productId,

          quantity:
            item.quantity,
        });
      }

      // COMMIT TRANSACTION
      await queryRunner.commitTransaction();

      return this.findPurchaseReturn(
        savedReturn.id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // GET RECEIVED QUANTITY
  // =========================================================

  private async getReceivedQuantity(
    purchaseOrderId: number,
    productId: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const result =
      await queryRunner.manager
        .createQueryBuilder(
          GrnItem,
          'item',
        )
        .innerJoin(
          GoodsReceivedNote,
          'grn',
          'grn.id = item.grnId',
        )
        .select(
          'COALESCE(SUM(item.receivedQuantity), 0)',
          'total',
        )
        .where(
          'grn.purchaseOrderId = :purchaseOrderId',
          {
            purchaseOrderId,
          },
        )
        .andWhere(
          'item.productId = :productId',
          {
            productId,
          },
        )
        .getRawOne();

    return Number(result?.total ?? 0);
  }

  // =========================================================
  // GET RETURNED QUANTITY
  // =========================================================

  private async getReturnedQuantity(
    purchaseOrderId: number,
    productId: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const result =
      await queryRunner.manager
        .createQueryBuilder(
          PurchaseReturnItem,
          'item',
        )
        .innerJoin(
          PurchaseReturn,
          'purchaseReturn',
          'purchaseReturn.id = item.returnId',
        )
        .select(
          'COALESCE(SUM(item.quantity), 0)',
          'total',
        )
        .where(
          'purchaseReturn.purchaseOrderId = :purchaseOrderId',
          {
            purchaseOrderId,
          },
        )
        .andWhere(
          'item.productId = :productId',
          {
            productId,
          },
        )
        .andWhere(
          'purchaseReturn.status = :status',
          {
            status:
              PurchaseReturnStatus.COMPLETED,
          },
        )
        .getRawOne();

    return Number(result?.total ?? 0);
  }

  // =========================================================
  // GENERATE RETURN NUMBER
  // =========================================================

  private async generateReturnNumber(): Promise<string> {
    const count =
      await this.purchaseReturnRepository.count();

    const nextNumber = count + 1;

    return `PRN-${String(nextNumber).padStart(
      5,
      '0',
    )}`;
  }

  // =========================================================
  // GET SINGLE PURCHASE RETURN
  // =========================================================

  async findPurchaseReturn(id: number) {
    const purchaseReturn =
      await this.purchaseReturnRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!purchaseReturn) {
      throw new NotFoundException(
        `Purchase return ${id} not found`,
      );
    }

    return purchaseReturn;
  }

  // =========================================================
  // GET ALL PURCHASE RETURNS
  // =========================================================

  async findAllPurchaseReturns() {
    return this.purchaseReturnRepository.find({
      relations: {
        items: {
          product: true,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}