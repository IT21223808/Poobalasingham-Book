import {Body,Controller,Get,Param,ParseIntPipe,Post} from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreateGrnDto } from './dto/create-grn.dto';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';


@Controller('purchasing')
export class PurchasingController {
  constructor(
    private readonly purchasingService: PurchasingService,
  ) {}

  // PURCHASE REQUISITIONS

  @Post('requisitions')
  createRequisition(
    @Body() dto: CreatePurchaseRequisitionDto,
  ) {
    return this.purchasingService.create(dto);
  }

  @Get('requisitions')
  findAllRequisitions() {
    return this.purchasingService.findAll();
  }

  @Get('requisitions/:id')
  findOneRequisition(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchasingService.findOne(id);
  }

  // PURCHASE ORDERS

  @Post('orders')
  createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchasingService.createPurchaseOrder(dto);
  }

  @Get('orders')
  findAllPurchaseOrders() {
    return this.purchasingService.findAllPurchaseOrders();
  }

  @Get('orders/:id')
  findPurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchasingService.findPurchaseOrder(id);
  }

  @Post('grn')
createGrn(
  @Body() dto: CreateGrnDto,
) {
  return this.purchasingService.createGrn(dto);
}

@Get('grn')
findAllGrns() {
  return this.purchasingService.findAllGrns();
}

@Get('grn/:id')
findGrn(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.purchasingService.findGrn(id);
}

@Post('invoices')
createPurchaseInvoice(
  @Body() dto: CreatePurchaseInvoiceDto,
) {
  return this.purchasingService
    .createPurchaseInvoice(dto);
}

@Get('invoices')
findAllPurchaseInvoices() {
  return this.purchasingService
    .findAllPurchaseInvoices();
}

@Get('invoices/:id')
findPurchaseInvoice(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.purchasingService
    .findPurchaseInvoice(id);
}

@Post('returns')
createPurchaseReturn(
  @Body() dto: CreatePurchaseReturnDto,
) {
  return this.purchasingService
    .createPurchaseReturn(dto);
}

@Get('returns')
findAllPurchaseReturns() {
  return this.purchasingService
    .findAllPurchaseReturns();
}

@Get('returns/:id')
findPurchaseReturn(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.purchasingService
    .findPurchaseReturn(id);
}
}