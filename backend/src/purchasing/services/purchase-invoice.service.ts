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
  PurchaseInvoice,
  PurchaseInvoiceStatus,
} from '../entities/purchase-invoice.entity';

import { PurchaseInvoiceItem } from '../entities/purchase-invoice-item.entity';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../entities/purchase-order.entity';

import { GoodsReceivedNote } from '../entities/grn.entity';

import { Product } from '../../products/entities/product.entity';

import { CreatePurchaseInvoiceDto } from '../dto/create-purchase-invoice.dto';

import { UpdatePurchaseInvoiceDto } from '../dto/update-purchase-invoice.dto';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,

    private readonly dataSource: DataSource,
  ) {}

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
      // =====================================================
      // BASIC VALIDATION
      // =====================================================

      if (!dto.supplierId) {
        throw new BadRequestException(
          'Supplier is required',
        );
      }

      if (!dto.purchaseOrderId) {
        throw new BadRequestException(
          'Purchase order is required',
        );
      }

      if (!dto.grnId) {
        throw new BadRequestException(
          'GRN is required',
        );
      }

      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one invoice item is required',
        );
      }

      // =====================================================
      // TAX / DISCOUNT
      // =====================================================

      const tax = Number(
        dto.taxAmount ?? 0,
      );

      const discount = Number(
        dto.discountAmount ?? 0,
      );

      if (
        !Number.isFinite(tax) ||
        tax < 0
      ) {
        throw new BadRequestException(
          'Tax cannot be negative',
        );
      }

      if (
        !Number.isFinite(discount) ||
        discount < 0
      ) {
        throw new BadRequestException(
          'Discount cannot be negative',
        );
      }

      // =====================================================
      // PURCHASE ORDER
      // =====================================================

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

      if (
        purchaseOrder.status ===
        PurchaseOrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cannot create invoice for cancelled purchase order',
        );
      }

      // =====================================================
      // GRN
      // =====================================================

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

      if (
        grn.purchaseOrderId !==
        purchaseOrder.id
      ) {
        throw new BadRequestException(
          'GRN does not belong to this purchase order',
        );
      }

      // =====================================================
      // PRODUCT IDS
      // Product.id = UUID
      // =====================================================

      const productIds =
        dto.items.map((item) =>
          String(item.productId),
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

      // =====================================================
      // CHECK PRODUCTS
      // =====================================================

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

      // =====================================================
      // CREATE INVOICE ITEMS
      // =====================================================

      let subtotal = 0;

      const invoiceItems =
        dto.items.map((item) => {
          const productId =
            String(item.productId);

          const quantity =
            Number(item.quantity);

          const unitPrice =
            Number(item.unitPrice);

          // -------------------------------------------------
          // CHECK PRODUCT EXISTS IN GRN
          // -------------------------------------------------

          const grnItem =
            grn.items.find(
              (grnItem) =>
                String(
                  grnItem.productId,
                ) === productId,
            );

          if (!grnItem) {
            throw new BadRequestException(
              `Product ${productId} is not part of this GRN`,
            );
          }

          // -------------------------------------------------
          // QUANTITY
          // -------------------------------------------------

          if (
            !Number.isFinite(quantity) ||
            quantity <= 0
          ) {
            throw new BadRequestException(
              'Invoice quantity must be greater than 0',
            );
          }

          if (
            quantity >
            Number(
              grnItem.receivedQuantity,
            )
          ) {
            throw new BadRequestException(
              `Invoice quantity cannot exceed received quantity for product ${productId}`,
            );
          }

          // -------------------------------------------------
          // UNIT PRICE
          // -------------------------------------------------

          if (
            !Number.isFinite(unitPrice) ||
            unitPrice <= 0
          ) {
            throw new BadRequestException(
              'Unit price must be greater than 0',
            );
          }

          // -------------------------------------------------
          // SUBTOTAL
          // -------------------------------------------------

          const itemSubtotal =
            Number(
              (
                quantity * unitPrice
              ).toFixed(2),
            );

          subtotal += itemSubtotal;

          return {
            productId,
            quantity,
            unitPrice,
            subtotal: itemSubtotal,
          };
        });

      // =====================================================
      // CALCULATE TOTAL
      // =====================================================

      const calculatedSubtotal =
        Number(
          subtotal.toFixed(2),
        );

      const calculatedGrandTotal =
        Number(
          (
            calculatedSubtotal -
            discount +
            tax
          ).toFixed(2),
        );

      if (
        calculatedGrandTotal < 0
      ) {
        throw new BadRequestException(
          'Grand total cannot be negative',
        );
      }

      // =====================================================
      // GENERATE INVOICE NUMBER
      // =====================================================

      const invoiceNumber =
        await this.generateInvoiceNumber(
          queryRunner,
        );

      // =====================================================
      // INVOICE DATE
      // =====================================================

      const invoiceDate =
        dto.invoiceDate ??
        new Date()
          .toISOString()
          .split('T')[0];

      // =====================================================
      // CREATE INVOICE
      // =====================================================

      const invoice =
        queryRunner.manager.create(
          PurchaseInvoice,
          {
            invoiceNumber,

            supplierId:
              dto.supplierId,

            purchaseOrderId:
              dto.purchaseOrderId,

            grnId:
              dto.grnId,

            invoiceDate,

            dueDate:
              dto.dueDate ?? null,

            paymentStatus:
              PurchaseInvoiceStatus.DRAFT,

            subtotal:
              calculatedSubtotal,

            discount:
              Number(
                discount.toFixed(2),
              ),

            tax:
              Number(
                tax.toFixed(2),
              ),

            grandTotal:
              calculatedGrandTotal,
          },
        );

      const savedInvoice =
        await queryRunner.manager.save(
          PurchaseInvoice,
          invoice,
        );

      // =====================================================
      // CREATE INVOICE ITEMS
      // =====================================================

      const savedItems =
        invoiceItems.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseInvoiceItem,
              {
                invoiceId:
                  savedInvoice.id,

                productId:
                  String(
                    item.productId,
                  ),

                quantity:
                  Number(
                    item.quantity,
                  ),

                unitPrice:
                  Number(
                    item.unitPrice,
                  ),

                subtotal:
                  Number(
                    item.subtotal,
                  ),
              },
            ),
        );

      await queryRunner.manager.save(
        PurchaseInvoiceItem,
        savedItems,
      );

      // =====================================================
      // IMPORTANT
      // =====================================================
      //
      // DO NOT UPDATE PRODUCT STOCK HERE.
      //
      // GRN already updates stock.
      //
      // =====================================================

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

  private async generateInvoiceNumber(
    queryRunner?: QueryRunner,
  ): Promise<string> {
    const repository =
      queryRunner?.manager.getRepository(
        PurchaseInvoice,
      ) ??
      this.purchaseInvoiceRepository;

    const count =
      await repository.count();

    return `INV-${String(
      count + 1,
    ).padStart(5, '0')}`;
  }

  // =========================================================
  // GET ONE PURCHASE INVOICE
  // =========================================================

  async findPurchaseInvoice(
    id: number,
  ) {
    const invoice =
      await this.purchaseInvoiceRepository.findOne(
        {
          where: {
            id,
          },

          relations: {
           
            supplier: true,

            // Load PO relation
            purchaseOrder: true,

            // Load GRN relation
            grn: true,

            // Load invoice items + product
            items: {
              product: true,
            },
          },
        },
      );

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
    return this.purchaseInvoiceRepository.find(
      {
        relations: {
          // IMPORTANT:
          // Supplier name/code
          supplier: true,

          // PO number
          purchaseOrder: true,

          // GRN number
          grn: true,

          // Product information
          items: {
            product: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },
      },
    );
  }

  // =========================================================
  // UPDATE PURCHASE INVOICE
  // =========================================================

  async updatePurchaseInvoice(
    id: number,
    dto: UpdatePurchaseInvoiceDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // =====================================================
      // FIND INVOICE
      // =====================================================

      const invoice =
        await queryRunner.manager.findOne(
          PurchaseInvoice,
          {
            where: {
              id,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!invoice) {
        throw new NotFoundException(
          `Purchase invoice ${id} not found`,
        );
      }

      // =====================================================
      // STATUS VALIDATION
      // =====================================================

      if (
        invoice.paymentStatus ===
        PurchaseInvoiceStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled invoice cannot be updated',
        );
      }

      if (
        invoice.paymentStatus ===
        PurchaseInvoiceStatus.PAID
      ) {
        throw new BadRequestException(
          'Paid invoice cannot be updated',
        );
      }

      // =====================================================
      // SUPPLIER
      // =====================================================

      if (
        dto.supplierId !== undefined
      ) {
        invoice.supplierId =
          dto.supplierId;
      }

      // =====================================================
      // PURCHASE ORDER
      // =====================================================

      if (
        dto.purchaseOrderId !==
        undefined
      ) {
        const purchaseOrder =
          await queryRunner.manager.findOne(
            PurchaseOrder,
            {
              where: {
                id:
                  dto.purchaseOrderId,
              },
            },
          );

        if (!purchaseOrder) {
          throw new NotFoundException(
            'Purchase order not found',
          );
        }

        if (
          purchaseOrder.status ===
          PurchaseOrderStatus.CANCELLED
        ) {
          throw new BadRequestException(
            'Cannot use a cancelled purchase order',
          );
        }

        invoice.purchaseOrderId =
          dto.purchaseOrderId;
      }

      // =====================================================
      // GRN
      // =====================================================

      if (
        dto.grnId !== undefined
      ) {
        const grn =
          await queryRunner.manager.findOne(
            GoodsReceivedNote,
            {
              where: {
                id:
                  dto.grnId,
              },
            },
          );

        if (!grn) {
          throw new NotFoundException(
            'GRN not found',
          );
        }

        if (
          grn.purchaseOrderId !==
          invoice.purchaseOrderId
        ) {
          throw new BadRequestException(
            'GRN does not belong to this purchase order',
          );
        }

        invoice.grnId =
          dto.grnId;
      }

      // =====================================================
      // VALIDATE EXISTING GRN WHEN PO CHANGES
      // =====================================================

      if (
        dto.purchaseOrderId !==
          undefined &&
        dto.grnId === undefined &&
        invoice.grnId
      ) {
        const existingGrn =
          await queryRunner.manager.findOne(
            GoodsReceivedNote,
            {
              where: {
                id:
                  invoice.grnId,
              },
            },
          );

        if (!existingGrn) {
          throw new NotFoundException(
            'Existing GRN not found',
          );
        }

        if (
          existingGrn.purchaseOrderId !==
          invoice.purchaseOrderId
        ) {
          throw new BadRequestException(
            'Existing GRN does not belong to the new purchase order',
          );
        }
      }

      // =====================================================
      // INVOICE DATE
      // =====================================================

      if (
        dto.invoiceDate !==
        undefined
      ) {
        invoice.invoiceDate =
          dto.invoiceDate;
      }

      // =====================================================
      // DUE DATE
      // =====================================================

      if (
        dto.dueDate !==
        undefined
      ) {
        invoice.dueDate =
          dto.dueDate;
      }

      // =====================================================
      // UPDATE ITEMS
      // =====================================================

      if (
        dto.items !== undefined
      ) {
        if (
          dto.items.length === 0
        ) {
          throw new BadRequestException(
            'At least one invoice item is required',
          );
        }

        // ---------------------------------------------------
        // PRODUCT IDS
        // ---------------------------------------------------

        const productIds =
          dto.items.map(
            (item) =>
              String(
                item.productId,
              ),
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

        // ---------------------------------------------------
        // CHECK PRODUCTS
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // CHECK GRN
        // ---------------------------------------------------

        if (!invoice.grnId) {
          throw new BadRequestException(
            'Invoice must have a GRN reference',
          );
        }

        const grn =
          await queryRunner.manager.findOne(
            GoodsReceivedNote,
            {
              where: {
                id:
                  invoice.grnId,
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

        if (
          grn.purchaseOrderId !==
          invoice.purchaseOrderId
        ) {
          throw new BadRequestException(
            'GRN does not belong to this purchase order',
          );
        }

        // ---------------------------------------------------
        // CALCULATE NEW ITEMS
        // ---------------------------------------------------

        let subtotal = 0;

        const newItems =
          dto.items.map(
            (item) => {
              const productId =
                String(
                  item.productId,
                );

              const quantity =
                Number(
                  item.quantity,
                );

              const unitPrice =
                Number(
                  item.unitPrice,
                );

              // ---------------------------------------------
              // CHECK GRN ITEM
              // ---------------------------------------------

              const grnItem =
                grn.items.find(
                  (grnItem) =>
                    String(
                      grnItem.productId,
                    ) === productId,
                );

              if (!grnItem) {
                throw new BadRequestException(
                  `Product ${productId} is not part of this GRN`,
                );
              }

              // ---------------------------------------------
              // QUANTITY
              // ---------------------------------------------

              if (
                !Number.isFinite(
                  quantity,
                ) ||
                quantity <= 0
              ) {
                throw new BadRequestException(
                  'Invoice quantity must be greater than 0',
                );
              }

              if (
                quantity >
                Number(
                  grnItem.receivedQuantity,
                )
              ) {
                throw new BadRequestException(
                  `Invoice quantity cannot exceed GRN received quantity for product ${productId}`,
                );
              }

              // ---------------------------------------------
              // UNIT PRICE
              // ---------------------------------------------

              if (
                !Number.isFinite(
                  unitPrice,
                ) ||
                unitPrice <= 0
              ) {
                throw new BadRequestException(
                  'Unit price must be greater than 0',
                );
              }

              // ---------------------------------------------
              // SUBTOTAL
              // ---------------------------------------------

              const itemSubtotal =
                Number(
                  (
                    quantity *
                    unitPrice
                  ).toFixed(2),
                );

              subtotal +=
                itemSubtotal;

              return {
                productId,
                quantity,
                unitPrice,
                subtotal:
                  itemSubtotal,
              };
            },
          );

        // ---------------------------------------------------
        // DELETE OLD ITEMS
        // ---------------------------------------------------

        await queryRunner.manager.delete(
          PurchaseInvoiceItem,
          {
            invoiceId: id,
          },
        );

        // ---------------------------------------------------
        // CREATE NEW ITEMS
        // ---------------------------------------------------

        const newInvoiceItems =
          newItems.map(
            (item) =>
              queryRunner.manager.create(
                PurchaseInvoiceItem,
                {
                  invoiceId: id,

                  productId:
                    String(
                      item.productId,
                    ),

                  quantity:
                    Number(
                      item.quantity,
                    ),

                  unitPrice:
                    Number(
                      item.unitPrice,
                    ),

                  subtotal:
                    Number(
                      item.subtotal,
                    ),
                },
              ),
          );

        await queryRunner.manager.save(
          PurchaseInvoiceItem,
          newInvoiceItems,
        );

        // ---------------------------------------------------
        // UPDATE SUBTOTAL
        // ---------------------------------------------------

        invoice.subtotal =
          Number(
            subtotal.toFixed(2),
          );
      }

      // =====================================================
      // TAX
      // =====================================================

      if (
        dto.taxAmount !==
        undefined
      ) {
        const tax =
          Number(
            dto.taxAmount,
          );

        if (
          !Number.isFinite(tax) ||
          tax < 0
        ) {
          throw new BadRequestException(
            'Tax cannot be negative',
          );
        }

        invoice.tax =
          Number(
            tax.toFixed(2),
          );
      }

      // =====================================================
      // DISCOUNT
      // =====================================================

      if (
        dto.discountAmount !==
        undefined
      ) {
        const discount =
          Number(
            dto.discountAmount,
          );

        if (
          !Number.isFinite(
            discount,
          ) ||
          discount < 0
        ) {
          throw new BadRequestException(
            'Discount cannot be negative',
          );
        }

        invoice.discount =
          Number(
            discount.toFixed(2),
          );
      }

      // =====================================================
      // ALWAYS RECALCULATE GRAND TOTAL
      // =====================================================

      const finalSubtotal =
        Number(
          invoice.subtotal || 0,
        );

      const finalDiscount =
        Number(
          invoice.discount || 0,
        );

      const finalTax =
        Number(
          invoice.tax || 0,
        );

      const finalGrandTotal =
        Number(
          (
            finalSubtotal -
            finalDiscount +
            finalTax
          ).toFixed(2),
        );

      if (
        finalGrandTotal < 0
      ) {
        throw new BadRequestException(
          'Grand total cannot be negative',
        );
      }

      invoice.grandTotal =
        finalGrandTotal;

      // =====================================================
      // PAYMENT STATUS
      // =====================================================

      if (
        dto.paymentStatus !==
        undefined
      ) {
        if (
          dto.paymentStatus ===
          PurchaseInvoiceStatus.CANCELLED
        ) {
          throw new BadRequestException(
            'Use the cancel invoice endpoint to cancel an invoice',
          );
        }

        invoice.paymentStatus =
          dto.paymentStatus;
      }

      // =====================================================
      // SAVE
      // =====================================================

      await queryRunner.manager.save(
        PurchaseInvoice,
        invoice,
      );

      // =====================================================
      // COMMIT
      // =====================================================

      await queryRunner.commitTransaction();

      return this.findPurchaseInvoice(
        id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // CANCEL PURCHASE INVOICE
  // =========================================================

  async cancelPurchaseInvoice(
    id: number,
  ) {
    const invoice =
      await this.purchaseInvoiceRepository.findOne(
        {
          where: {
            id,
          },
        },
      );

    if (!invoice) {
      throw new NotFoundException(
        `Purchase invoice ${id} not found`,
      );
    }

    // =====================================================
    // ALREADY CANCELLED
    // =====================================================

    if (
      invoice.paymentStatus ===
      PurchaseInvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Purchase invoice is already cancelled',
      );
    }

    // =====================================================
    // PAID
    // =====================================================

    if (
      invoice.paymentStatus ===
      PurchaseInvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        'Paid invoice cannot be cancelled',
      );
    }

    // =====================================================
    // CANCEL
    // =====================================================

    invoice.paymentStatus =
      PurchaseInvoiceStatus.CANCELLED;

    await this.purchaseInvoiceRepository.save(
      invoice,
    );

    return this.findPurchaseInvoice(
      id,
    );
  }
}