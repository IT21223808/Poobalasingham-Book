import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import {
  AppPermission,
} from '../common/permissions/permissions';

import {
  RequirePermissions,
} from '../common/decorators/permissions.decorator';

import {
  InventoryAccessContext,
  InventoryService,
} from './inventory.service';

import { UserRole } from '../users/user-role.enum';

import { StockInDto } from './dto/stock-in.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { StockTransferDto } from './dto/stock-transfer.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { PhysicalStockCountDto } from './dto/physical-stock-count.dto';
import { DamagedLostDto } from './dto/damaged-lost.dto';

@Controller('inventory')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  // =========================================================
  // AUTHENTICATED USER INVENTORY CONTEXT
  // =========================================================

  private getAccessContext(
    req: Request,
  ): InventoryAccessContext {
    const user = req.user as {
      sub?: string | number;
      id?: string | number;
      role?: UserRole | string;
      locationId?: string | null;
    };

    const rawUserId =
      user?.sub ?? user?.id;

    return {
      userId:
        rawUserId !== undefined &&
        rawUserId !== null
          ? String(rawUserId)
          : undefined,

      role: user?.role,

      locationId:
        user?.locationId ?? null,
    };
  }

  // =========================================================
  // STOCK IN
  // =========================================================

  @Post('stock-in')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async stockIn(
    @Body() dto: StockInDto,
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.stockIn(
      dto,
      context,
    );
  }

  // =========================================================
  // STOCK OUT
  // =========================================================

  @Post('stock-out')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async stockOut(
    @Body() dto: StockOutDto,
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.stockOut(
      dto,
      context,
    );
  }

  // =========================================================
  // INVENTORY DASHBOARD
  // =========================================================

  @Get('dashboard')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async getDashboard(
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.getDashboard(
      context,
    );
  }

  // =========================================================
  // STOCK ADJUSTMENT
  // =========================================================

  @Post('stock-adjustment')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async stockAdjustment(
    @Body() dto: StockAdjustmentDto,
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.stockAdjustment(
      dto,
      context,
    );
  }

  // =========================================================
  // PHYSICAL STOCK COUNT
  // =========================================================

  @Post('physical-stock-count')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async physicalStockCount(
    @Body() dto: PhysicalStockCountDto,
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.physicalStockCount(
      dto,
      context,
    );
  }

  // =========================================================
  // STOCK MOVEMENTS
  // =========================================================

  @Get('movements')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async getMovements(
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.getMovements(
      context,
    );
  }

  // =========================================================
  // LOCATIONS / BRANCHES
  // OWNER ONLY
  // =========================================================

  @Post('locations')
  @RequirePermissions(
    AppPermission.LOCATIONS,
  )
  async createLocation(
    @Body() dto: CreateLocationDto,
  ) {
    return this.inventoryService.createLocation(
      dto,
    );
  }

  // =========================================================
  // GET ALL LOCATIONS / BRANCHES
  // =========================================================

  @Get('locations')
  @RequirePermissions(
    AppPermission.LOCATIONS,
  )
  async getLocations() {
    return this.inventoryService.getLocations();
  }

  // =========================================================
  // GET SINGLE LOCATION / BRANCH
  // =========================================================

  @Get('locations/:id')
  @RequirePermissions(
    AppPermission.LOCATIONS,
  )
  async getLocation(
    @Param('id') id: string,
  ) {
    return this.inventoryService.getLocation(
      id,
    );
  }

  // =========================================================
  // UPDATE LOCATION / BRANCH
  // =========================================================

  @Patch('locations/:id')
  @RequirePermissions(
    AppPermission.LOCATIONS,
  )
  async updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.inventoryService.updateLocation(
      id,
      dto,
    );
  }

  // =========================================================
  // DELETE LOCATION / BRANCH
  // =========================================================

  @Delete('locations/:id')
  @RequirePermissions(
    AppPermission.LOCATIONS,
  )
  async deleteLocation(
    @Param('id') id: string,
  ) {
    return this.inventoryService.deleteLocation(
      id,
    );
  }

  // =========================================================
  // LOCATION STOCK
  // =========================================================

  @Get('locations/:id/stock')
  @RequirePermissions(
    AppPermission.LOCATIONS,
  )
  async getLocationStock(
    @Param('id') id: string,
  ) {
    return this.inventoryService.getLocationStock(
      id,
    );
  }

  // =========================================================
  // STOCK TRANSFER
  // =========================================================

  @Post('stock-transfer')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async stockTransfer(
    @Body() dto: StockTransferDto,
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.stockTransfer(
      dto,
      context,
    );
  }

  // =========================================================
  // DAMAGED / LOST
  // =========================================================

  @Post('damaged-lost')
  @RequirePermissions(
    AppPermission.INVENTORY,
  )
  async recordDamagedLost(
    @Body() dto: DamagedLostDto,
    @Req() req: Request,
  ) {
    const context =
      this.getAccessContext(req);

    return this.inventoryService.recordDamagedLost(
      dto,
      context,
    );
  }
}