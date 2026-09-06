import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TillsService } from './tills.service';
import { CreateTillDto } from './dto/create-till.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('tills')
@UseGuards(JwtAuthGuard)
export class TillsController {
  constructor(
    private readonly tillsService: TillsService,
  ) {}

  @Post()
  create(@Body() dto: CreateTillDto) {
    return this.tillsService.create(dto);
  }

  @Get()
  findAll() {
    return this.tillsService.findAll();
  }

  @Get('by-location')
  findByLocation(
    @Query('locationId') locationId: string,
  ) {
    return this.tillsService.findByLocation(locationId);
  }

  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tillsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateTillDto>,
  ) {
    return this.tillsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tillsService.deactivate(id);
  }
}