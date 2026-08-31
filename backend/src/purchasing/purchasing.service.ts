import { Injectable } from '@nestjs/common';

import { PurchaseRequisitionService } from './services/purchase-requisition.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { GoodsReceiptService } from './services/goods-receipt.service';
import { PurchaseInvoiceService } from './services/purchase-invoice.service';
import { PurchaseReturnService } from './services/purchase-return.service';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  PurchaseRequisition,
  PurchaseRequisitionStatus,
} from './entities/purchase-requisition.entity';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';

import {
  GoodsReceivedNote,
  GrnStatus,
} from './entities/grn.entity';

import {
  PurchaseInvoice,
  PurchaseInvoiceStatus,
} from './entities/purchase-invoice.entity';

import {
  PurchaseReturn,
  PurchaseReturnStatus,
} from './entities/purchase-return.entity';

import { CreatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateGrnDto } from './dto/create-grn.dto';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';

@Injectable()
export class PurchasingService {
  constructor(
    // =======================================================
    // SERVICES
    // =======================================================

    private readonly requisitionService: PurchaseRequisitionService,

    private readonly purchaseOrderService: PurchaseOrderService,

    private readonly goodsReceiptService: GoodsReceiptService,

    private readonly purchaseInvoiceService: PurchaseInvoiceService,

    private readonly purchaseReturnService: PurchaseReturnService,

    // =======================================================
    // REPOSITORIES
    // =======================================================

    @InjectRepository(PurchaseRequisition)
    private readonly requisitionRepository: Repository<PurchaseRequisition>,

    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,

    @InjectRepository(GoodsReceivedNote)
    private readonly grnRepository: Repository<GoodsReceivedNote>,

    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,

    @InjectRepository(PurchaseReturn)
    private readonly purchaseReturnRepository: Repository<PurchaseReturn>,
  ) {}

  // =========================================================
  // PURCHASE REQUISITION
  // =========================================================

  create(dto: CreatePurchaseRequisitionDto) {
    return this.requisitionService.create(dto);
  }

  findAll() {
    return this.requisitionService.findAll();
  }

  findOne(id: number) {
    return this.requisitionService.findOne(id);
  }

  // =========================================================
  // PURCHASE ORDER
  // =========================================================

  createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    return this.purchaseOrderService.createPurchaseOrder(dto);
  }

  findPurchaseOrder(id: number) {
    return this.purchaseOrderService.findPurchaseOrder(id);
  }

  findAllPurchaseOrders() {
    return this.purchaseOrderService.findAllPurchaseOrders();
  }

  updatePurchaseOrder(
    id: number,
    dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrderService.updatePurchaseOrder(
      id,
      dto,
    );
  }

  approvePurchaseOrder(id: number) {
    return this.purchaseOrderService.approvePurchaseOrder(id);
  }

  cancelPurchaseOrder(id: number) {
    return this.purchaseOrderService.cancelPurchaseOrder(id);
  }

  deletePurchaseOrder(id: number) {
    return this.purchaseOrderService.deletePurchaseOrder(id);
  }

  // =========================================================
  // GOODS RECEIPT / GRN
  // =========================================================

  createGrn(dto: CreateGrnDto) {
    return this.goodsReceiptService.createGrn(dto);
  }

  findAllGrns() {
    return this.goodsReceiptService.findAllGrns();
  }

  findGrn(id: number) {
    return this.goodsReceiptService.findGrn(id);
  }

  updateGrn(
    id: number,
    dto: CreateGrnDto,
  ) {
    return this.goodsReceiptService.updateGrn(
      id,
      dto,
    );
  }

  deleteGrn(id: number) {
    return this.goodsReceiptService.deleteGrn(id);
  }

  cancelGrn(id: number) {
    return this.goodsReceiptService.cancelGrn(id);
  }

  // =========================================================
  // PURCHASE INVOICE
  // =========================================================

  createPurchaseInvoice(
    dto: CreatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.createPurchaseInvoice(
      dto,
    );
  }

  findPurchaseInvoice(id: number) {
    return this.purchaseInvoiceService.findPurchaseInvoice(
      id,
    );
  }

  findAllPurchaseInvoices() {
    return this.purchaseInvoiceService.findAllPurchaseInvoices();
  }

  updatePurchaseInvoice(
    id: number,
    dto: CreatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.updatePurchaseInvoice(
      id,
      dto,
    );
  }

  cancelPurchaseInvoice(id: number) {
    return this.purchaseInvoiceService.cancelPurchaseInvoice(
      id,
    );
  }

  // =========================================================
  // PURCHASE RETURN
  // =========================================================

  createPurchaseReturn(
    dto: CreatePurchaseReturnDto,
  ) {
    return this.purchaseReturnService.createPurchaseReturn(
      dto,
    );
  }

  findPurchaseReturn(id: number) {
    return this.purchaseReturnService.findPurchaseReturn(
      id,
    );
  }

  findAllPurchaseReturns() {
    return this.purchaseReturnService.findAllPurchaseReturns();
  }

  completePurchaseReturn(id: number) {
    return this.purchaseReturnService.completePurchaseReturn(
      id,
    );
  }

  cancelPurchaseReturn(id: number) {
    return this.purchaseReturnService.cancelPurchaseReturn(
      id,
    );
  }

  // =========================================================
  // PURCHASING DASHBOARD
  // =========================================================

  async getDashboard() {
    // =======================================================
    // 1. PURCHASE REQUISITIONS
    // =======================================================

    const [
      totalRequisitions,
      pendingRequisitions,
    ] = await Promise.all([
      this.requisitionRepository.count(),

      this.requisitionRepository.count({
        where: {
          status: PurchaseRequisitionStatus.PENDING,
        },
      }),
    ]);

    // =======================================================
    // 2. PURCHASE ORDERS
    // =======================================================

    const [
      totalPurchaseOrders,
      pendingPurchaseOrders,
      approvedPurchaseOrders,
      receivedPurchaseOrders,
      cancelledPurchaseOrders,
    ] = await Promise.all([
      this.purchaseOrderRepository.count(),

      this.purchaseOrderRepository.count({
        where: {
          status: PurchaseOrderStatus.PENDING,
        },
      }),

      this.purchaseOrderRepository.count({
        where: {
          status: PurchaseOrderStatus.APPROVED,
        },
      }),

      this.purchaseOrderRepository.count({
        where: {
          status: PurchaseOrderStatus.RECEIVED,
        },
      }),

      this.purchaseOrderRepository.count({
        where: {
          status: PurchaseOrderStatus.CANCELLED,
        },
      }),
    ]);

    // =======================================================
    // 3. TOTAL PURCHASE AMOUNT
    // =======================================================

    const purchaseAmountResult =
      await this.purchaseOrderRepository
        .createQueryBuilder('purchaseOrder')
        .select(
          'COALESCE(SUM(purchaseOrder.totalAmount), 0)',
          'totalAmount',
        )
        .where(
          'purchaseOrder.status != :cancelled',
          {
            cancelled:
              PurchaseOrderStatus.CANCELLED,
          },
        )
        .getRawOne();

    const totalPurchaseAmount = Number(
      purchaseAmountResult?.totalAmount ?? 0,
    );

    // =======================================================
    // 4. GOODS RECEIVED / GRN
    // =======================================================

    const [
      totalGoodsReceived,
      pendingGoodsReceived,
      partialGoodsReceived,
      cancelledGoodsReceived,
    ] = await Promise.all([
      // RECEIVED
      this.grnRepository.count({
        where: {
          status: GrnStatus.RECEIVED,
        },
      }),

      // DRAFT
      this.grnRepository.count({
        where: {
          status: GrnStatus.DRAFT,
        },
      }),

      // PARTIAL
      this.grnRepository.count({
        where: {
          status: GrnStatus.PARTIAL,
        },
      }),

      // CANCELLED
      this.grnRepository.count({
        where: {
          status: GrnStatus.CANCELLED,
        },
      }),
    ]);

    // =======================================================
    // 5. PURCHASE INVOICES
    // =======================================================

    const [
      totalPurchaseInvoices,
      draftPurchaseInvoices,
      unpaidPurchaseInvoices,
      partiallyPaidPurchaseInvoices,
      paidPurchaseInvoices,
      cancelledPurchaseInvoices,
    ] = await Promise.all([
      // TOTAL
      this.purchaseInvoiceRepository.count(),

      // DRAFT
      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.DRAFT,
        },
      }),

      // UNPAID
      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.UNPAID,
        },
      }),

      // PARTIALLY PAID
      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.PARTIALLY_PAID,
        },
      }),

      // PAID
      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.PAID,
        },
      }),

      // CANCELLED
      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.CANCELLED,
        },
      }),
    ]);

    // =======================================================
    // 6. PURCHASE RETURNS
    // =======================================================

    const [
      totalPurchaseReturns,
      pendingPurchaseReturns,
      completedPurchaseReturns,
      cancelledPurchaseReturns,
    ] = await Promise.all([
      // TOTAL
      this.purchaseReturnRepository.count(),

      // PENDING
      this.purchaseReturnRepository.count({
        where: {
          status:
            PurchaseReturnStatus.PENDING,
        },
      }),

      // COMPLETED
      this.purchaseReturnRepository.count({
        where: {
          status:
            PurchaseReturnStatus.COMPLETED,
        },
      }),

      // CANCELLED
      this.purchaseReturnRepository.count({
        where: {
          status:
            PurchaseReturnStatus.CANCELLED,
        },
      }),
    ]);

    // =======================================================
    // 7. RECENT PURCHASE ORDERS
    // =======================================================

    const recentOrders =
      await this.purchaseOrderRepository.find({
        relations: {
          items: {
            product: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },

        take: 5,
      });

    // =======================================================
    // 8. RECENT GRNs
    // =======================================================

    const recentGRNs =
      await this.grnRepository.find({
        relations: {
          items: {
            product: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },

        take: 5,
      });

    // =======================================================
    // 9. RECENT PURCHASE INVOICES
    // =======================================================

    const recentInvoices =
      await this.purchaseInvoiceRepository.find({
        relations: {
          items: {
            product: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },

        take: 5,
      });

    // =======================================================
    // 10. RECENT PURCHASE RETURNS
    // =======================================================

    const recentReturns =
      await this.purchaseReturnRepository.find({
        relations: {
          items: {
            product: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },

        take: 5,
      });

    // =======================================================
    // 11. FINAL DASHBOARD RESPONSE
    // =======================================================

    return {
      // =====================================================
      // SUMMARY
      // =====================================================

      summary: {
        // REQUISITIONS
        totalRequisitions,
        pendingRequisitions,

        // PURCHASE ORDERS
        totalPurchaseOrders,
        pendingPurchaseOrders,
        approvedPurchaseOrders,
        receivedPurchaseOrders,
        cancelledPurchaseOrders,

        // GRN
        totalGoodsReceived,
        pendingGoodsReceived,
        partialGoodsReceived,
        cancelledGoodsReceived,

        // PURCHASE INVOICES
        totalPurchaseInvoices,
        draftPurchaseInvoices,
        unpaidPurchaseInvoices,
        partiallyPaidPurchaseInvoices,
        paidPurchaseInvoices,
        cancelledPurchaseInvoices,

        // PURCHASE RETURNS
        totalPurchaseReturns,
        pendingPurchaseReturns,
        completedPurchaseReturns,
        cancelledPurchaseReturns,
      },

      // =====================================================
      // PURCHASE OVERVIEW
      // =====================================================

      overview: {
        totalPurchaseAmount,

        orders:
          totalPurchaseOrders,

        received:
          receivedPurchaseOrders,

        pending:
          pendingPurchaseOrders,

        approved:
          approvedPurchaseOrders,

        cancelled:
          cancelledPurchaseOrders,
      },

      // =====================================================
      // PURCHASE ORDER STATUS
      // =====================================================

      status: {
        pending:
          pendingPurchaseOrders,
        approved:
          approvedPurchaseOrders,
        received:
          receivedPurchaseOrders,
        cancelled:
          cancelledPurchaseOrders,
      },

      // =====================================================
      // RECENT DATA
      // =====================================================

      recentOrders,
      recentGRNs,
      recentInvoices,
      recentReturns,
    };
  }
}