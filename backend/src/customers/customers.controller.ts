import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CustomersService } from './customers.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  // =========================================================
  // CREATE
  // POST /api/customers
  // =========================================================

  @Post()
  create(
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(dto);
  }

  // =========================================================
  // LIST / SEARCH
  // GET /api/customers
  // GET /api/customers?search=John
  // GET /api/customers?status=ACTIVE
  // =========================================================

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.customersService.findAll(
      search,
      status,
    );
  }

  // =========================================================
  // VIEW
  // GET /api/customers/:id
  // =========================================================

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.findOne(id);
  }

  // =========================================================
  // UPDATE
  // PATCH /api/customers/:id
  // =========================================================

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      id,
      dto,
    );
  }

  // =========================================================
  // DEACTIVATE
  // DELETE /api/customers/:id
  // =========================================================

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.remove(id);
  }

  // =========================================================
  // ACTIVATE
  // PATCH /api/customers/:id/activate
  // =========================================================

  @Patch(':id/activate')
  activate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.activate(id);
  }
}