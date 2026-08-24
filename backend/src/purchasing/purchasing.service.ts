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
    private readonly requisitionService: PurchaseRequisitionService,

    private readonly purchaseOrderService: PurchaseOrderService,

    private readonly goodsReceiptService: GoodsReceiptService,

    private readonly purchaseInvoiceService: PurchaseInvoiceService,

    private readonly purchaseReturnService: PurchaseReturnService,

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

  createPurchaseOrder(
    dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrderService.createPurchaseOrder(
      dto,
    );
  }

  findPurchaseOrder(id: number) {
    return this.purchaseOrderService.findPurchaseOrder(
      id,
    );
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
    return this.purchaseOrderService.approvePurchaseOrder(
      id,
    );
  }

  cancelPurchaseOrder(id: number) {
    return this.purchaseOrderService.cancelPurchaseOrder(
      id,
    );
  }

  deletePurchaseOrder(id: number) {
    return this.purchaseOrderService.deletePurchaseOrder(
      id,
    );
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

  // =========================================================
  // PURCHASING DASHBOARD
  // =========================================================

  async getDashboard() {
    // REQUISITIONS

    const totalRequisitions =
      await this.requisitionRepository.count();

    const pendingRequisitions =
      await this.requisitionRepository.count({
        where: {
          status:
            PurchaseRequisitionStatus.PENDING,
        },
      });

    // PURCHASE ORDERS

    const totalPurchaseOrders =
      await this.purchaseOrderRepository.count();

    const pendingPurchaseOrders =
      await this.purchaseOrderRepository.count({
        where: {
          status:
            PurchaseOrderStatus.PENDING,
        },
      });

    const approvedPurchaseOrders =
      await this.purchaseOrderRepository.count({
        where: {
          status:
            PurchaseOrderStatus.APPROVED,
        },
      });

    const receivedPurchaseOrders =
      await this.purchaseOrderRepository.count({
        where: {
          status:
            PurchaseOrderStatus.RECEIVED,
        },
      });

    const cancelledPurchaseOrders =
      await this.purchaseOrderRepository.count({
        where: {
          status:
            PurchaseOrderStatus.CANCELLED,
        },
      });

    // TOTAL PURCHASE AMOUNT

    const purchaseAmountResult =
      await this.purchaseOrderRepository
        .createQueryBuilder(
          'purchaseOrder',
        )
        .select(
          'COALESCE(SUM(purchaseOrder.totalAmount), 0)',
          'totalAmount',
        )
        .getRawOne();

    const totalPurchaseAmount =
      Number(
        purchaseAmountResult?.totalAmount ?? 0,
      );

    // GOODS RECEIVED

    const totalGoodsReceived =
      await this.grnRepository.count({
        where: {
          status:
            GrnStatus.RECEIVED,
        },
      });

    // PURCHASE RETURNS

    const totalPurchaseReturns =
      await this.purchaseReturnRepository.count({
        where: {
          status:
            PurchaseReturnStatus.COMPLETED,
        },
      });

    // PURCHASE INVOICES

    const totalPurchaseInvoices =
      await this.purchaseInvoiceRepository.count();

    const postedPurchaseInvoices =
      await this.purchaseInvoiceRepository.count({
        where: {
          paymentStatus:
            PurchaseInvoiceStatus.DRAFT,
        },
      });

    // RECENT PURCHASE ORDERS

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

    // RECENT GRNs

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

    // RECENT RETURNS

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

    // RECENT INVOICES

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

    return {
      summary: {
        totalRequisitions,
        pendingRequisitions,
        totalPurchaseOrders,
        pendingPurchaseOrders,
        totalGoodsReceived,
        totalPurchaseReturns,
        totalPurchaseInvoices,
        postedPurchaseInvoices,
        cancelledPurchaseOrders,
      },

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

      recentOrders,
      recentGRNs,
      recentReturns,
      recentInvoices,
    };
  }
}