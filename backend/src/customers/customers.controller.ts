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
  UseGuards,
} from '@nestjs/common';

import { CustomersService } from './customers.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import {
  AppPermission,
} from '../common/permissions/permissions';

import {
  RequirePermissions,
} from '../common/decorators/permissions.decorator';

@Controller('customers')
@UseGuards(
  JwtAuthGuard,
  // PermissionsGuard,
)
@RequirePermissions(AppPermission.CUSTOMERS)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  // CREATE

  @Post()
  create(
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(dto);
  }

  // LIST / SEARCH

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

  // VIEW

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.findOne(id);
  }

  // UPDATE

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

  // DEACTIVATE

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.remove(id);
  }

  // ACTIVATE

  @Patch(':id/activate')
  activate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.activate(id);
  }
}