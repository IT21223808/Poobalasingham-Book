import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { StockTransferDto } from './dto/stock-transfer.dto';

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


  @Post('locations')
@UseGuards(AuthGuard('jwt'))
async createLocation(
  @Body() dto: CreateLocationDto,
) {
  return this.inventoryService.createLocation(dto);
}

@Get('locations')
@UseGuards(AuthGuard('jwt'))
async getLocations() {
  return this.inventoryService.getLocations();
}

@Get('locations/:id')
@UseGuards(AuthGuard('jwt'))
async getLocation(
  @Param('id') id: string,
) {
  return this.inventoryService.getLocation(id);
}

@Patch('locations/:id')
@UseGuards(AuthGuard('jwt'))
async updateLocation(
  @Param('id') id: string,
  @Body() dto: UpdateLocationDto,
) {
  return this.inventoryService.updateLocation(
    id,
    dto,
  );
}

@Delete('locations/:id')
@UseGuards(AuthGuard('jwt'))
async deleteLocation(
  @Param('id') id: string,
) {
  return this.inventoryService.deleteLocation(id);
}

@Get('locations/:id/stock')
@UseGuards(AuthGuard('jwt'))
async getLocationStock(
  @Param('id') id: string,
) {
  return this.inventoryService.getLocationStock(id);
}

@Post('stock-transfer')
@UseGuards(AuthGuard('jwt'))
async stockTransfer(
  @Body() dto: StockTransferDto,
  @Req() req: Request,
) {
  const userId =
    (req.user as any)?.sub;

  return this.inventoryService.stockTransfer(
    dto,
    userId,
  );
}
}