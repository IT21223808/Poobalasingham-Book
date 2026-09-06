import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

import { Location } from '../inventory/entities/location.entity';
import { Till } from '../tills/entities/till.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Location,
      Till,
    ]),
  ],

  controllers: [
    UsersController,
  ],

  providers: [
    UsersService,
  ],

  exports: [
    UsersService,
    TypeOrmModule,
  ],
})
export class UsersModule {}