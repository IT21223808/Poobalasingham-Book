import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';

import { PurchasingService } from './purchasing.service';

import { PurchaseRequisitionService } from './services/purchase-requisition.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { GoodsReceiptService } from './services/goods-receipt.service';
import { PurchaseInvoiceService } from './services/purchase-invoice.service';
import { PurchaseReturnService } from './services/purchase-return.service';
import { PurchasePaymentService } from './services/purchase-payment.service';

import { CreatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { UpdatePurchaseRequisitionDto } from './dto/update-purchase-requisition.dto';

import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

import { CreateGrnDto } from './dto/create-grn.dto';

import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';

import { CreatePurchasePaymentDto } from './dto/create-purchase-payment.dto';

import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';

@Controller('purchasing')
export class PurchasingController {
  constructor(
    private readonly purchasingService: PurchasingService,

    private readonly purchaseRequisitionService: PurchaseRequisitionService,

    private readonly purchaseOrderService: PurchaseOrderService,

    private readonly goodsReceiptService: GoodsReceiptService,

    private readonly purchaseInvoiceService: PurchaseInvoiceService,

    private readonly purchaseReturnService: PurchaseReturnService,

    private readonly purchasePaymentService: PurchasePaymentService,
  ) {}

  // =========================================================
  // PURCHASE REQUISITIONS
  // =========================================================

  @Post('requisitions')
  createRequisition(
    @Body() dto: CreatePurchaseRequisitionDto,
  ) {
    return this.purchaseRequisitionService.create(dto);
  }

  @Get('requisitions')
  findAllRequisitions() {
    return this.purchaseRequisitionService.findAll();
  }

  @Get('requisitions/:id')
  findOneRequisition(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseRequisitionService.findOne(id);
  }

  @Patch('requisitions/:id')
  updateRequisition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseRequisitionDto,
  ) {
    return this.purchaseRequisitionService.update(
      id,
      dto,
    );
  }

  @Patch('requisitions/:id/approve')
  approveRequisition(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseRequisitionService.approve(id);
  }

  @Patch('requisitions/:id/reject')
  rejectRequisition(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseRequisitionService.reject(id);
  }

  // =========================================================
  // PURCHASE ORDERS
  // =========================================================

  // CREATE
  @Post('orders')
  createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrderService.createPurchaseOrder(
      dto,
    );
  }

  // LIST
  @Get('orders')
  findAllPurchaseOrders() {
    return this.purchaseOrderService.findAllPurchaseOrders();
  }

  // VIEW
  @Get('orders/:id')
  findPurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseOrderService.findPurchaseOrder(
      id,
    );
  }

  // UPDATE
  @Put('orders/:id')
  updatePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrderService.updatePurchaseOrder(
      id,
      dto,
    );
  }

  // APPROVE
  @Patch('orders/:id/approve')
  approvePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseOrderService.approvePurchaseOrder(
      id,
    );
  }

  // CANCEL
  @Patch('orders/:id/cancel')
  cancelPurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseOrderService.cancelPurchaseOrder(
      id,
    );
  }

  // DELETE
  @Delete('orders/:id')
  deletePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseOrderService.deletePurchaseOrder(
      id,
    );
  }

  // =========================================================
  // GOODS RECEIPT NOTE
  // =========================================================

  @Post('grn')
  createGrn(
    @Body() dto: CreateGrnDto,
  ) {
    return this.goodsReceiptService.createGrn(dto);
  }

  @Get('grn')
  findAllGrns() {
    return this.goodsReceiptService.findAllGrns();
  }

  @Get('grn/:id')
  findGrn(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.goodsReceiptService.findGrn(id);
  }

  @Put('grn/:id')
  updateGrn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateGrnDto,
  ) {
    return this.goodsReceiptService.updateGrn(
      id,
      dto,
    );
  }

  @Delete('grn/:id')
  deleteGrn(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.goodsReceiptService.deleteGrn(id);
  }

  // =========================================================
  // PURCHASE INVOICES
  // =========================================================

  @Post('invoices')
  createPurchaseInvoice(
    @Body() dto: CreatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.createPurchaseInvoice(
      dto,
    );
  }

  @Get('invoices')
  findAllPurchaseInvoices() {
    return this.purchaseInvoiceService.findAllPurchaseInvoices();
  }

  @Get('invoices/:id')
  findPurchaseInvoice(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseInvoiceService.findPurchaseInvoice(
      id,
    );
  }

  @Put('invoices/:id')
  updatePurchaseInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseInvoiceDto,
  ) {
    return this.purchaseInvoiceService.updatePurchaseInvoice(
      id,
      dto,
    );
  }

  @Patch('invoices/:id/cancel')
  cancelPurchaseInvoice(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseInvoiceService.cancelPurchaseInvoice(
      id,
    );
  }

  // =========================================================
  // PURCHASE PAYMENTS
  // =========================================================

  @Post('invoices/:invoiceId/payments')
  createPurchasePayment(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Body() dto: CreatePurchasePaymentDto,
  ) {
    return this.purchasePaymentService.createPayment(
      invoiceId,
      dto,
    );
  }

  @Get('invoices/:invoiceId/payments')
  findPurchaseInvoicePayments(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
  ) {
    return this.purchasePaymentService.findPaymentsByInvoice(
      invoiceId,
    );
  }

  @Delete(
    'invoices/:invoiceId/payments/:paymentId',
  )
  deletePurchasePayment(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ) {
    return this.purchasePaymentService.deletePayment(
      invoiceId,
      paymentId,
    );
  }

  // =========================================================
  // PURCHASE RETURNS
  // =========================================================

  @Post('returns')
  createPurchaseReturn(
    @Body() dto: CreatePurchaseReturnDto,
  ) {
    return this.purchaseReturnService.createPurchaseReturn(
      dto,
    );
  }

  @Get('returns')
  findAllPurchaseReturns() {
    return this.purchaseReturnService.findAllPurchaseReturns();
  }

  @Get('returns/:id')
  findPurchaseReturn(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchaseReturnService.findPurchaseReturn(
      id,
    );
  }

  // =========================================================
  // PURCHASING DASHBOARD
  // =========================================================

  @Get('dashboard')
  getDashboard() {
    return this.purchasingService.getDashboard();
  }
}