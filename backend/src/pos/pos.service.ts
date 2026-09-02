import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PosSale, SaleStatus } from './entities/pos-sale.entity';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { PosPayment } from './entities/pos-payment.entity';
import { PosHeldBill } from './entities/pos-held-bill.entity';
import { PosReturn } from './entities/pos-return.entity';
import { PosReturnItem } from './entities/pos-return-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { HoldBillDto } from './dto/hold-bill.dto';
import { ReturnSaleDto } from './dto/return-sale.dto';

@Injectable()
export class PosService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generates a database-safe, atomic invoice number: INV-YYYYMMDD-XXXX
   */
  private async generateInvoiceNumber(
    queryRunnerManager: any,
  ): Promise<string> {
    const todayStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const prefix = `INV-${todayStr}-`;

    const lastSale = await queryRunnerManager
      .createQueryBuilder(PosSale, 'sale')
      .where('sale.invoice_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('sale.invoice_number', 'DESC')
      .setLock('pessimistic_write')
      .getOne();

    let seq = 1;
    if (lastSale && lastSale.invoiceNumber) {
      const parts = lastSale.invoiceNumber.split('-');
      if (parts.length === 3) {
        const parsedSeq = parseInt(parts[2], 10);
        if (!isNaN(parsedSeq)) {
          seq = parsedSeq + 1;
        }
      }
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Generates a hold bill number: HOLD-YYYYMMDD-XXXX
   */
  private async generateHoldNumber(): Promise<string> {
    const todayStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const prefix = `HOLD-${todayStr}-`;

    const lastHold = await this.dataSource
      .getRepository(PosHeldBill)
      .createQueryBuilder('hold')
      .where('hold.hold_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('hold.hold_number', 'DESC')
      .getOne();

    let seq = 1;
    if (lastHold && lastHold.holdNumber) {
      const parts = lastHold.holdNumber.split('-');
      if (parts.length === 3) {
        const parsedSeq = parseInt(parts[2], 10);
        if (!isNaN(parsedSeq)) {
          seq = parsedSeq + 1;
        }
      }
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Generates a return number: RET-YYYYMMDD-XXXX
   */
  private async generateReturnNumber(
    queryRunnerManager: any,
  ): Promise<string> {
    const todayStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const prefix = `RET-${todayStr}-`;

    const lastReturn = await queryRunnerManager
      .createQueryBuilder(PosReturn, 'ret')
      .where('ret.return_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('ret.return_number', 'DESC')
      .getOne();

    let seq = 1;
    if (lastReturn && lastReturn.returnNumber) {
      const parts = lastReturn.returnNumber.split('-');
      if (parts.length === 3) {
        const parsedSeq = parseInt(parts[2], 10);
        if (!isNaN(parsedSeq)) {
          seq = parsedSeq + 1;
        }
      }
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  /**
   * Create POS Sale with Atomic DB Transaction & Stock Deduction
   */
  async createSale(dto: CreatePosSaleDto, cashierId?: string): Promise<PosSale> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Cannot process sale with empty cart.');
    }

    if (!dto.payments || dto.payments.length === 0) {
      throw new BadRequestException('At least one payment method is required.');
    }

    const totalPayment = dto.payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    if (Math.abs(totalPayment - Number(dto.grandTotal)) > 0.01) {
      throw new BadRequestException(
        `Payment total (Rs. ${totalPayment.toFixed(
          2,
        )}) must equal grand total (Rs. ${Number(dto.grandTotal).toFixed(2)})`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate all items and stock levels inside transaction
      for (const itemDto of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new BadRequestException(
            `Product "${itemDto.productName}" (ID: ${itemDto.productId}) not found.`,
          );
        }

        if (product.stockQuantity < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.productName}". Available: ${product.stockQuantity}, Requested: ${itemDto.quantity}`,
          );
        }
      }

      // 2. Generate unique atomic invoice number
      const invoiceNumber = await this.generateInvoiceNumber(queryRunner.manager);

      // 3. Create Sale record
      const sale = queryRunner.manager.create(PosSale, {
        invoiceNumber,
        subtotal: dto.subtotal,
        discountAmount: dto.discountAmount || 0,
        grandTotal: dto.grandTotal,
        status: SaleStatus.COMPLETED,
        customerId: dto.customerId || null,
        customerName: dto.customerName || null,
        cashierId: cashierId || 'System',
        notes: dto.notes || null,
      });

      const savedSale = await queryRunner.manager.save(PosSale, sale);

      // 4. Create Sale Items and Deduct Stock
      const saleItems: PosSaleItem[] = [];
      for (const itemDto of dto.items) {
        const saleItem = queryRunner.manager.create(PosSaleItem, {
          posSale: savedSale,
          productId: itemDto.productId,
          productCode: itemDto.productCode,
          productName: itemDto.productName,
          barcode: itemDto.barcode || null,
          unitPrice: itemDto.unitPrice,
          quantity: itemDto.quantity,
          discountAmount: itemDto.discountAmount || 0,
          lineTotal: itemDto.lineTotal,
        });

        saleItems.push(saleItem);

        // Deduct stock directly on product record
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
        });
        if (product) {
          product.stockQuantity = Math.max(0, product.stockQuantity - itemDto.quantity);
          await queryRunner.manager.save(Product, product);
        }
      }
      await queryRunner.manager.save(PosSaleItem, saleItems);

      // 5. Create Payments
      const salePayments: PosPayment[] = [];
      for (const payDto of dto.payments) {
        const payment = queryRunner.manager.create(PosPayment, {
          posSale: savedSale,
          paymentMethod: payDto.paymentMethod,
          amount: payDto.amount,
          amountReceived: payDto.amountReceived || null,
          changeAmount: payDto.changeAmount || null,
          referenceNumber: payDto.referenceNumber || null,
        });
        salePayments.push(payment);
      }
      await queryRunner.manager.save(PosPayment, salePayments);

      // 6. Delete held bill if resumed from hold
      if (dto.heldBillId) {
        await queryRunner.manager.delete(PosHeldBill, { id: dto.heldBillId });
      }

      // 7. Commit Transaction
      await queryRunner.commitTransaction();

      // Return complete sale object
      savedSale.items = saleItems;
      savedSale.payments = salePayments;
      return savedSale;
    } catch (err: any) {
      console.error('POS createSale error:', err);
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all sales with pagination / search
   */
  async getSales(query?: { search?: string; limit?: number }) {
    const qb = this.dataSource
      .getRepository(PosSale)
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.payments', 'payments')
      .orderBy('sale.createdAt', 'DESC');

    if (query?.search) {
      qb.where(
        'sale.invoiceNumber ILIKE :search OR sale.customerName ILIKE :search',
        { search: `%${query.search}%` },
      );
    }

    if (query?.limit) {
      qb.take(query.limit);
    }

    return await qb.getMany();
  }

  /**
   * Get single sale by ID or Invoice Number
   */
  async getSaleById(idOrInvoice: string): Promise<PosSale> {
    const repo = this.dataSource.getRepository(PosSale);
    const sale = await repo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.payments', 'payments')
      .where('sale.id = :idOrInvoice OR sale.invoiceNumber = :idOrInvoice', {
        idOrInvoice,
      })
      .getOne();

    if (!sale) {
      throw new NotFoundException(`Invoice/Sale "${idOrInvoice}" not found.`);
    }

    return sale;
  }

  /**
   * Hold Bill
   */
  async holdBill(dto: HoldBillDto, cashierId?: string): Promise<PosHeldBill> {
    const holdNumber = await this.generateHoldNumber();
    const repo = this.dataSource.getRepository(PosHeldBill);

    const heldBill = repo.create({
      holdNumber,
      customerId: dto.customerId || null,
      customerName: dto.customerName || null,
      cartData: dto.cartData,
      subtotal: dto.subtotal,
      discountAmount: dto.discountAmount || 0,
      grandTotal: dto.grandTotal,
      cashierId: cashierId || 'System',
    });

    return await repo.save(heldBill);
  }

  /**
   * Get all held bills
   */
  async getHeldBills(): Promise<PosHeldBill[]> {
    return await this.dataSource
      .getRepository(PosHeldBill)
      .find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Delete held bill
   */
  async deleteHeldBill(id: string): Promise<void> {
    const repo = this.dataSource.getRepository(PosHeldBill);
    const result = await repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Held bill "${id}" not found.`);
    }
  }

  /**
   * Process Return with Atomic Stock Restoration
   */
  async createReturn(dto: ReturnSaleDto, cashierId?: string): Promise<PosReturn> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(PosSale, {
        where: { id: dto.saleId },
        relations: { items: true },
      });

      if (!sale) {
        throw new NotFoundException(`Sale invoice "${dto.saleId}" not found.`);
      }

      // Check existing returns for this sale
      const existingReturns = await queryRunner.manager.find(PosReturn, {
        where: { posSaleId: sale.id },
        relations: { items: true },
      });

      const returnedQtyMap: Record<string, number> = {};
      for (const ret of existingReturns) {
        for (const item of ret.items) {
          returnedQtyMap[item.productId] =
            (returnedQtyMap[item.productId] || 0) + item.quantity;
        }
      }

      let totalReturnAmount = 0;
      const returnItems: PosReturnItem[] = [];

      for (const retItemDto of dto.items) {
        const originalItem = sale.items.find(
          (i) => i.productId === retItemDto.productId,
        );

        if (!originalItem) {
          throw new BadRequestException(
            `Product "${retItemDto.productId}" was not part of original sale.`,
          );
        }

        const alreadyReturned = returnedQtyMap[retItemDto.productId] || 0;
        const availableReturnable = originalItem.quantity - alreadyReturned;

        if (retItemDto.quantity > availableReturnable) {
          throw new BadRequestException(
            `Cannot return ${retItemDto.quantity} unit(s) of "${originalItem.productName}". Maximum returnable quantity is ${availableReturnable}.`,
          );
        }

        const lineTotal = Number(retItemDto.refundUnitPrice) * retItemDto.quantity;
        totalReturnAmount += lineTotal;

        const returnItem = queryRunner.manager.create(PosReturnItem, {
          productId: retItemDto.productId,
          productName: originalItem.productName,
          quantity: retItemDto.quantity,
          refundUnitPrice: retItemDto.refundUnitPrice,
          lineTotal,
        });

        returnItems.push(returnItem);

        // Restore stock in DB
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: retItemDto.productId },
        });
        if (product) {
          product.stockQuantity += retItemDto.quantity;
          await queryRunner.manager.save(Product, product);
        }
      }

      const returnNumber = await this.generateReturnNumber(queryRunner.manager);

      const posReturn = queryRunner.manager.create(PosReturn, {
        returnNumber,
        posSaleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerId: sale.customerId || null,
        cashierId: cashierId || 'System',
        totalReturnAmount,
        reason: dto.reason,
        items: returnItems,
      });

      const savedReturn = await queryRunner.manager.save(PosReturn, posReturn);

      // Update sale status
      let totalReturnedAllItems = 0;
      let totalOriginalItems = 0;
      for (const item of sale.items) {
        totalOriginalItems += item.quantity;
        totalReturnedAllItems +=
          (returnedQtyMap[item.productId] || 0) +
          (dto.items.find((i) => i.productId === item.productId)?.quantity || 0);
      }

      if (totalReturnedAllItems >= totalOriginalItems) {
        sale.status = SaleStatus.RETURNED;
      } else {
        sale.status = SaleStatus.PARTIALLY_RETURNED;
      }
      await queryRunner.manager.save(PosSale, sale);

      await queryRunner.commitTransaction();
      return savedReturn;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Daily Cash Closing Summary
   */
  async getCashClosingSummary(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.dataSource
      .getRepository(PosSale)
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.payments', 'payments')
      .where('sale.created_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .andWhere('sale.status != :cancelled', { cancelled: SaleStatus.CANCELLED })
      .getMany();

    let cashSales = 0;
    let cardSales = 0;
    let qrSales = 0;
    let totalSales = 0;

    for (const sale of sales) {
      totalSales += Number(sale.grandTotal);
      for (const pay of sale.payments) {
        const amt = Number(pay.amount);
        if (pay.paymentMethod === 'CASH') cashSales += amt;
        if (pay.paymentMethod === 'CARD') cardSales += amt;
        if (pay.paymentMethod === 'QR') qrSales += amt;
      }
    }

    const returns = await this.dataSource
      .getRepository(PosReturn)
      .createQueryBuilder('ret')
      .where('ret.created_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .getMany();

    const totalRefunds = returns.reduce(
      (sum, r) => sum + Number(r.totalReturnAmount),
      0,
    );

    const openingCash = 0; // Default opening float
    const expectedCash = openingCash + cashSales - totalRefunds;

    return {
      date: startOfDay.toISOString().slice(0, 10),
      totalTransactions: sales.length,
      openingCash,
      cashSales,
      cardSales,
      qrSales,
      totalSales,
      refundsCount: returns.length,
      totalRefunds,
      expectedCash,
    };
  }
}
