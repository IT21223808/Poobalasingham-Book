import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PurchasePayment } from '../entities/purchase-payment.entity';
import {
  PurchaseInvoice,
  PurchaseInvoiceStatus,} from '../entities/purchase-invoice.entity';
import { CreatePurchasePaymentDto } from '../dto/create-purchase-payment.dto';

@Injectable()
export class PurchasePaymentService {
  constructor(
    @InjectRepository(PurchasePayment)
    private readonly paymentRepository: Repository<PurchasePayment>,

    @InjectRepository(PurchaseInvoice)
    private readonly invoiceRepository: Repository<PurchaseInvoice>,
  ) {}

  // =========================================================
  // CREATE PAYMENT
  // =========================================================

  async createPayment(
    invoiceId: number,
    dto: CreatePurchasePaymentDto,
  ) {
    const invoice =
      await this.invoiceRepository.findOne({
        where: {
          id: invoiceId,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Purchase invoice not found',
      );
    }

    const currentStatus =
      invoice.paymentStatus?.toUpperCase();

    if (currentStatus === 'CANCELLED') {
      throw new BadRequestException(
        'Cancelled invoice cannot receive payments',
      );
    }

    if (currentStatus === 'PAID') {
      throw new BadRequestException(
        'This invoice is already fully paid',
      );
    }

    const existingPayments =
      await this.paymentRepository.find({
        where: {
          purchaseInvoiceId: invoiceId,
        },
      });

    const paidAmount =
      existingPayments.reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0,
      );

    const grandTotal =
      Number(invoice.grandTotal || 0);

    const balance =
      grandTotal - paidAmount;

    if (dto.amount > balance) {
      throw new BadRequestException(
        `Payment amount cannot exceed outstanding balance of ${balance.toFixed(
          2,
        )}`,
      );
    }

    const payment =
      this.paymentRepository.create({
        purchaseInvoiceId: invoiceId,
        amount: Number(dto.amount),
        paymentDate: dto.paymentDate,
        paymentMethod: dto.paymentMethod,
        referenceNumber:
          dto.referenceNumber,
        notes: dto.notes,
      });

    const savedPayment =
      await this.paymentRepository.save(
        payment,
      );

    // Recalculate after payment
    const newPaidAmount =
      paidAmount + Number(dto.amount);

    const newBalance =
      grandTotal - newPaidAmount;

    let newStatus: PurchaseInvoiceStatus;

    if (newPaidAmount <= 0) {
      newStatus = PurchaseInvoiceStatus.UNPAID;
    } else if (
      newPaidAmount < grandTotal
    ) {
      newStatus = PurchaseInvoiceStatus.PARTIALLY_PAID;
    } else {
      newStatus = PurchaseInvoiceStatus.PAID;
    }

    invoice.paymentStatus =
      newStatus;

    await this.invoiceRepository.save(
      invoice,
    );

    return {
      payment: savedPayment,

      invoiceId,

      grandTotal,

      paidAmount: newPaidAmount,

      balanceAmount:
        Math.max(newBalance, 0),

      paymentStatus: newStatus,
    };
  }

  // =========================================================
  // PAYMENT HISTORY
  // =========================================================

  async findPaymentsByInvoice(
    invoiceId: number,
  ) {
    const invoice =
      await this.invoiceRepository.findOne({
        where: {
          id: invoiceId,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Purchase invoice not found',
      );
    }

    const payments =
      await this.paymentRepository.find({
        where: {
          purchaseInvoiceId: invoiceId,
        },
        order: {
          paymentDate: 'DESC',
          id: 'DESC',
        },
      });

    const paidAmount =
      payments.reduce(
        (total, payment) =>
          total + Number(payment.amount || 0),
        0,
      );

    const grandTotal =
      Number(invoice.grandTotal || 0);

    return {
      invoiceId,

      grandTotal,

      paidAmount,

      balanceAmount:
        Math.max(
          grandTotal - paidAmount,
          0,
        ),

      paymentStatus:
        invoice.paymentStatus,

      payments,
    };
  }

  // =========================================================
  // DELETE PAYMENT
  // =========================================================

  async deletePayment(
    invoiceId: number,
    paymentId: number,
  ) {
    const payment =
      await this.paymentRepository.findOne({
        where: {
          id: paymentId,
          purchaseInvoiceId: invoiceId,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    const invoice =
      await this.invoiceRepository.findOne({
        where: {
          id: invoiceId,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Purchase invoice not found',
      );
    }

    await this.paymentRepository.remove(
      payment,
    );

    // Recalculate payments
    const remainingPayments =
      await this.paymentRepository.find({
        where: {
          purchaseInvoiceId: invoiceId,
        },
      });

    const paidAmount =
      remainingPayments.reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0,
      );

    const grandTotal =
  Number(invoice.grandTotal || 0);

if (paidAmount <= 0) {
  invoice.paymentStatus =
    PurchaseInvoiceStatus.UNPAID;
} else if (
  paidAmount < grandTotal
) {
  invoice.paymentStatus =
    PurchaseInvoiceStatus.PARTIALLY_PAID;
} else {
  invoice.paymentStatus =
    PurchaseInvoiceStatus.PAID;
}

    await this.invoiceRepository.save(
      invoice,
    );

    return {
      message:
        'Payment deleted successfully',

      invoiceId,

      grandTotal,

      paidAmount,

      balanceAmount:
        Math.max(
          grandTotal - paidAmount,
          0,
        ),

      paymentStatus:
        invoice.paymentStatus,
    };
  }
}