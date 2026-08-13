import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { InventoryService } from './inventory.service';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  // STOCK IN
  @Post('stock-in')
  @UseGuards(AuthGuard('jwt'))
  async stockIn(
    @Body() dto: StockInDto,
    @Req() req: Request,
  ) {
    const user = req.user as {
      sub?: string | number;
      id?: string | number;
    };

    const userId = user?.sub ?? user?.id;

    return this.inventoryService.stockIn(
      dto,
      userId ? String(userId) : undefined,
    );
  }

  // STOCK OUT
  @Post('stock-out')
  @UseGuards(AuthGuard('jwt'))
  async stockOut(
    @Body() dto: StockOutDto,
    @Req() req: Request,
  ) {
    const user = req.user as {
      sub?: string | number;
      id?: string | number;
    };

    const userId = user?.sub ?? user?.id;

    return this.inventoryService.stockOut(
      dto,
      userId ? String(userId) : undefined,
    );
  }

  // MOVEMENT HISTORY
  @Get('movements')
  @UseGuards(AuthGuard('jwt'))
  async getMovements() {
    return this.inventoryService.getMovements();
  }
}