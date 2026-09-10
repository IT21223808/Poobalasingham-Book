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
    // 3. PURCHASE ORDER AMOUNTS
    // =======================================================

    const totalPurchaseAmountResult =
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
      totalPurchaseAmountResult?.totalAmount ?? 0,
    );

    // -------------------------------------------------------
    // Received purchase amount
    // -------------------------------------------------------

    const receivedPurchaseAmountResult =
      await this.purchaseOrderRepository
        .createQueryBuilder('purchaseOrder')
        .select(
          'COALESCE(SUM(purchaseOrder.totalAmount), 0)',
          'totalAmount',
        )
        .where(
          'purchaseOrder.status = :received',
          {
            received:
              PurchaseOrderStatus.RECEIVED,
          },
        )
        .getRawOne();

    const totalReceivedAmount = Number(
      receivedPurchaseAmountResult?.totalAmount ?? 0,
    );

    // -------------------------------------------------------
    // Pending purchase amount
    // -------------------------------------------------------

    const pendingPurchaseAmountResult =
      await this.purchaseOrderRepository
        .createQueryBuilder('purchaseOrder')
        .select(
          'COALESCE(SUM(purchaseOrder.totalAmount), 0)',
          'totalAmount',
        )
        .where(
          'purchaseOrder.status IN (:...statuses)',
          {
            statuses: [
              PurchaseOrderStatus.PENDING,
              PurchaseOrderStatus.APPROVED,
            ],
          },
        )
        .getRawOne();

    const totalPendingAmount = Number(
      pendingPurchaseAmountResult?.totalAmount ?? 0,
    );

    // =======================================================
    // 4. GOODS RECEIVED NOTES
    // =======================================================

    const [
      totalGRNs,
      pendingGRNs,
      partialGRNs,
      cancelledGRNs,
    ] = await Promise.all([
      this.grnRepository.count(),

      this.grnRepository.count({
        where: {
          status: GrnStatus.DRAFT,
        },
      }),

      this.grnRepository.count({
        where: {
          status: GrnStatus.PARTIAL,
        },
      }),

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
      totalInvoices,
      draftInvoices,
      unpaidInvoices,
      partiallyPaidInvoices,
      paidInvoices,
      cancelledInvoices,
    ] = await Promise.all([
      this.purchaseInvoiceRepository.count(),

      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.DRAFT,
        },
      }),

      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.UNPAID,
        },
      }),

      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.PARTIALLY_PAID,
        },
      }),

      this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.PAID,
        },
      }),

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
      totalReturns,
      pendingReturns,
      completedReturns,
      cancelledReturns,
    ] = await Promise.all([
      this.purchaseReturnRepository.count(),

      this.purchaseReturnRepository.count({
        where: {
          status:
            PurchaseReturnStatus.PENDING,
        },
      }),

      this.purchaseReturnRepository.count({
        where: {
          status:
            PurchaseReturnStatus.COMPLETED,
        },
      }),

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

    const recentPurchaseOrders =
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
      // OVERVIEW
      // =====================================================

      overview: {
        // Requisitions
        totalRequisitions,
        pendingRequisitions,

        // Purchase Orders
        totalPurchaseOrders,
        pendingPurchaseOrders,

        // GRNs
        totalGRNs,
        pendingGRNs,

        // Invoices
totalInvoices,
pendingInvoices:
  draftInvoices + unpaidInvoices,

        // Returns
        totalReturns,
        pendingReturns,
      },

      // =====================================================
      // PURCHASE OVERVIEW
      // =====================================================

      purchaseOverview: {
        totalPurchases:
          totalPurchaseOrders,

        totalPurchaseAmount,

        totalReceivedAmount,

        totalPendingAmount,
      },

      // =====================================================
      // PURCHASE ORDER STATUS
      // =====================================================

      poStatus: {
        pending:
          pendingPurchaseOrders,

        approved:
          approvedPurchaseOrders,

        rejected: 0,

        completed:
          receivedPurchaseOrders,

        cancelled:
          cancelledPurchaseOrders,
      },

      // =====================================================
      // PURCHASE INVOICE STATUS
      // =====================================================

      invoiceStatus: {
        pending:
          draftInvoices + unpaidInvoices,

        partial:
          partiallyPaidInvoices,

        paid:
          paidInvoices,

        overdue: 0,

        cancelled:
          cancelledInvoices,
      },

      // =====================================================
      // PURCHASE RETURN STATUS
      // =====================================================

      returnStatus: {
        pending:
          pendingReturns,

        approved: 0,

        completed:
          completedReturns,

        rejected: 0,
      },

      // =====================================================
      // RECENT PURCHASE ORDERS
      // =====================================================

      recentPurchaseOrders,

      // =====================================================
      // RECENT GRNs
      // =====================================================

      recentGRNs,

      // =====================================================
      // RECENT PURCHASE RETURNS
      // =====================================================

      recentReturns,

      // =====================================================
      // RECENT PURCHASE INVOICES
      // =====================================================

      recentInvoices,
    };
  }
}