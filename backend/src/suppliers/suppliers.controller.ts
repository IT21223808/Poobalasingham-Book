import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SuppliersService } from './suppliers.service';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import {
  AppPermission,
} from '../common/permissions/permissions';

import {
  RequirePermissions,
} from '../common/decorators/permissions.decorator';

@Controller('suppliers')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@RequirePermissions(AppPermission.SUPPLIERS)
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  // CREATE

  @Post()
  create(
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(dto);
  }

  // LIST

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  // VIEW

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.suppliersService.findOne(id);
  }

  // UPDATE

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(
      id,
      dto,
    );
  }

  // DELETE

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.suppliersService.remove(id);
  }

  // ACTIVATE

  @Patch(':id/activate')
  activate(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.suppliersService.activate(id);
  }

  // PURCHASE HISTORY

  @Get(':id/purchase-history')
  async getPurchaseHistory(
    @Param('id') id: string,
  ) {
    return this.suppliersService.getPurchaseHistory(
      Number(id),
    );
  }
}