import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PosService } from './pos.service';

import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { HoldBillDto } from './dto/hold-bill.dto';
import { ReturnSaleDto } from './dto/return-sale.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import { AppPermission } from '../common/permissions/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('pos')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@RequirePermissions(AppPermission.POS)
export class PosController {
  constructor(
    private readonly posService: PosService,
  ) {}

  // ============================================================
  // CREATE SALE
  // ============================================================

  @Post('sales')
  async createSale(
    @Body() dto: CreatePosSaleDto,
    @Req() req: any,
  ) {
    return this.posService.createSale(
      dto,
      req.user,
    );
  }

  // ============================================================
  // GET SALES
  // ============================================================

  @Get('sales')
  async getSales(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit =
      limit &&
      !Number.isNaN(Number(limit))
        ? Number(limit)
        : undefined;

    return this.posService.getSales({
      search:
        search?.trim() ||
        undefined,

      limit: parsedLimit,
    });
  }

  // ============================================================
  // GET SINGLE SALE
  // ============================================================

  @Get('sales/:idOrInvoice')
  async getSaleById(
    @Param('idOrInvoice')
    idOrInvoice: string,
  ) {
    return this.posService.getSaleById(
      idOrInvoice,
    );
  }

  // ============================================================
  // SEND EMAIL RECEIPT
  // ============================================================

  @Post('sales/:id/email-receipt')
  async sendEmailReceipt(
    @Param('id') id: string,

    @Body()
    body: {
      email: string;
    },
  ) {
    return this.posService.sendEmailReceipt(
      id,
      body.email,
    );
  }

  // ============================================================
  // HOLD BILL
  // ============================================================

  @Post('held-bills')
  async holdBill(
    @Body() dto: HoldBillDto,
    @Req() req: any,
  ) {
    return this.posService.holdBill(
      dto,
      req.user?.id,
    );
  }

  // ============================================================
  // GET HELD BILLS
  // ============================================================

  @Get('held-bills')
  async getHeldBills() {
    return this.posService.getHeldBills();
  }

  // ============================================================
  // DELETE HELD BILL
  // ============================================================

  @Delete('held-bills/:id')
  async deleteHeldBill(
    @Param('id') id: string,
  ) {
    return this.posService.deleteHeldBill(
      id,
    );
  }

  // ============================================================
  // CREATE RETURN
  // ============================================================

  @Post('returns')
  async createReturn(
    @Body() dto: ReturnSaleDto,
    @Req() req: any,
  ) {
    return this.posService.createReturn(
      dto,
      req.user?.id,
    );
  }

  // ============================================================
  // CASH CLOSING SUMMARY
  // ============================================================

  @Get('cash-closing-summary')
  async getCashClosingSummary(
    @Query('date') date?: string,
  ) {
    return this.posService.getCashClosingSummary(
      date,
    );
  }
}