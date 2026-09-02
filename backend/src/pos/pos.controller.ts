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
import { AuthGuard } from '@nestjs/passport';
import { PosService } from './pos.service';
import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { HoldBillDto } from './dto/hold-bill.dto';
import { ReturnSaleDto } from './dto/return-sale.dto';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('sales')
  @UseGuards(AuthGuard('jwt'))
  async createSale(@Body() dto: CreatePosSaleDto, @Req() req: any) {
    const cashierId = req.user?.email || req.user?.id ? String(req.user.id || req.user.email) : 'Admin User';
    return await this.posService.createSale(dto, cashierId);
  }

  @Get('sales')
  @UseGuards(AuthGuard('jwt'))
  async getSales(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.posService.getSales({
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('sales/:id')
  @UseGuards(AuthGuard('jwt'))
  async getSaleById(@Param('id') id: string) {
    return await this.posService.getSaleById(id);
  }

  @Post('hold')
  @UseGuards(AuthGuard('jwt'))
  async holdBill(@Body() dto: HoldBillDto, @Req() req: any) {
    const cashierId = req.user?.email || req.user?.id ? String(req.user.id || req.user.email) : 'Admin User';
    return await this.posService.holdBill(dto, cashierId);
  }

  @Get('hold')
  @UseGuards(AuthGuard('jwt'))
  async getHeldBills() {
    return await this.posService.getHeldBills();
  }

  @Delete('hold/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteHeldBill(@Param('id') id: string) {
    await this.posService.deleteHeldBill(id);
    return { success: true, message: 'Held bill removed.' };
  }

  @Post('returns')
  @UseGuards(AuthGuard('jwt'))
  async createReturn(@Body() dto: ReturnSaleDto, @Req() req: any) {
    const cashierId = req.user?.email || req.user?.id ? String(req.user.id || req.user.email) : 'Admin User';
    return await this.posService.createReturn(dto, cashierId);
  }

  @Get('cash-closing')
  @UseGuards(AuthGuard('jwt'))
  async getCashClosing(@Query('date') date?: string) {
    return await this.posService.getCashClosingSummary(date);
  }
}
