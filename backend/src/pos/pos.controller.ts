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
} from "@nestjs/common";

import { AuthGuard } from "@nestjs/passport";

import { PosService } from "./pos.service";

import { CreatePosSaleDto } from "./dto/create-pos-sale.dto";
import { HoldBillDto } from "./dto/hold-bill.dto";
import { ReturnSaleDto } from "./dto/return-sale.dto";

@Controller("pos")
@UseGuards(AuthGuard("jwt"))
export class PosController {
  constructor(
    private readonly posService: PosService,
  ) {}

  /* =========================================================
     SALES
  ========================================================= */

  @Post("sales")
  async createSale(
    @Body() dto: CreatePosSaleDto,
    @Req() req: any,
  ) {
    const cashierId =
      req?.user?.id != null
        ? String(req.user.id)
        : req?.user?.email ||
          req?.user?.username ||
          "System";

    return await this.posService.createSale(
      dto,
      cashierId,
    );
  }

  @Get("sales")
  async getSales(
    @Query("search") search?: string,
    @Query("limit") limit?: string,
  ) {
    return await this.posService.getSales({
      search:
        search?.trim() || undefined,

      limit:
        limit && !Number.isNaN(Number(limit))
          ? Number(limit)
          : undefined,
    });
  }

  @Get("sales/:idOrInvoice")
  async getSaleById(
    @Param("idOrInvoice")
    idOrInvoice: string,
  ) {
    return await this.posService.getSaleById(
      idOrInvoice,
    );
  }

  /* =========================================================
     HELD BILLS
  ========================================================= */

  @Post("held-bills")
  async holdBill(
    @Body() dto: HoldBillDto,
    @Req() req: any,
  ) {
    const cashierId =
      req?.user?.id != null
        ? String(req.user.id)
        : req?.user?.email ||
          req?.user?.username ||
          "System";

    return await this.posService.holdBill(
      dto,
      cashierId,
    );
  }

  @Get("held-bills")
  async getHeldBills() {
    return await this.posService.getHeldBills();
  }

  @Delete("held-bills/:id")
  async deleteHeldBill(
    @Param("id") id: string,
  ) {
    return await this.posService.deleteHeldBill(
      id,
    );
  }

  /* =========================================================
     RETURNS
  ========================================================= */

  @Post("returns")
  async createReturn(
    @Body() dto: ReturnSaleDto,
    @Req() req: any,
  ) {
    const cashierId =
      req?.user?.id != null
        ? String(req.user.id)
        : req?.user?.email ||
          req?.user?.username ||
          "System";

    return await this.posService.createReturn(
      dto,
      cashierId,
    );
  }

  /* =========================================================
     CASH CLOSING
  ========================================================= */

  @Get("cash-closing-summary")
  async getCashClosingSummary(
    @Query("date") date?: string,
  ) {
    return await this.posService.getCashClosingSummary(
      date,
    );
  }
}