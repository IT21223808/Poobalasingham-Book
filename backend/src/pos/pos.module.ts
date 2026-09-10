import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PosController } from './pos.controller';
import { PosService } from './pos.service';

import { PosSale } from './entities/pos-sale.entity';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { PosPayment } from './entities/pos-payment.entity';
import { PosHeldBill } from './entities/pos-held-bill.entity';
import { PosReturn } from './entities/pos-return.entity';
import { PosReturnItem } from './entities/pos-return-item.entity';
import { PosOpeningBalance } from './entities/pos-opening-balance.entity';

import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Location } from '../inventory/entities/location.entity';
import { Till } from '../tills/entities/till.entity';

import { MailModule } from '../mail/mail.module';
import { PosCashClosing } from './entities/pos-cash-closing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PosSale,
      PosSaleItem,
      PosPayment,
      PosHeldBill,
      PosReturn,
      PosReturnItem,
      PosOpeningBalance,
      PosCashClosing,
      Product,
      Customer,
      Location,
      Till,
    ]),
    MailModule,
  ],

  controllers: [PosController],

  providers: [PosService],

  exports: [PosService],
})
export class PosModule {}