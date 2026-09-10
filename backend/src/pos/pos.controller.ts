import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
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
import { CloseCashDto } from './dto/close-cash.dto';

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

  /* =========================================================
     USER LOCATION
  ========================================================= */

  private getUserLocationId(req: any): string {
    const locationId = req.user?.locationId;

    if (!locationId) {
      throw new UnauthorizedException(
        'User is not assigned to a branch/location.',
      );
    }

    return String(locationId);
  }

  /* =========================================================
     USER TILL
  ========================================================= */

  private getUserTillId(req: any): number | null {
    const tillId = req.user?.tillId;

    if (
      tillId === undefined ||
      tillId === null ||
      tillId === ''
    ) {
      return null;
    }

    const parsed = Number(tillId);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  /* =========================================================
     CREATE SALE
  ========================================================= */

  @Post('sales')
  async createSale(
    @Body() dto: CreatePosSaleDto,
    @Req() req: any,
  ) {
    const locationId =
      this.getUserLocationId(req);

    /*
     * IMPORTANT:
     * Never trust locationId from frontend.
     *
     * The branch comes from the authenticated JWT.
     * PosService also validates the final scope.
     */

    const scopedDto: CreatePosSaleDto = {
      ...dto,
      locationId,
    };

    return this.posService.createSale(
      scopedDto,
      req.user,
    );
  }

  /* =========================================================
     GET SALES
  ========================================================= */

  @Get('sales')
  async getSales(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const user = req?.user;

    if (!user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    let parsedLimit: number | undefined;

    if (limit !== undefined) {
      const numericLimit = Number(limit);

      if (
        !Number.isFinite(numericLimit) ||
        numericLimit <= 0
      ) {
        throw new BadRequestException(
          'Limit must be a positive number.',
        );
      }

      parsedLimit = Math.floor(numericLimit);
    }

    return this.posService.getSales(
      {
        search:
          search?.trim() || undefined,
        limit: parsedLimit,
      },
      user,
    );
  }

  /* =========================================================
     GET SINGLE SALE
  ========================================================= */

  @Get('sales/:idOrInvoice')
  async getSaleById(
    @Param('idOrInvoice') idOrInvoice: string,
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    return this.posService.getSaleById(
      idOrInvoice,
      req.user,
    );
  }

  /* =========================================================
     EMAIL RECEIPT
  ========================================================= */

  @Post('sales/:id/email-receipt')
  async sendEmailReceipt(
    @Param('id') id: string,
    @Body() body: { email: string },
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    return this.posService.sendEmailReceipt(
      id,
      body.email,
      req.user,
    );
  }

  /* =========================================================
     HOLD BILL
  ========================================================= */

  @Post('held-bills')
  async holdBill(
    @Body() dto: HoldBillDto,
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    return this.posService.holdBill(
      dto,
      req.user,
    );
  }

  /* =========================================================
     GET HELD BILLS
  ========================================================= */

  @Get('held-bills')
  async getHeldBills(
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    return this.posService.getHeldBills(
      req.user,
    );
  }

  /* =========================================================
     DELETE HELD BILL
  ========================================================= */

  @Delete('held-bills/:id')
  async deleteHeldBill(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    return this.posService.deleteHeldBill(
      id,
      req.user,
    );
  }

  /* =========================================================
     RETURN
  ========================================================= */

  @Post('returns')
  async createReturn(
    @Body() dto: ReturnSaleDto,
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    return this.posService.createReturn(
      dto,
      req.user,
    );
  }

  /* =========================================================
     OPENING BALANCE
  ========================================================= */

  @Get('opening-balance')
  async getOpeningBalance(
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    /*
     * IMPORTANT:
     * No locationId/tillId comes from frontend.
     *
     * PosService resolves:
     *
     * OWNER   -> JWT location + no till
     * MANAGER -> JWT location + no till
     * CASHIER -> JWT location + assigned till
     */

    return this.posService.getOpeningBalance(
      req.user,
    );
  }

  /* =========================================================
     SAVE OPENING BALANCE
  ========================================================= */

  @Post('opening-balance')
  async saveOpeningBalance(
    @Body()
    body: {
      openingBalance: number;
    },
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    const openingBalance =
      Number(body?.openingBalance);

    if (
      !Number.isFinite(openingBalance) ||
      openingBalance < 0
    ) {
      throw new BadRequestException(
        'Opening balance must be a valid non-negative amount.',
      );
    }

    /*
     * IMPORTANT:
     * Branch/till are NOT accepted from frontend.
     *
     * PosService uses req.user.locationId
     * and req.user.tillId from JWT.
     */

    return this.posService.saveOpeningBalance(
      req.user,
      openingBalance,
    );
  }

  /* =========================================================
     CASH CLOSING SUMMARY
  ========================================================= */

  @Get('cash-closing-summary')
  async getCashClosingSummary(
    @Query('date') date: string | undefined,
    @Req() req: any,
  ) {
    if (!req.user) {
      throw new UnauthorizedException(
        'Authenticated user is required.',
      );
    }

    return this.posService.getCashClosingSummary(
      date,
      req.user,
    );
  }
  @Get('cash-closing')
async getCashClosing(
  @Query('date') date: string | undefined,
  @Req() req: any,
) {
  if (!req.user) {
    throw new UnauthorizedException(
      'Authenticated user is required.',
    );
  }

  return this.posService.getCashClosing(
    date,
    req.user,
  );
}

@Post('cash-closing')
async closeCash(
  @Body() dto: CloseCashDto,
  @Req() req: any,
) {
  if (!req.user) {
    throw new UnauthorizedException(
      'Authenticated user is required.',
    );
  }

  return this.posService.closeCash(
    dto,
    req.user,
  );
}
}