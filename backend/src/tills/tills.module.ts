import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TillsController } from './tills.controller';
import { TillsService } from './tills.service';
import { Till } from './entities/till.entity';
import { Location } from '../inventory/entities/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Till,
      Location,
    ]),
  ],
  controllers: [TillsController],
  providers: [TillsService],
  exports: [TillsService],
})
export class TillsModule {}