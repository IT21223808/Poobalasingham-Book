import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  DataSource,
  EntityManager,
  QueryRunner,
} from "typeorm";

import {
  PosSale,
  SaleStatus,
} from "./entities/pos-sale.entity";

import { PosSaleItem } from "./entities/pos-sale-item.entity";
import { PosPayment } from "./entities/pos-payment.entity";
import { PosHeldBill } from "./entities/pos-held-bill.entity";
import { PosReturn } from "./entities/pos-return.entity";
import { PosReturnItem } from "./entities/pos-return-item.entity";

import { Product } from "../products/entities/product.entity";

import { CreatePosSaleDto } from "./dto/create-pos-sale.dto";
import { HoldBillDto } from "./dto/hold-bill.dto";
import { ReturnSaleDto } from "./dto/return-sale.dto";

@Injectable()
export class PosService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /* =========================================================
     INVOICE NUMBER
  ========================================================= */

  private async generateInvoiceNumber(
    manager: EntityManager,
  ): Promise<string> {
    const todayStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const prefix = `INV-${todayStr}-`;

    const lastSale = await manager
      .createQueryBuilder(PosSale, "sale")
      .where(
        "sale.invoiceNumber LIKE :prefix",
        {
          prefix: `${prefix}%`,
        },
      )
      .orderBy(
        "sale.invoiceNumber",
        "DESC",
      )
      .setLock("pessimistic_write")
      .getOne();

    let seq = 1;

    if (
      lastSale?.invoiceNumber
    ) {
      const parts =
        lastSale.invoiceNumber.split("-");

      if (parts.length === 3) {
        const parsedSeq = parseInt(
          parts[2],
          10,
        );

        if (!Number.isNaN(parsedSeq)) {
          seq = parsedSeq + 1;
        }
      }
    }

    return `${prefix}${seq
      .toString()
      .padStart(4, "0")}`;
  }

  /* =========================================================
     HOLD NUMBER
  ========================================================= */

  private async generateHoldNumber(): Promise<string> {
    const todayStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const prefix = `HOLD-${todayStr}-`;

    const lastHold =
      await this.dataSource
        .getRepository(PosHeldBill)
        .createQueryBuilder("hold")
        .where(
          "hold.holdNumber LIKE :prefix",
          {
            prefix: `${prefix}%`,
          },
        )
        .orderBy(
          "hold.holdNumber",
          "DESC",
        )
        .getOne();

    let seq = 1;

    if (lastHold?.holdNumber) {
      const parts =
        lastHold.holdNumber.split("-");

      if (parts.length === 3) {
        const parsedSeq = parseInt(
          parts[2],
          10,
        );

        if (!Number.isNaN(parsedSeq)) {
          seq = parsedSeq + 1;
        }
      }
    }

    return `${prefix}${seq
      .toString()
      .padStart(4, "0")}`;
  }

  /* =========================================================
     RETURN NUMBER
  ========================================================= */

  private async generateReturnNumber(
    manager: EntityManager,
  ): Promise<string> {
    const todayStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    const prefix = `RET-${todayStr}-`;

    const lastReturn = await manager
      .createQueryBuilder(
        PosReturn,
        "ret",
      )
      .where(
        "ret.returnNumber LIKE :prefix",
        {
          prefix: `${prefix}%`,
        },
      )
      .orderBy(
        "ret.returnNumber",
        "DESC",
      )
      .setLock("pessimistic_write")
      .getOne();

    let seq = 1;

    if (
      lastReturn?.returnNumber
    ) {
      const parts =
        lastReturn.returnNumber.split(
          "-",
        );

      if (parts.length === 3) {
        const parsedSeq = parseInt(
          parts[2],
          10,
        );

        if (!Number.isNaN(parsedSeq)) {
          seq = parsedSeq + 1;
        }
      }
    }

    return `${prefix}${seq
      .toString()
      .padStart(4, "0")}`;
  }

  /* =========================================================
     FIND SALE BY CLIENT SALE ID
  ========================================================= */

  private async findSaleByClientSaleId(
    clientSaleId?: string,
  ): Promise<PosSale | null> {
    if (!clientSaleId) {
      return null;
    }

    return await this.dataSource
      .getRepository(PosSale)
      .createQueryBuilder("sale")
      .leftJoinAndSelect(
        "sale.items",
        "items",
      )
      .leftJoinAndSelect(
        "sale.payments",
        "payments",
      )
      .leftJoinAndSelect(
        "sale.location",
        "location",
      )
      .where(
        "sale.clientSaleId = :clientSaleId",
        {
          clientSaleId,
        },
      )
      .getOne();
  }

  /* =========================================================
     CREATE SALE
  ========================================================= */

  async createSale(
    dto: CreatePosSaleDto,
    cashierId?: string,
  ): Promise<PosSale> {
    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        "Cannot process sale with empty cart.",
      );
    }

    if (
      !dto.payments ||
      dto.payments.length === 0
    ) {
      throw new BadRequestException(
        "At least one payment method is required.",
      );
    }

    /* -------------------------------------------------------
       Validate payment total
    ------------------------------------------------------- */

    const totalPayment =
      dto.payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0,
          ),
        0,
      );

    const grandTotal = Number(
      dto.grandTotal || 0,
    );

    if (
      Math.abs(
        totalPayment - grandTotal,
      ) > 0.01
    ) {
      throw new BadRequestException(
        `Payment total (Rs. ${totalPayment.toFixed(
          2,
        )}) must equal grand total (Rs. ${grandTotal.toFixed(
          2,
        )})`,
      );
    }

    /* -------------------------------------------------------
       First idempotency check
    ------------------------------------------------------- */

    if (dto.clientSaleId) {
      const existingSale =
        await this.findSaleByClientSaleId(
          dto.clientSaleId,
        );

      if (existingSale) {
        return existingSale;
      }
    }

    const queryRunner: QueryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /* -----------------------------------------------------
         Second idempotency check inside transaction
      ----------------------------------------------------- */

      if (dto.clientSaleId) {
        const existingSale =
          await queryRunner.manager
            .createQueryBuilder(
              PosSale,
              "sale",
            )
            .leftJoinAndSelect(
              "sale.items",
              "items",
            )
            .leftJoinAndSelect(
              "sale.payments",
              "payments",
            )
            .leftJoinAndSelect(
              "sale.location",
              "location",
            )
            .where(
              "sale.clientSaleId = :clientSaleId",
              {
                clientSaleId:
                  dto.clientSaleId,
              },
            )
            .getOne();

        if (existingSale) {
          await queryRunner.commitTransaction();
          return existingSale;
        }
      }

      /* -----------------------------------------------------
         Aggregate product quantities
         Prevent duplicate product IDs in a malicious payload
      ----------------------------------------------------- */

      const requestedQuantityMap =
        new Map<string, number>();

      for (const item of dto.items) {
        const current =
          requestedQuantityMap.get(
            item.productId,
          ) || 0;

        requestedQuantityMap.set(
          item.productId,
          current + item.quantity,
        );
      }

      /* -----------------------------------------------------
         Lock + validate all products
      ----------------------------------------------------- */

      const lockedProducts =
        new Map<string, Product>();

      for (
        const [
          productId,
          requestedQuantity,
        ] of requestedQuantityMap
      ) {
        const product =
          await queryRunner.manager.findOne(
            Product,
            {
              where: {
                id: productId,
              },
              lock: {
                mode: "pessimistic_write",
              },
            },
          );

        if (!product) {
          const originalItem =
            dto.items.find(
              (item) =>
                item.productId ===
                productId,
            );

          throw new BadRequestException(
            `Product "${originalItem?.productName || productId}" (ID: ${productId}) not found.`,
          );
        }

        if (
          Number(
            product.stockQuantity,
          ) < requestedQuantity
        ) {
          throw new BadRequestException(
            `Insufficient stock for "${product.productName}". Available: ${product.stockQuantity}, Requested: ${requestedQuantity}`,
          );
        }

        lockedProducts.set(
          productId,
          product,
        );
      }

      /* -----------------------------------------------------
         Generate invoice
      ----------------------------------------------------- */

      const invoiceNumber =
        await this.generateInvoiceNumber(
          queryRunner.manager,
        );

      /* -----------------------------------------------------
         Create sale
      ----------------------------------------------------- */

      const sale =
        queryRunner.manager.create(
          PosSale,
          {
            clientSaleId:
              dto.clientSaleId ||
              null,

            invoiceNumber,

            subtotal:
              dto.subtotal,

            discountAmount:
              dto.discountAmount || 0,

            grandTotal:
              dto.grandTotal,

            status:
              SaleStatus.COMPLETED,

            customerId:
              dto.customerId ||
              null,

            customerName:
              dto.customerName ||
              null,

            cashierId:
              cashierId ||
              "System",

            notes:
              dto.notes ||
              null,

            locationId:
              dto.locationId ||
              null,
          },
        );

      const savedSale =
        await queryRunner.manager.save(
          PosSale,
          sale,
        );

      /* -----------------------------------------------------
         Sale items + stock deduction
      ----------------------------------------------------- */

      const saleItems: PosSaleItem[] =
        [];

      for (
        const itemDto of dto.items
      ) {
        const saleItem =
          queryRunner.manager.create(
            PosSaleItem,
            {
              posSale: savedSale,

              productId:
                itemDto.productId,

              productCode:
                itemDto.productCode,

              productName:
                itemDto.productName,

              barcode:
                itemDto.barcode ||
                null,

              unitPrice:
                itemDto.unitPrice,

              quantity:
                itemDto.quantity,

              discountAmount:
                itemDto.discountAmount ||
                0,

              lineTotal:
                itemDto.lineTotal,
            },
          );

        saleItems.push(
          saleItem,
        );
      }

      await queryRunner.manager.save(
        PosSaleItem,
        saleItems,
      );

      /* -----------------------------------------------------
         Deduct each product once using the locked entity
      ----------------------------------------------------- */

      for (
        const [
          productId,
          requestedQuantity,
        ] of requestedQuantityMap
      ) {
        const product =
          lockedProducts.get(
            productId,
          );

        if (!product) {
          continue;
        }

        product.stockQuantity =
          Math.max(
            0,
            Number(
              product.stockQuantity,
            ) -
              requestedQuantity,
          );

        await queryRunner.manager.save(
          Product,
          product,
        );
      }

      /* -----------------------------------------------------
         Payments
      ----------------------------------------------------- */

      const salePayments: PosPayment[] =
        [];

      for (
        const payDto of dto.payments
      ) {
        const payment =
          queryRunner.manager.create(
            PosPayment,
            {
              posSale: savedSale,

              paymentMethod:
                payDto.paymentMethod,

              amount:
                payDto.amount,

              amountReceived:
                payDto.amountReceived ??
                null,

              changeAmount:
                payDto.changeAmount ??
                null,

              referenceNumber:
                payDto.referenceNumber ??
                null,
            },
          );

        salePayments.push(
          payment,
        );
      }

      await queryRunner.manager.save(
        PosPayment,
        salePayments,
      );

      /* -----------------------------------------------------
         Delete held bill
      ----------------------------------------------------- */

      if (dto.heldBillId) {
        await queryRunner.manager.delete(
          PosHeldBill,
          {
            id: dto.heldBillId,
          },
        );
      }

      /* -----------------------------------------------------
         Commit
      ----------------------------------------------------- */

      await queryRunner.commitTransaction();

      savedSale.items =
        saleItems;

      savedSale.payments =
        salePayments;

      return savedSale;
    } catch (err: any) {
      if (
        queryRunner.isTransactionActive
      ) {
        await queryRunner.rollbackTransaction();
      }

      /* -----------------------------------------------------
         PostgreSQL unique violation
         Exact-once retry protection
      ----------------------------------------------------- */

      const errorCode =
        err?.code;

      const errorText = String(
        err?.detail ||
          err?.message ||
          "",
      );

      const isClientSaleDuplicate =
        errorCode === "23505" &&
        (
          errorText.includes(
            "client_sale_id",
          ) ||
          errorText.includes(
            "client_sale",
          ) ||
          errorText.includes(
            "IDX_pos_sales_client_sale_id",
          )
        );

      if (
        isClientSaleDuplicate &&
        dto.clientSaleId
      ) {
        const existingSale =
          await this.findSaleByClientSaleId(
            dto.clientSaleId,
          );

        if (existingSale) {
          return existingSale;
        }
      }

      console.error(
        "POS createSale error:",
        err,
      );

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /* =========================================================
     GET SALES
  ========================================================= */

  async getSales(
    query?: {
      search?: string;
      limit?: number;
    },
  ) {
    const qb =
      this.dataSource
        .getRepository(PosSale)
        .createQueryBuilder("sale")
        .leftJoinAndSelect(
          "sale.items",
          "items",
        )
        .leftJoinAndSelect(
          "sale.payments",
          "payments",
        )
        .leftJoinAndSelect(
          "sale.location",
          "location",
        )
        .orderBy(
          "sale.createdAt",
          "DESC",
        );

    if (
      query?.search &&
      query.search.trim()
    ) {
      qb.where(
        `
        sale.invoiceNumber ILIKE :search
        OR sale.customerName ILIKE :search
        OR sale.cashierId ILIKE :search
        OR location.name ILIKE :search
        `,
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    if (query?.limit) {
      qb.take(
        Math.max(
          1,
          query.limit,
        ),
      );
    }

    return await qb.getMany();
  }

  /* =========================================================
     GET SINGLE SALE
  ========================================================= */

  async getSaleById(
    idOrInvoice: string,
  ): Promise<PosSale> {
    const sale =
      await this.dataSource
        .getRepository(PosSale)
        .createQueryBuilder("sale")
        .leftJoinAndSelect(
          "sale.items",
          "items",
        )
        .leftJoinAndSelect(
          "sale.payments",
          "payments",
        )
        .leftJoinAndSelect(
          "sale.location",
          "location",
        )
        .where(
          `
          sale.id = :idOrInvoice
          OR sale.invoiceNumber = :idOrInvoice
          `,
          {
            idOrInvoice,
          },
        )
        .getOne();

    if (!sale) {
      throw new NotFoundException(
        `Invoice/Sale "${idOrInvoice}" not found.`,
      );
    }

    return sale;
  }

  /* =========================================================
     HOLD BILL
  ========================================================= */

  async holdBill(
    dto: HoldBillDto,
    cashierId?: string,
  ): Promise<PosHeldBill> {
    const holdNumber =
      await this.generateHoldNumber();

    const repo =
      this.dataSource.getRepository(
        PosHeldBill,
      );

    const heldBill =
      repo.create({
        holdNumber,

        customerId:
          dto.customerId ||
          null,

        customerName:
          dto.customerName ||
          null,

        cartData:
          dto.cartData,

        subtotal:
          dto.subtotal,

        discountAmount:
          dto.discountAmount ||
          0,

        grandTotal:
          dto.grandTotal,

        cashierId:
          cashierId ||
          "System",
      });

    return await repo.save(
      heldBill,
    );
  }

  /* =========================================================
     GET HELD BILLS
  ========================================================= */

  async getHeldBills(): Promise<
    PosHeldBill[]
  > {
    return await this.dataSource
      .getRepository(
        PosHeldBill,
      )
      .find({
        order: {
          createdAt: "DESC",
        },
      });
  }

  /* =========================================================
     DELETE HELD BILL
  ========================================================= */

  async deleteHeldBill(
    id: string,
  ): Promise<void> {
    const repo =
      this.dataSource.getRepository(
        PosHeldBill,
      );

    const result =
      await repo.delete(id);

    if (
      result.affected === 0
    ) {
      throw new NotFoundException(
        `Held bill "${id}" not found.`,
      );
    }
  }

  /* =========================================================
     CREATE RETURN
  ========================================================= */

  async createReturn(
    dto: ReturnSaleDto,
    cashierId?: string,
  ): Promise<PosReturn> {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /* -----------------------------------------------------
         Lock sale itself
         Prevent concurrent returns
      ----------------------------------------------------- */

      const sale =
        await queryRunner.manager.findOne(
          PosSale,
          {
            where: {
              id: dto.saleId,
            },

            relations: {
              items: true,
            },

            lock: {
              mode: "pessimistic_write",
            },
          },
        );

      if (!sale) {
        throw new NotFoundException(
          `Sale invoice "${dto.saleId}" not found.`,
        );
      }

      const existingReturns =
        await queryRunner.manager.find(
          PosReturn,
          {
            where: {
              posSaleId:
                sale.id,
            },

            relations: {
              items: true,
            },
          },
        );

      const returnedQtyMap: Record<
        string,
        number
      > = {};

      for (
        const ret of existingReturns
      ) {
        for (
          const item of ret.items
        ) {
          returnedQtyMap[
            item.productId
          ] =
            (
              returnedQtyMap[
                item.productId
              ] || 0
            ) +
            Number(item.quantity);
        }
      }

      let totalReturnAmount = 0;

      const returnItems: PosReturnItem[] =
        [];

      for (
        const retItemDto of dto.items
      ) {
        const originalItem =
          sale.items.find(
            (item) =>
              item.productId ===
              retItemDto.productId,
          );

        if (!originalItem) {
          throw new BadRequestException(
            `Product "${retItemDto.productId}" was not part of original sale.`,
          );
        }

        const alreadyReturned =
          returnedQtyMap[
            retItemDto.productId
          ] || 0;

        const availableReturnable =
          Number(
            originalItem.quantity,
          ) -
          alreadyReturned;

        if (
          retItemDto.quantity <= 0
        ) {
          throw new BadRequestException(
            "Return quantity must be greater than 0.",
          );
        }

        if (
          retItemDto.quantity >
          availableReturnable
        ) {
          throw new BadRequestException(
            `Cannot return ${retItemDto.quantity} unit(s) of "${originalItem.productName}". Maximum returnable quantity is ${availableReturnable}.`,
          );
        }

        if (
          retItemDto.refundUnitPrice <
          0
        ) {
          throw new BadRequestException(
            "Refund unit price cannot be negative.",
          );
        }

        const lineTotal =
          Number(
            retItemDto.refundUnitPrice,
          ) *
          Number(
            retItemDto.quantity,
          );

        totalReturnAmount +=
          lineTotal;

        const returnItem =
          queryRunner.manager.create(
            PosReturnItem,
            {
              productId:
                retItemDto.productId,

              productName:
                originalItem.productName,

              quantity:
                retItemDto.quantity,

              refundUnitPrice:
                retItemDto.refundUnitPrice,

              lineTotal,
            },
          );

        returnItems.push(
          returnItem,
        );

        /* ---------------------------------------------------
           Restore stock with lock
        --------------------------------------------------- */

        const product =
          await queryRunner.manager.findOne(
            Product,
            {
              where: {
                id:
                  retItemDto.productId,
              },

              lock: {
                mode:
                  "pessimistic_write",
              },
            },
          );

        if (!product) {
          throw new NotFoundException(
            `Product "${retItemDto.productId}" not found.`,
          );
        }

        product.stockQuantity =
          Number(
            product.stockQuantity,
          ) +
          Number(
            retItemDto.quantity,
          );

        await queryRunner.manager.save(
          Product,
          product,
        );
      }

      const returnNumber =
        await this.generateReturnNumber(
          queryRunner.manager,
        );

      const posReturn =
        queryRunner.manager.create(
          PosReturn,
          {
            returnNumber,

            posSaleId:
              sale.id,

            invoiceNumber:
              sale.invoiceNumber,

            customerId:
              sale.customerId ||
              null,

            cashierId:
              cashierId ||
              "System",

            totalReturnAmount,

            reason:
              dto.reason,

            items:
              returnItems,
          },
        );

      const savedReturn =
        await queryRunner.manager.save(
          PosReturn,
          posReturn,
        );

      /* -----------------------------------------------------
         Calculate final return state
      ----------------------------------------------------- */

      let totalOriginalItems = 0;
      let totalReturnedAllItems = 0;

      for (
        const item of sale.items
      ) {
        totalOriginalItems +=
          Number(item.quantity);

        totalReturnedAllItems +=
          (
            returnedQtyMap[
              item.productId
            ] || 0
          ) +
          Number(
            dto.items.find(
              (returnItem) =>
                returnItem.productId ===
                item.productId,
            )?.quantity || 0,
          );
      }

      if (
        totalReturnedAllItems >=
        totalOriginalItems
      ) {
        sale.status =
          SaleStatus.RETURNED;
      } else {
        sale.status =
          SaleStatus.PARTIALLY_RETURNED;
      }

      await queryRunner.manager.save(
        PosSale,
        sale,
      );

      await queryRunner.commitTransaction();

      return savedReturn;
    } catch (error) {
      if (
        queryRunner.isTransactionActive
      ) {
        await queryRunner.rollbackTransaction();
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* =========================================================
     CASH CLOSING SUMMARY
  ========================================================= */

  async getCashClosingSummary(
    dateStr?: string,
  ) {
    const targetDate =
      dateStr
        ? new Date(dateStr)
        : new Date();

    if (
      Number.isNaN(
        targetDate.getTime(),
      )
    ) {
      throw new BadRequestException(
        "Invalid date.",
      );
    }

    const startOfDay =
      new Date(targetDate);

    startOfDay.setHours(
      0,
      0,
      0,
      0,
    );

    const endOfDay =
      new Date(targetDate);

    endOfDay.setHours(
      23,
      59,
      59,
      999,
    );

    /* -------------------------------------------------------
       Sales
    ------------------------------------------------------- */

    const sales =
      await this.dataSource
        .getRepository(PosSale)
        .createQueryBuilder("sale")
        .leftJoinAndSelect(
          "sale.payments",
          "payments",
        )
        .where(
          "sale.createdAt BETWEEN :start AND :end",
          {
            start: startOfDay,
            end: endOfDay,
          },
        )
        .andWhere(
          "sale.status != :cancelled",
          {
            cancelled:
              SaleStatus.CANCELLED,
          },
        )
        .getMany();

    let cashSales = 0;
    let cardSales = 0;
    let qrSales = 0;
    let totalSales = 0;

    for (
      const sale of sales
    ) {
      totalSales += Number(
        sale.grandTotal || 0,
      );

      for (
        const payment of sale.payments
      ) {
        const amount =
          Number(
            payment.amount || 0,
          );

        if (
          payment.paymentMethod ===
          "CASH"
        ) {
          cashSales += amount;
        }

        if (
          payment.paymentMethod ===
          "CARD"
        ) {
          cardSales += amount;
        }

        if (
          payment.paymentMethod ===
          "QR"
        ) {
          qrSales += amount;
        }
      }
    }

    /* -------------------------------------------------------
       Returns
    ------------------------------------------------------- */

    const returns =
      await this.dataSource
        .getRepository(
          PosReturn,
        )
        .createQueryBuilder("ret")
        .where(
          "ret.createdAt BETWEEN :start AND :end",
          {
            start: startOfDay,
            end: endOfDay,
          },
        )
        .getMany();

    const totalRefunds =
      returns.reduce(
        (sum, item) =>
          sum +
          Number(
            item.totalReturnAmount ||
              0,
          ),
        0,
      );

    const openingCash = 0;

    const expectedCash =
      openingCash +
      cashSales -
      totalRefunds;

    return {
      date: startOfDay
        .toISOString()
        .slice(0, 10),

      totalTransactions:
        sales.length,

      openingCash,

      cashSales:

        Number(
          cashSales.toFixed(2),
        ),

      cardSales:
        Number(
          cardSales.toFixed(2),
        ),

      qrSales:
        Number(
          qrSales.toFixed(2),
        ),

      totalSales:
        Number(
          totalSales.toFixed(2),
        ),

      refundsCount:
        returns.length,

      totalRefunds:
        Number(
          totalRefunds.toFixed(2),
        ),

      expectedCash:
        Number(
          expectedCash.toFixed(2),
        ),
    };
  }
}
