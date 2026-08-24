import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  // POST /api/suppliers

  @Post()
  create(
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(
      dto,
    );
  }

  // GET /api/suppliers

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  // GET /api/suppliers/:id

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.suppliersService.findOne(
      id,
    );
  }

  // PATCH /api/suppliers/:id

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

  // DELETE /api/suppliers/:id

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.suppliersService.remove(
      id,
    );
  }

  // PATCH /api/suppliers/:id/activate

  @Patch(':id/activate')
  activate(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.suppliersService.activate(
      id,
    );
  }

  @Get(':id/purchase-history')
async getPurchaseHistory(@Param('id') id: string) {
  return this.suppliersService.getPurchaseHistory(Number(id));
}
}