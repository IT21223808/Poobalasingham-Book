import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import {
  AppPermission,
} from '../common/permissions/permissions';

import {
  RequirePermissions,
} from '../common/decorators/permissions.decorator';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // ==========================================================
  // CURRENT PROFILE
  // ==========================================================

  @Get('profile')
  getProfile(
    @CurrentUser() user: any,
  ) {
    return user;
  }

  // ==========================================================
  // LIST USERS
  // OWNER ONLY
  // ==========================================================

  @Get()
  @RequirePermissions(AppPermission.SETTINGS)
  findAll() {
    return this.usersService.findAll();
  }

  // ==========================================================
  // GET USER
  // OWNER ONLY
  // ==========================================================

  @Get(':id')
  @RequirePermissions(AppPermission.SETTINGS)
  findById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.findById(id);
  }

  // ==========================================================
  // CREATE USER
  // OWNER ONLY
  // ==========================================================

  @Post()
  @RequirePermissions(AppPermission.SETTINGS)
  create(
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.createManagedUser(dto);
  }

  // ==========================================================
  // UPDATE USER
  // OWNER ONLY
  // ==========================================================

  @Patch(':id')
  @RequirePermissions(AppPermission.SETTINGS)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(
      id,
      dto,
    );
  }

  // ==========================================================
  // DEACTIVATE
  // OWNER ONLY
  // ==========================================================

  @Patch(':id/deactivate')
  @RequirePermissions(AppPermission.SETTINGS)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.deactivate(id);
  }

  // ACTIVATE
  // OWNER ONLY
 
  @Patch(':id/activate')
  @RequirePermissions(AppPermission.SETTINGS)
  activate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.activate(id);
  }
}