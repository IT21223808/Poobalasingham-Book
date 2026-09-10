import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource,EntityManager,IsNull,Repository,} from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';

import { PosSale,SaleStatus,} from './entities/pos-sale.entity';

import { PosSaleItem } from './entities/pos-sale-item.entity';
import { PosPayment } from './entities/pos-payment.entity';
import { PosHeldBill } from './entities/pos-held-bill.entity';
import { PosReturn } from './entities/pos-return.entity';
import { PosReturnItem } from './entities/pos-return-item.entity';

import { Product } from '../products/entities/product.entity';
import { Location } from '../inventory/entities/location.entity';
import { Till } from '../tills/entities/till.entity';

import { CreatePosSaleDto } from './dto/create-pos-sale.dto';
import { HoldBillDto } from './dto/hold-bill.dto';
import { ReturnSaleDto } from './dto/return-sale.dto';

import { UserRole } from '../users/user-role.enum';
import { MailService } from '../mail/mail.service';

import { PosOpeningBalance } from './entities/pos-opening-balance.entity';

import {
  FinancePaymentMethod,
  FinanceTransaction,
  TransactionType,
} from '../finance/entities/finance-transaction.entity';

import { PosCashClosing } from './entities/pos-cash-closing.entity';
import { CloseCashDto } from './dto/close-cash.dto';

/* AUTHENTICATED USER */

export interface PosAuthenticatedUser {
  id: number;
  email?: string;
  role: UserRole | string;
  locationId?: string | null;
  tillId?: number | null;
}

/*  SALES QUERY */

export interface PosSalesQuery {
  search?: string;
  limit?: number;
}

/* =========================================================
   SERVICE
========================================================= */

@Injectable()
export class PosService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(PosSale)
    private readonly saleRepository: Repository<PosSale>,

    @InjectRepository(PosSaleItem)
    private readonly saleItemRepository: Repository<PosSaleItem>,

    @InjectRepository(PosPayment)
    private readonly paymentRepository: Repository<PosPayment>,

    @InjectRepository(PosHeldBill)
    private readonly heldBillRepository: Repository<PosHeldBill>,

    @InjectRepository(PosReturn)
    private readonly returnRepository: Repository<PosReturn>,

    @InjectRepository(PosReturnItem)
    private readonly returnItemRepository: Repository<PosReturnItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(Till)
    private readonly tillRepository: Repository<Till>,

    @InjectRepository(PosOpeningBalance)
    private readonly openingBalanceRepository: Repository<PosOpeningBalance>,

    @InjectRepository(PosCashClosing)
    private readonly cashClosingRepository: Repository<PosCashClosing>,

    private readonly mailService: MailService,
  ) {}

  /* =========================================================
     ROLE HELPERS
  ========================================================= */

  private normalizeRole(
    role?: string | UserRole,
  ): UserRole {
    if (role === UserRole.ADMIN) {
      return UserRole.OWNER;
    }

    if (role === UserRole.STAFF) {
      return UserRole.CASHIER;
    }

    return role as UserRole;
  }

  /* =========================================================
     BUSINESS DATE
  ========================================================= */

  private getBusinessDate(
    date?: Date,
  ): string {
    const value = date ?? new Date();

    return `${value.getFullYear()}-${String(
      value.getMonth() + 1,
    ).padStart(2, '0')}-${String(
      value.getDate(),
    ).padStart(2, '0')}`;
  }

  /* =========================================================
     DATE VALIDATION
  ========================================================= */

  private validateBusinessDate(
    businessDate: string,
  ): string {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        businessDate,
      )
    ) {
      throw new BadRequestException(
        'Invalid business date.',
      );
    }

    const [
      year,
      month,
      day,
    ] = businessDate
      .split('-')
      .map(Number);

    const date = new Date(
      year,
      month - 1,
      day,
    );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new BadRequestException(
        'Invalid business date.',
      );
    }

    return businessDate;
  }

  /* =========================================================
     LOCAL DAY RANGE
  ========================================================= */

  private getBusinessDateRange(
    businessDate: string,
  ): {
    startOfDay: Date;
    endOfDay: Date;
  } {
    this.validateBusinessDate(
      businessDate,
    );

    const [
      year,
      month,
      day,
    ] = businessDate
      .split('-')
      .map(Number);

    const startOfDay = new Date(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0,
    );

    const endOfDay = new Date(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999,
    );

    return {
      startOfDay,
      endOfDay,
    };
  }

  /* =========================================================
     USER VALIDATION
  ========================================================= */

  private validateUserScope(
    user: PosAuthenticatedUser,
  ): void {
    if (!user) {
      throw new ForbiddenException(
        'Authenticated user is required.',
      );
    }

    const role =
      this.normalizeRole(user.role);

    if (
      role === UserRole.OWNER ||
      role === UserRole.MANAGER ||
      role === UserRole.CASHIER
    ) {
      if (!user.locationId) {
        throw new ForbiddenException(
          'User is not assigned to a branch.',
        );
      }
    } else {
      throw new ForbiddenException(
        'User role is not allowed to use POS.',
      );
    }

    if (
      role === UserRole.CASHIER &&
      (
        user.tillId === null ||
        user.tillId === undefined
      )
    ) {
      throw new ForbiddenException(
        'Cashier is not assigned to a till.',
      );
    }
  }

  /* =========================================================
     LOCATION VALIDATION
  ========================================================= */

  private async validateLocation(
    locationId:
      | string
      | null
      | undefined,
    manager?: EntityManager,
  ): Promise<Location | null> {
    if (!locationId) {
      return null;
    }

    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;

    const location =
      await repo.findOne({
        where: {
          id: locationId,
          isActive: true,
        },
      });

    if (!location) {
      throw new BadRequestException(
        'Branch does not exist or is inactive.',
      );
    }

    return location;
  }

  /* =========================================================
     TILL VALIDATION
  ========================================================= */

  private async validateTill(
    tillId:
      | number
      | null
      | undefined,
    locationId:
      | string
      | null
      | undefined,
    manager?: EntityManager,
  ): Promise<Till | null> {
    if (
      tillId === null ||
      tillId === undefined
    ) {
      return null;
    }

    const repo = manager
      ? manager.getRepository(Till)
      : this.tillRepository;

    const till =
      await repo.findOne({
        where: {
          id: tillId,
          isActive: true,
        },
      });

    if (!till) {
      throw new BadRequestException(
        'Till does not exist or is inactive.',
      );
    }

    if (
      locationId &&
      till.locationId !== locationId
    ) {
      throw new ForbiddenException(
        'Till does not belong to the selected branch.',
      );
    }

    return till;
  }

  /* =========================================================
     RESOLVE POS SCOPE
  ========================================================= */

  private async resolvePosScope(
    user: PosAuthenticatedUser,
  ): Promise<{
    locationId: string;
    tillId: number | null;
  }> {
    this.validateUserScope(user);

    if (!user.locationId) {
      throw new ForbiddenException(
        'User is not assigned to a branch.',
      );
    }

    await this.validateLocation(
      user.locationId,
    );

    const role =
      this.normalizeRole(user.role);

    if (
      role === UserRole.OWNER ||
      role === UserRole.MANAGER
    ) {
      return {
        locationId: user.locationId,
        tillId: null,
      };
    }

    if (role === UserRole.CASHIER) {
      if (
        user.tillId === null ||
        user.tillId === undefined
      ) {
        throw new ForbiddenException(
          'Cashier is not assigned to a till.',
        );
      }

      await this.validateTill(
        user.tillId,
        user.locationId,
      );

      return {
        locationId: user.locationId,
        tillId: user.tillId,
      };
    }

    throw new ForbiddenException(
      'User role is not allowed to use POS.',
    );
  }

  /* =========================================================
     RESOLVE SALE SCOPE
  ========================================================= */

  private async resolveSaleScope(
    _dtoLocationId:
      | string
      | undefined,
    user: PosAuthenticatedUser,
  ): Promise<{
    locationId: string | null;
    tillId: number | null;
  }> {
    return this.resolvePosScope(user);
  }

  /* =========================================================
     SALE SCOPE
  ========================================================= */

  private applySaleScope(
    qb: any,
    user: PosAuthenticatedUser,
    alias = 'sale',
  ): void {
    this.validateUserScope(user);

    const role =
      this.normalizeRole(user.role);

    if (!user.locationId) {
      throw new ForbiddenException(
        'User is not assigned to a branch.',
      );
    }

    qb.andWhere(
      `${alias}.locationId = :scopeLocationId`,
      {
        scopeLocationId:
          user.locationId,
      },
    );

    if (role === UserRole.CASHIER) {
      if (
        user.tillId === null ||
        user.tillId === undefined
      ) {
        throw new ForbiddenException(
          'Cashier is not assigned to a till.',
        );
      }

      qb.andWhere(
        `${alias}.tillId = :scopeTillId`,
        {
          scopeTillId:
            user.tillId,
        },
      );
    }
  }

  /* =========================================================
     HELD BILL SCOPE
  ========================================================= */

  private applyHeldBillScope(
    qb: any,
    user: PosAuthenticatedUser,
    alias = 'held',
  ): void {
    this.validateUserScope(user);

    const role =
      this.normalizeRole(user.role);

    if (!user.locationId) {
      throw new ForbiddenException(
        'User is not assigned to a branch.',
      );
    }

    qb.andWhere(
      `${alias}.locationId = :heldLocationId`,
      {
        heldLocationId:
          user.locationId,
      },
    );

    if (role === UserRole.CASHIER) {
      if (
        user.tillId === null ||
        user.tillId === undefined
      ) {
        throw new ForbiddenException(
          'Cashier is not assigned to a till.',
        );
      }

      qb.andWhere(
        `${alias}.tillId = :heldTillId`,
        {
          heldTillId:
            user.tillId,
        },
      );
    }
  }

  /* =========================================================
     OPENING BALANCE WHERE
  ========================================================= */

  private buildOpeningBalanceWhere(
    locationId: string,
    tillId: number | null,
    businessDate: string,
  ) {
    if (tillId !== null) {
      return {
        locationId,
        tillId,
        businessDate,
      };
    }

    return {
      locationId,
      tillId: IsNull(),
      businessDate,
    };
  }

  /* =========================================================
     CASH CLOSING WHERE
  ========================================================= */

  private buildCashClosingWhere(
    locationId: string,
    tillId: number | null,
    businessDate: string,
  ) {
    if (tillId !== null) {
      return {
        locationId,
        tillId,
        businessDate,
      };
    }

    return {
      locationId,
      tillId: IsNull(),
      businessDate,
    };
  }

  /* =========================================================
     CHECK CASH CLOSING
  ========================================================= */

  private async ensureCashNotClosed(
    locationId: string,
    tillId: number | null,
    businessDate: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(PosCashClosing)
      : this.cashClosingRepository;

    const existing =
      await repo.findOne({
        where:
          this.buildCashClosingWhere(
            locationId,
            tillId,
            businessDate,
          ),
      });

    if (existing) {
      throw new BadRequestException(
        'Cash closing has already been completed for this branch/till for today.',
      );
    }
  }

  /* =========================================================
     INVOICE NUMBER
  ========================================================= */

  private async generateInvoiceNumber(
    manager: EntityManager,
  ): Promise<string> {
    const today =
      this.getBusinessDate()
        .replace(/-/g, '');

    const prefix =
      `INV-${today}-`;

    const lastSale =
      await manager
        .getRepository(PosSale)
        .createQueryBuilder('sale')
        .select(
          'sale.invoiceNumber',
          'invoiceNumber',
        )
        .where(
          'sale.invoiceNumber LIKE :prefix',
          {
            prefix: `${prefix}%`,
          },
        )
        .orderBy(
          'sale.invoiceNumber',
          'DESC',
        )
        .getOne();

    let sequence = 1;

    if (
      lastSale?.invoiceNumber
    ) {
      const match =
        lastSale.invoiceNumber.match(
          /-(\d+)$/,
        );

      if (match) {
        sequence =
          Number(match[1]) + 1;
      }
    }

    return `${prefix}${String(
      sequence,
    ).padStart(4, '0')}`;
  }

  /* =========================================================
     HOLD NUMBER
  ========================================================= */

  private async generateHoldNumber(): Promise<string> {
    const today =
      this.getBusinessDate()
        .replace(/-/g, '');

    const prefix =
      `HOLD-${today}-`;

    const lastHold =
      await this.heldBillRepository
        .createQueryBuilder('held')
        .select(
          'held.holdNumber',
          'holdNumber',
        )
        .where(
          'held.holdNumber LIKE :prefix',
          {
            prefix: `${prefix}%`,
          },
        )
        .orderBy(
          'held.holdNumber',
          'DESC',
        )
        .getOne();

    let sequence = 1;

    if (
      lastHold?.holdNumber
    ) {
      const match =
        lastHold.holdNumber.match(
          /-(\d+)$/,
        );

      if (match) {
        sequence =
          Number(match[1]) + 1;
      }
    }

    return `${prefix}${String(
      sequence,
    ).padStart(4, '0')}`;
  }

  /* =========================================================
     RETURN NUMBER
  ========================================================= */

  private async generateReturnNumber(
    manager: EntityManager,
  ): Promise<string> {
    const today =
      this.getBusinessDate()
        .replace(/-/g, '');

    const prefix =
      `RET-${today}-`;

    const lastReturn =
      await manager
        .getRepository(PosReturn)
        .createQueryBuilder('ret')
        .select(
          'ret.returnNumber',
          'returnNumber',
        )
        .where(
          'ret.returnNumber LIKE :prefix',
          {
            prefix: `${prefix}%`,
          },
        )
        .orderBy(
          'ret.returnNumber',
          'DESC',
        )
        .getOne();

    let sequence = 1;

    if (
      lastReturn?.returnNumber
    ) {
      const match =
        lastReturn.returnNumber.match(
          /-(\d+)$/,
        );

      if (match) {
        sequence =
          Number(match[1]) + 1;
      }
    }

    return `${prefix}${String(
      sequence,
    ).padStart(4, '0')}`;
  }

  /* =========================================================
     FINANCE NUMBER
  ========================================================= */

  private async generateFinanceTransactionNumber(
    manager: EntityManager,
  ): Promise<string> {
    const today =
      this.getBusinessDate()
        .replace(/-/g, '');

    const prefix =
      `FIN-${today}-`;

    const lastTransaction =
      await manager
        .getRepository(
          FinanceTransaction,
        )
        .createQueryBuilder(
          'transaction',
        )
        .select(
          'transaction.transactionNumber',
          'transactionNumber',
        )
        .where(
          'transaction.transactionNumber LIKE :prefix',
          {
            prefix: `${prefix}%`,
          },
        )
        .orderBy(
          'transaction.transactionNumber',
          'DESC',
        )
        .getOne();

    let sequence = 1;

    if (
      lastTransaction?.transactionNumber
    ) {
      const match =
        lastTransaction.transactionNumber.match(
          /-(\d+)$/,
        );

      if (match) {
        sequence =
          Number(match[1]) + 1;
      }
    }

    return `${prefix}${String(
      sequence,
    ).padStart(4, '0')}`;
  }

  /* =========================================================
     FIND SALE BY CLIENT SALE ID
  ========================================================= */

  private async findSaleByClientSaleId(
    clientSaleId:
      | string
      | undefined,
    user?: PosAuthenticatedUser,
  ): Promise<PosSale | null> {
    if (!clientSaleId) {
      return null;
    }

    const qb =
      this.saleRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect(
          'sale.items',
          'items',
        )
        .leftJoinAndSelect(
          'sale.payments',
          'payments',
        )
        .leftJoinAndSelect(
          'sale.location',
          'location',
        )
        .leftJoinAndSelect(
          'sale.till',
          'till',
        )
        .where(
          'sale.clientSaleId = :clientSaleId',
          {
            clientSaleId,
          },
        );

    if (user) {
      this.applySaleScope(
        qb,
        user,
      );
    }

    return qb.getOne();
  }

  /* =========================================================
     CREATE SALE
  ========================================================= */

  async createSale(
    dto: CreatePosSaleDto,
    user: PosAuthenticatedUser,
  ): Promise<PosSale> {
    this.validateUserScope(user);

    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'Sale must contain at least one item.',
      );
    }

    if (
      !dto.payments ||
      dto.payments.length === 0
    ) {
      throw new BadRequestException(
        'At least one payment method is required.',
      );
    }

    /* =====================================================
       PAYMENT VALIDATION
    ===================================================== */

    const totalPayment =
      dto.payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0,
          ),
        0,
      );

    const grandTotal =
      Number(
        dto.grandTotal || 0,
      );

    if (
      !Number.isFinite(
        grandTotal,
      ) ||
      grandTotal < 0
    ) {
      throw new BadRequestException(
        'Grand total must be a valid amount.',
      );
    }

    if (
      Math.abs(
        totalPayment -
          grandTotal,
      ) > 0.01
    ) {
      throw new BadRequestException(
        `Payment total (${totalPayment.toFixed(
          2,
        )}) does not match grand total (${grandTotal.toFixed(
          2,
        )}).`,
      );
    }

    /* =====================================================
       SERVER SIDE SCOPE
    ===================================================== */

    const scope =
      await this.resolveSaleScope(
        dto.locationId,
        user,
      );

    if (!scope.locationId) {
      throw new ForbiddenException(
        'POS sale requires a branch/location.',
      );
    }

    const businessDate =
      this.getBusinessDate();

    /* =====================================================
       OPENING BALANCE REQUIRED
    ===================================================== */

    await this.ensureOpeningBalanceExists(
      scope.locationId,
      scope.tillId,
      user,
    );

    /* =====================================================
       CASH CLOSING CHECK
    ===================================================== */

    await this.ensureCashNotClosed(
      scope.locationId,
      scope.tillId,
      businessDate,
    );

    /* =====================================================
       IDEMPOTENCY
    ===================================================== */

    if (dto.clientSaleId) {
      const existing =
        await this.findSaleByClientSaleId(
          dto.clientSaleId,
          user,
        );

      if (existing) {
        return existing;
      }
    }

    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager =
        queryRunner.manager;

      /* ===================================================
         SECOND IDEMPOTENCY CHECK
      =================================================== */

      if (dto.clientSaleId) {
        const existing =
          await this.findSaleByClientSaleId(
            dto.clientSaleId,
            user,
          );

        if (existing) {
          await queryRunner.rollbackTransaction();
          return existing;
        }
      }

      /* ===================================================
         LOCK OPENING BALANCE
      =================================================== */

      const opening =
        await manager
          .getRepository(
            PosOpeningBalance,
          )
          .createQueryBuilder(
            'opening',
          )
          .setLock(
            'pessimistic_write',
          )
          .where(
            'opening.locationId = :locationId',
            {
              locationId:
                scope.locationId,
            },
          )
          .andWhere(
            scope.tillId !== null
              ? 'opening.tillId = :tillId'
              : 'opening.tillId IS NULL',
            scope.tillId !== null
              ? {
                  tillId:
                    scope.tillId,
                }
              : {},
          )
          .andWhere(
            'opening.businessDate = :businessDate',
            {
              businessDate,
            },
          )
          .getOne();

      if (!opening) {
        throw new BadRequestException(
          'Opening balance has not been set for this POS. Please enter the opening balance before starting billing.',
        );
      }

      /* ===================================================
         LOCK CASH CLOSING
      =================================================== */

      const existingClosing =
        await manager
          .getRepository(
            PosCashClosing,
          )
          .createQueryBuilder(
            'closing',
          )
          .setLock(
            'pessimistic_write',
          )
          .where(
            'closing.locationId = :locationId',
            {
              locationId:
                scope.locationId,
            },
          )
          .andWhere(
            scope.tillId !== null
              ? 'closing.tillId = :tillId'
              : 'closing.tillId IS NULL',
            scope.tillId !== null
              ? {
                  tillId:
                    scope.tillId,
                }
              : {},
          )
          .andWhere(
            'closing.businessDate = :businessDate',
            {
              businessDate,
            },
          )
          .getOne();

      if (existingClosing) {
        throw new BadRequestException(
          'Cash closing has already been completed for this POS.',
        );
      }

      /* ===================================================
         AGGREGATE QUANTITIES
      =================================================== */

      const quantities =
        new Map<string, number>();

      for (
        const item of dto.items
      ) {
        const quantity =
          Number(
            item.quantity,
          );

        if (
          !Number.isFinite(
            quantity,
          ) ||
          quantity <= 0
        ) {
          throw new BadRequestException(
            'Product quantity must be greater than zero.',
          );
        }

        const current =
          quantities.get(
            item.productId,
          ) || 0;

        quantities.set(
          item.productId,
          current + quantity,
        );
      }

      /* ===================================================
         LOCK PRODUCTS
      =================================================== */

      const products =
        new Map<
          string,
          Product
        >();

      for (
        const [
          productId,
          quantity,
        ] of quantities
      ) {
        const product =
          await manager
            .getRepository(Product)
            .createQueryBuilder(
              'product',
            )
            .setLock(
              'pessimistic_write',
            )
            .where(
              'product.id = :productId',
              {
                productId,
              },
            )
            .getOne();

        if (!product) {
          throw new NotFoundException(
            `Product "${productId}" not found.`,
          );
        }

        if (
          Number(
            product.stockQuantity,
          ) < quantity
        ) {
          throw new BadRequestException(
            `Insufficient stock for "${product.productName}". Available: ${product.stockQuantity}, Requested: ${quantity}`,
          );
        }

        products.set(
          productId,
          product,
        );
      }

      /* ===================================================
         INVOICE NUMBER
      =================================================== */

      const invoiceNumber =
        await this.generateInvoiceNumber(
          manager,
        );

      /* ===================================================
         CREATE SALE
      =================================================== */

      const sale =
        manager
          .getRepository(PosSale)
          .create({
            clientSaleId:
              dto.clientSaleId ??
              null,

            invoiceNumber,

            subtotal:
              Number(
                dto.subtotal || 0,
              ),

            discountAmount:
              Number(
                dto.discountAmount || 0,
              ),

            grandTotal,

            status:
              SaleStatus.COMPLETED,

            customerId:
              dto.customerId ??
              null,

            customerName:
              dto.customerName ??
              null,

            cashierId:
              String(user.id),

            notes:
              dto.notes ??
              null,

            locationId:
              scope.locationId,

            tillId:
              scope.tillId,
          });

      const savedSale =
        await manager
          .getRepository(PosSale)
          .save(sale);

      /* ===================================================
         SALE ITEMS
      =================================================== */

      const saleItems:
        PosSaleItem[] = [];

      for (
        const itemDto of dto.items
      ) {
        const unitPrice =
          Number(
            itemDto.unitPrice,
          );

        const quantity =
          Number(
            itemDto.quantity,
          );

        const lineTotal =
          Number(
            itemDto.lineTotal,
          );

        if (
          !Number.isFinite(
            unitPrice,
          ) ||
          unitPrice < 0
        ) {
          throw new BadRequestException(
            'Invalid product unit price.',
          );
        }

        if (
          !Number.isFinite(
            lineTotal,
          ) ||
          lineTotal < 0
        ) {
          throw new BadRequestException(
            'Invalid product line total.',
          );
        }

        const saleItem =
          manager
            .getRepository(
              PosSaleItem,
            )
            .create({
              posSale:
                savedSale,

              productId:
                itemDto.productId,

              productCode:
                itemDto.productCode,

              productName:
                itemDto.productName,

              barcode:
                itemDto.barcode ??
                null,

              unitPrice,

              quantity,

              discountAmount:
                Number(
                  itemDto.discountAmount ||
                    0,
                ),

              lineTotal,
            });

        saleItems.push(
          saleItem,
        );
      }

      await manager
        .getRepository(
          PosSaleItem,
        )
        .save(saleItems);

      /* ===================================================
         PAYMENTS
      =================================================== */

      const salePayments:
        PosPayment[] = [];

      for (
        const payDto of dto.payments
      ) {
        const paymentAmount =
          Number(
            payDto.amount,
          );

        if (
          !Number.isFinite(
            paymentAmount,
          ) ||
          paymentAmount < 0
        ) {
          throw new BadRequestException(
            'Payment amount must be valid.',
          );
        }

        const payment =
          manager
            .getRepository(
              PosPayment,
            )
            .create({
              posSale:
                savedSale,

              paymentMethod:
                payDto.paymentMethod,

              amount:
                paymentAmount,

              amountReceived:
                payDto.amountReceived !=
                null
                  ? Number(
                      payDto.amountReceived,
                    )
                  : null,

              changeAmount:
                payDto.changeAmount !=
                null
                  ? Number(
                      payDto.changeAmount,
                    )
                  : null,

              referenceNumber:
                payDto.referenceNumber ??
                null,
            });

        salePayments.push(
          payment,
        );

       /*  FINANCE - POS SALE */

const paymentMethod =
  String(
    payDto.paymentMethod,
  ).toUpperCase();

let financePaymentMethod:
  | FinancePaymentMethod
  | null = null;

if (paymentMethod === 'CASH') {
  financePaymentMethod =
    FinancePaymentMethod.CASH;
} else if (
  paymentMethod === 'CARD' ||
  paymentMethod === 'QR'
) {
  financePaymentMethod =
    FinancePaymentMethod.BANK;
}

if (financePaymentMethod) {
  const transactionNumber =
    await this.generateFinanceTransactionNumber(
      manager,
    );

  const financeTransaction =
    manager
      .getRepository(
        FinanceTransaction,
      )
      .create({
        transactionNumber,

        transactionDate:
          businessDate,

        type:
          TransactionType.INCOME,

        paymentMethod:
          financePaymentMethod,

        category:
          'POS Sale',

        description:
          `POS Sale - ${savedSale.invoiceNumber}`,

        amount:
          paymentAmount,

        reference:
          savedSale.invoiceNumber,

        customerId:
          savedSale.customerId ??
          null,

        supplierId:
          null,

        purchaseInvoiceId:
          null,

        /* IMPORTANT */
        locationId:
          scope.locationId,

        tillId:
          scope.tillId,
      });

  await manager
    .getRepository(
      FinanceTransaction,
    )
    .save(
      financeTransaction,
    );
}
      }

      await manager
        .getRepository(
          PosPayment,
        )
        .save(salePayments);

      /* ===================================================
         REDUCE STOCK
      =================================================== */

      for (
        const [
          productId,
          quantity,
        ] of quantities
      ) {
        const product =
          products.get(
            productId,
          );

        if (!product) {
          continue;
        }

        product.stockQuantity =
          Math.max(
            0,
            Number(
              product.stockQuantity,
            ) -
              quantity,
          );

        await manager
          .getRepository(Product)
          .save(product);
      }

      /* ===================================================
         DELETE HELD BILL
      =================================================== */

      if (dto.heldBillId) {
        const heldQb =
          manager
            .getRepository(
              PosHeldBill,
            )
            .createQueryBuilder(
              'held',
            )
            .where(
              'held.id = :heldBillId',
              {
                heldBillId:
                  dto.heldBillId,
              },
            );

        this.applyHeldBillScope(
          heldQb,
          user,
        );

        const heldBill =
          await heldQb.getOne();

        if (heldBill) {
          await manager
            .getRepository(
              PosHeldBill,
            )
            .remove(
              heldBill,
            );
        }
      }

      await queryRunner.commitTransaction();

      savedSale.items =
        saleItems;

      savedSale.payments =
        salePayments;

      return savedSale;
    } catch (error: any) {
      if (
        queryRunner.isTransactionActive
      ) {
        await queryRunner.rollbackTransaction();
      }

      if (
        error?.code ===
          '23505' &&
        String(
          error?.detail ||
            error?.message ||
            '',
        ).includes(
          'client_sale_id',
        )
      ) {
        const existing =
          await this.findSaleByClientSaleId(
            dto.clientSaleId,
            user,
          );

        if (existing) {
          return existing;
        }
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* =========================================================
     GET SALES
  ========================================================= */

  async getSales(
    query?: PosSalesQuery,
    user?: PosAuthenticatedUser,
  ): Promise<PosSale[]> {
    if (!user) {
      throw new ForbiddenException(
        'Authenticated user is required.',
      );
    }

    const qb =
      this.saleRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect(
          'sale.items',
          'items',
        )
        .leftJoinAndSelect(
          'sale.payments',
          'payments',
        )
        .leftJoinAndSelect(
          'sale.location',
          'location',
        )
        .leftJoinAndSelect(
          'sale.till',
          'till',
        );

    this.applySaleScope(
      qb,
      user,
    );

    if (
      query?.search?.trim()
    ) {
      const search =
        `%${query.search.trim()}%`;

      qb.andWhere(
        `(
          sale.invoiceNumber ILIKE :search
          OR sale.customerName ILIKE :search
          OR sale.cashierId ILIKE :search
          OR location.name ILIKE :search
          OR till.name ILIKE :search
          OR till.code ILIKE :search
        )`,
        {
          search,
        },
      );
    }

    qb.orderBy(
      'sale.createdAt',
      'DESC',
    );

    if (
      query?.limit &&
      Number.isFinite(
        query.limit,
      )
    ) {
      qb.take(
        Math.min(
          Math.max(
            1,
            Math.floor(
              query.limit,
            ),
          ),
          500,
        ),
      );
    }

    return qb.getMany();
  }

  /* =========================================================
     GET SALE
  ========================================================= */

  async getSaleById(
    idOrInvoice: string,
    user: PosAuthenticatedUser,
  ): Promise<PosSale> {
    this.validateUserScope(user);

    const qb =
      this.saleRepository
        .createQueryBuilder('sale')
        .leftJoinAndSelect(
          'sale.items',
          'items',
        )
        .leftJoinAndSelect(
          'sale.payments',
          'payments',
        )
        .leftJoinAndSelect(
          'sale.location',
          'location',
        )
        .leftJoinAndSelect(
          'sale.till',
          'till',
        )
        .where(
          `(sale.id = :id OR sale.invoiceNumber = :invoice)`,
          {
            id: idOrInvoice,
            invoice:
              idOrInvoice,
          },
        );

    this.applySaleScope(
      qb,
      user,
    );

    const sale =
      await qb.getOne();

    if (!sale) {
      throw new NotFoundException(
        'Sale not found.',
      );
    }

    return sale;
  }

  /* =========================================================
     SEND EMAIL RECEIPT
  ========================================================= */

  async sendEmailReceipt(
    idOrInvoice: string,
    customerEmail: string,
    user: PosAuthenticatedUser,
  ) {
    if (
      !customerEmail ||
      !customerEmail.trim()
    ) {
      throw new BadRequestException(
        'Customer email is required.',
      );
    }

    const email =
      customerEmail.trim();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(email)
    ) {
      throw new BadRequestException(
        'Please provide a valid customer email address.',
      );
    }

    const sale =
      await this.getSaleById(
        idOrInvoice,
        user,
      );

    if (
      !sale.items ||
      sale.items.length === 0
    ) {
      throw new BadRequestException(
        'Sale does not contain any items.',
      );
    }

    const payments =
      (
        sale.payments || []
      ).map(
        (payment) => ({
          paymentMethod:
            String(
              payment.paymentMethod,
            ),

          amount:
            Number(
              payment.amount || 0,
            ),
        }),
      );

    const receiptData = {
      invoiceNumber:
        String(
          sale.invoiceNumber,
        ),

      customerName:
        sale.customerName ||
        'Valued Customer',

      items:
        sale.items.map(
          (item) => ({
            productName:
              String(
                item.productName ||
                  '',
              ),

            quantity:
              Number(
                item.quantity || 0,
              ),

            unitPrice:
              Number(
                item.unitPrice || 0,
              ),

            lineTotal:
              Number(
                item.lineTotal || 0,
              ),
          }),
        ),

      subtotal:
        Number(
          sale.subtotal || 0,
        ),

      discountAmount:
        Number(
          sale.discountAmount || 0,
        ),

      grandTotal:
        Number(
          sale.grandTotal || 0,
        ),

      payments,

      createdAt:
        new Date(
          sale.createdAt,
        ),
    };

    try {
      await this.mailService.sendReceiptEmail(
        email,
        receiptData,
      );
    } catch (error) {
      console.error(
        'POS receipt email failed:',
        error,
      );

      throw new BadRequestException(
        'Failed to send receipt email. Please check the email configuration.',
      );
    }

    return {
      success: true,

      message:
        'Receipt sent successfully.',

      email,

      invoiceNumber:
        sale.invoiceNumber,
    };
  }

  /* =========================================================
     HOLD BILL
  ========================================================= */

  async holdBill(
    dto: HoldBillDto,
    user: PosAuthenticatedUser,
  ): Promise<PosHeldBill> {
    this.validateUserScope(user);

    const scope =
      await this.resolvePosScope(
        user,
      );

    if (!scope.locationId) {
      throw new ForbiddenException(
        'Cannot hold bill without branch.',
      );
    }

    const businessDate =
      this.getBusinessDate();

    await this.ensureOpeningBalanceExists(
      scope.locationId,
      scope.tillId,
      user,
    );

    await this.ensureCashNotClosed(
      scope.locationId,
      scope.tillId,
      businessDate,
    );

    const holdNumber =
      await this.generateHoldNumber();

    const heldBill =
      this.heldBillRepository.create({
        holdNumber,

        customerId:
          dto.customerId ??
          null,

        customerName:
          dto.customerName ??
          null,

        cartData:
          dto.cartData,

        subtotal:
          Number(
            dto.subtotal || 0,
          ),

        discountAmount:
          Number(
            dto.discountAmount || 0,
          ),

        grandTotal:
          Number(
            dto.grandTotal || 0,
          ),

        cashierId:
          String(user.id),

        locationId:
          scope.locationId,

        tillId:
          scope.tillId,
      });

    return this.heldBillRepository.save(
      heldBill,
    );
  }

  /* =========================================================
     GET HELD BILLS
  ========================================================= */

  async getHeldBills(
    user: PosAuthenticatedUser,
  ): Promise<PosHeldBill[]> {
    const qb =
      this.heldBillRepository
        .createQueryBuilder('held')
        .leftJoinAndSelect(
          'held.location',
          'location',
        )
        .leftJoinAndSelect(
          'held.till',
          'till',
        );

    this.applyHeldBillScope(
      qb,
      user,
    );

    qb.orderBy(
      'held.createdAt',
      'DESC',
    );

    return qb.getMany();
  }

  /* =========================================================
     DELETE HELD BILL
  ========================================================= */

  async deleteHeldBill(
    id: string,
    user: PosAuthenticatedUser,
  ): Promise<{
    success: boolean;
  }> {
    const qb =
      this.heldBillRepository
        .createQueryBuilder('held')
        .where(
          'held.id = :id',
          { id },
        );

    this.applyHeldBillScope(
      qb,
      user,
    );

    const heldBill =
      await qb.getOne();

    if (!heldBill) {
      throw new NotFoundException(
        'Held bill not found.',
      );
    }

    await this.heldBillRepository.remove(
      heldBill,
    );

    return {
      success: true,
    };
  }

  /* =========================================================
     CREATE RETURN
  ========================================================= */

  async createReturn(
    dto: ReturnSaleDto,
    user: PosAuthenticatedUser,
  ): Promise<PosReturn> {
    this.validateUserScope(user);

    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'Return must contain at least one item.',
      );
    }

    const scope =
      await this.resolvePosScope(
        user,
      );

    const businessDate =
      this.getBusinessDate();

    await this.ensureCashNotClosed(
      scope.locationId,
      scope.tillId,
      businessDate,
    );

    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager =
        queryRunner.manager;

      /* ===================================================
         FIND SALE WITH SCOPE
      =================================================== */

      const saleQb =
        manager
          .getRepository(PosSale)
          .createQueryBuilder(
            'sale',
          )
          .leftJoinAndSelect(
            'sale.items',
            'items',
          )
          .where(
            'sale.id = :saleId',
            {
              saleId:
                dto.saleId,
            },
          );

      this.applySaleScope(
        saleQb,
        user,
        'sale',
      );

      const sale =
        await saleQb
          .setLock(
            'pessimistic_write',
          )
          .getOne();

      if (!sale) {
        throw new NotFoundException(
          'Sale not found.',
        );
      }

      if (
        sale.status ===
        SaleStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled sale cannot be returned.',
        );
      }

      /* ===================================================
         EXISTING RETURNS
      =================================================== */

      const existingReturns =
        await manager
          .getRepository(
            PosReturn,
          )
          .find({
            where: {
              posSaleId:
                sale.id,
            },

            relations: {
              items: true,
            },
          });

      const returnedQtyMap:
        Record<
          string,
          number
        > = {};

      for (
        const ret of existingReturns
      ) {
        for (
          const item of
            ret.items || []
        ) {
          returnedQtyMap[
            item.productId
          ] =
            (
              returnedQtyMap[
                item.productId
              ] || 0
            ) +
            Number(
              item.quantity,
            );
        }
      }

      let totalReturnAmount =
        0;

      const returnItems:
        PosReturnItem[] = [];

      /* ===================================================
         PROCESS RETURN ITEMS
      =================================================== */

      for (
        const retItemDto of dto.items
      ) {
        const originalItem =
          sale.items.find(
            (item) =>
              item.productId ===
              retItemDto.productId,
          );

        if (!originalItem) {
          throw new BadRequestException(
            `Product "${retItemDto.productId}" was not part of this sale.`,
          );
        }

        const alreadyReturned =
          returnedQtyMap[
            retItemDto.productId
          ] || 0;

        const remaining =
          Number(
            originalItem.quantity,
          ) -
          alreadyReturned;

        const requestedQuantity =
          Number(
            retItemDto.quantity,
          );

        if (
          !Number.isFinite(
            requestedQuantity,
          ) ||
          requestedQuantity <= 0
        ) {
          throw new BadRequestException(
            'Return quantity must be greater than zero.',
          );
        }

        if (
          requestedQuantity >
          remaining
        ) {
          throw new BadRequestException(
            `Cannot return ${requestedQuantity} unit(s). Maximum returnable quantity is ${remaining}.`,
          );
        }

        const refundPrice =
          Number(
            retItemDto.refundUnitPrice,
          );

        if (
          !Number.isFinite(
            refundPrice,
          ) ||
          refundPrice < 0
        ) {
          throw new BadRequestException(
            'Refund unit price must be a valid non-negative amount.',
          );
        }

        const lineTotal =
          Number(
            (
              refundPrice *
              requestedQuantity
            ).toFixed(2),
          );

        totalReturnAmount +=
          lineTotal;

        const returnItem =
          manager
            .getRepository(
              PosReturnItem,
            )
            .create({
              productId:
                retItemDto.productId,

              productName:
                originalItem.productName,

              quantity:
                requestedQuantity,

              refundUnitPrice:
                refundPrice,

              lineTotal,
            });

        returnItems.push(
          returnItem,
        );

        /* ===============================================
           RESTORE STOCK
        =============================================== */

        const product =
          await manager
            .getRepository(Product)
            .createQueryBuilder(
              'product',
            )
            .setLock(
              'pessimistic_write',
            )
            .where(
              'product.id = :productId',
              {
                productId:
                  retItemDto.productId,
              },
            )
            .getOne();

        if (!product) {
          throw new NotFoundException(
            `Product "${retItemDto.productId}" not found.`,
          );
        }

        product.stockQuantity =
          Number(
            product.stockQuantity,
          ) +
          requestedQuantity;

        await manager
          .getRepository(Product)
          .save(product);
      }

      totalReturnAmount =
        Number(
          totalReturnAmount.toFixed(2),
        );

      /* ===================================================
         RETURN NUMBER
      =================================================== */

      const returnNumber =
        await this.generateReturnNumber(
          manager,
        );

      /* ===================================================
         CREATE RETURN
      =================================================== */

      const posReturn =
        manager
          .getRepository(
            PosReturn,
          )
          .create({
            returnNumber,

            posSaleId:
              sale.id,

            invoiceNumber:
              sale.invoiceNumber,

            customerId:
              sale.customerId ??
              null,

            cashierId:
              String(user.id),

            totalReturnAmount,

            reason:
              dto.reason,

            items:
              returnItems,

               locationId:
        scope.locationId,

      tillId:
        scope.tillId,
          });

      const savedReturn =
        await manager
          .getRepository(
            PosReturn,
          )
          .save(
            posReturn,
          );

      /* ===================================================
         SALE STATUS
      =================================================== */

      let originalQuantity =
        0;

      let returnedQuantity =
        0;

      for (
        const item of sale.items
      ) {
        originalQuantity +=
          Number(
            item.quantity,
          );

        returnedQuantity +=
          (
            returnedQtyMap[
              item.productId
            ] || 0
          ) +
          Number(
            dto.items.find(
              (r) =>
                r.productId ===
                item.productId,
            )?.quantity || 0,
          );
      }

      if (
        returnedQuantity >=
        originalQuantity
      ) {
        sale.status =
          SaleStatus.RETURNED;
      } else {
        sale.status =
          SaleStatus.PARTIALLY_RETURNED;
      }

      await manager
        .getRepository(PosSale)
        .save(sale);

      /* ===================================================
         REFUND -> CASH BOOK
         
         Current system treats POS refund
         as cash refund.
      =================================================== */

      if (
        totalReturnAmount > 0
      ) {
        const transactionNumber =
          await this.generateFinanceTransactionNumber(
            manager,
          );

        const refundTransaction =
          manager
            .getRepository(
              FinanceTransaction,
            )
            .create({
              transactionNumber,

              transactionDate:
                businessDate,

              type:
                TransactionType.EXPENSE,

              paymentMethod:
                FinancePaymentMethod.CASH,

              category:
                'POS Return',

              description:
                `POS Return - ${sale.invoiceNumber}`,

              amount:
                totalReturnAmount,

              reference:
                returnNumber,

              customerId:
                sale.customerId ??
                null,

              supplierId:
                null,

              purchaseInvoiceId:
                null,

                 locationId:
        scope.locationId,

      tillId:
        scope.tillId,
            });

        await manager
          .getRepository(
            FinanceTransaction,
          )
          .save(
            refundTransaction,
          );
      }

      await queryRunner.commitTransaction();

      return savedReturn;
    } catch (error) {
      if (
        queryRunner.isTransactionActive
      ) {
        await queryRunner.rollbackTransaction();
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* =========================================================
     OPENING BALANCE SCOPE
  ========================================================= */

  private async resolveOpeningBalanceScope(
    user: PosAuthenticatedUser,
  ): Promise<{
    locationId: string;
    tillId: number | null;
  }> {
    return this.resolvePosScope(
      user,
    );
  }

  /* =========================================================
     GET OPENING BALANCE
  ========================================================= */

  async getOpeningBalance(
    user: PosAuthenticatedUser,
    businessDate?: string,
  ) {
    const scope =
      await this.resolveOpeningBalanceScope(
        user,
      );

    const targetDate =
      this.validateBusinessDate(
        businessDate ||
          this.getBusinessDate(),
      );

    const where =
      this.buildOpeningBalanceWhere(
        scope.locationId,
        scope.tillId,
        targetDate,
      );

    const record =
      await this.openingBalanceRepository.findOne(
        {
          where,

          relations: {
            location: true,
            till: true,
          },
        },
      );

    if (!record) {
      return null;
    }

    return {
      id:
        record.id,

      locationId:
        record.locationId,

      tillId:
        record.tillId,

      openingBalance:
        Number(
          record.openingBalance || 0,
        ),

      businessDate:
        record.businessDate,

      createdBy:
        record.createdBy,

      createdAt:
        record.createdAt,

      location:
        record.location
          ? {
              id:
                record.location.id,

              name:
                record.location.name,
            }
          : null,

      till:
        record.till
          ? {
              id:
                record.till.id,

              name:
                record.till.name,

              code:
                record.till.code,
            }
          : null,
    };
  }

  /* =========================================================
     SAVE OPENING BALANCE
  ========================================================= */

  async saveOpeningBalance(
    user: PosAuthenticatedUser,
    openingBalance: number,
    businessDate?: string,
  ) {
    const scope =
      await this.resolveOpeningBalanceScope(
        user,
      );

    const amount =
      Number(
        openingBalance,
      );

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      throw new BadRequestException(
        'Opening balance must be a valid non-negative amount.',
      );
    }

    const targetDate =
      this.validateBusinessDate(
        businessDate ||
          this.getBusinessDate(),
      );

    /* =====================================================
       DO NOT ALLOW OPENING AFTER CLOSING
    ===================================================== */

    const closing =
      await this.cashClosingRepository.findOne({
        where:
          this.buildCashClosingWhere(
            scope.locationId,
            scope.tillId,
            targetDate,
          ),
      });

    if (closing) {
      throw new BadRequestException(
        'Cash closing has already been completed for this business date. Opening balance cannot be changed.',
      );
    }

    const where =
      this.buildOpeningBalanceWhere(
        scope.locationId,
        scope.tillId,
        targetDate,
      );

    const existing =
      await this.openingBalanceRepository.findOne(
        {
          where,
        },
      );

    if (existing) {
      throw new BadRequestException(
        'Opening balance already exists for this branch/till for this business date.',
      );
    }

    const record =
      this.openingBalanceRepository.create({
        locationId:
          scope.locationId,

        tillId:
          scope.tillId,

        openingBalance:
          amount,

        businessDate:
          targetDate,

        createdBy:
          Number(user.id),
      });

    const saved =
      await this.openingBalanceRepository.save(
        record,
      );

    return {
      id:
        saved.id,

      locationId:
        saved.locationId,

      tillId:
        saved.tillId,

      openingBalance:
        Number(
          saved.openingBalance || 0,
        ),

      businessDate:
        saved.businessDate,

      createdBy:
        saved.createdBy,

      createdAt:
        saved.createdAt,
    };
  }

  /*   ENSURE OPENING BALANCE EXISTS */

  private async ensureOpeningBalanceExists(
    locationId: string,
    tillId: number | null,
    user: PosAuthenticatedUser,
  ): Promise<void> {
    this.validateUserScope(user);

    if (
      !user.locationId ||
      user.locationId !== locationId
    ) {
      throw new ForbiddenException(
        'Invalid POS branch scope.',
      );
    }

    const role =
      this.normalizeRole(user.role);

    if (
      role === UserRole.CASHIER &&
      user.tillId !== tillId
    ) {
      throw new ForbiddenException(
        'Invalid POS till scope.',
      );
    }

    const businessDate =
      this.getBusinessDate();

    const where =
      this.buildOpeningBalanceWhere(
        locationId,
        tillId,
        businessDate,
      );

    const record =
      await this.openingBalanceRepository.findOne(
        {
          where,
        },
      );

    if (!record) {
      throw new BadRequestException(
        'Opening balance has not been set for this POS. Please enter the opening balance before starting billing.',
      );
    }
  }

  /* CASH CLOSING SUMMARY */

  async getCashClosingSummary(
    dateStr:
      | string
      | undefined,
    user: PosAuthenticatedUser,
  ) {
    this.validateUserScope(user);

    const scope =
      await this.resolveOpeningBalanceScope(
        user,
      );

    const businessDate =
      this.validateBusinessDate(
        dateStr ||
          this.getBusinessDate(),
      );

    const {
      startOfDay,
      endOfDay,
    } =
      this.getBusinessDateRange(
        businessDate,
      );

    /* OPENING CASH */

    const openingWhere =
      this.buildOpeningBalanceWhere(
        scope.locationId,
        scope.tillId,
        businessDate,
      );

    const opening =
      await this.openingBalanceRepository.findOne(
        {
          where:
            openingWhere,
        },
      );

    const openingCash =
      Number(
        opening?.openingBalance || 0,
      );

    /* =====================================================
       SALES
    ===================================================== */

    const salesQb =
      this.saleRepository
        .createQueryBuilder(
          'sale',
        )
        .leftJoinAndSelect(
          'sale.payments',
          'payments',
        )
        .where(
          'sale.createdAt BETWEEN :start AND :end',
          {
            start:
              startOfDay,

            end:
              endOfDay,
          },
        )
        .andWhere(
          'sale.status != :cancelled',
          {
            cancelled:
              SaleStatus.CANCELLED,
          },
        );

    this.applySaleScope(
      salesQb,
      user,
      'sale',
    );

    salesQb.andWhere(
      'sale.locationId = :closingLocationId',
      {
        closingLocationId:
          scope.locationId,
      },
    );

    if (
      scope.tillId !== null
    ) {
      salesQb.andWhere(
        'sale.tillId = :closingTillId',
        {
          closingTillId:
            scope.tillId,
        },
      );
    } else {
      salesQb.andWhere(
        'sale.tillId IS NULL',
      );
    }

    const sales =
      await salesQb.getMany();

    let cashSales = 0;
    let cardSales = 0;
    let qrSales = 0;
    let totalSales = 0;

    for (
      const sale of sales
    ) {
      totalSales +=
        Number(
          sale.grandTotal || 0,
        );

      for (
        const payment of
          sale.payments || []
      ) {
        const amount =
          Number(
            payment.amount || 0,
          );

        const method =
          String(
            payment.paymentMethod,
          ).toUpperCase();

        switch (method) {
          case 'CASH':
            cashSales +=
              amount;
            break;

          case 'CARD':
            cardSales +=
              amount;
            break;

          case 'QR':
            qrSales +=
              amount;
            break;
        }
      }
    }

    /*  RETURNS */

    const returnsQb =
      this.returnRepository
        .createQueryBuilder(
          'ret',
        )
        .innerJoin(
          PosSale,
          'sale',
          'sale.id = ret.pos_sale_id',
        )
        .where(
          'ret.createdAt BETWEEN :start AND :end',
          {
            start:
              startOfDay,

            end:
              endOfDay,
          },
        );

    this.applySaleScope(
      returnsQb,
      user,
      'sale',
    );

    returnsQb.andWhere(
      'sale.locationId = :returnLocationId',
      {
        returnLocationId:
          scope.locationId,
      },
    );

    if (
      scope.tillId !== null
    ) {
      returnsQb.andWhere(
        'sale.tillId = :returnTillId',
        {
          returnTillId:
            scope.tillId,
        },
      );
    } else {
      returnsQb.andWhere(
        'sale.tillId IS NULL',
      );
    }

    const returns =
      await returnsQb.getMany();

    const totalRefunds =
      returns.reduce(
        (sum, ret) =>
          sum +
          Number(
            ret.totalReturnAmount ||
              0,
          ),
        0,
      );

    /* EXPECTED CASH */

    const expectedCash =
      openingCash +
      cashSales -
      totalRefunds;

    return {
      date:
        businessDate,

      locationId:
        scope.locationId,

      tillId:
        scope.tillId,

      totalTransactions:
        sales.length,

      openingCash:
        Number(
          openingCash.toFixed(2),
        ),

      cashSales:
        Number(
          cashSales.toFixed(2),
        ),

      cardSales:
        Number(
          cardSales.toFixed(2),
        ),

      qrSales:
        Number(
          qrSales.toFixed(2),
        ),

      totalSales:
        Number(
          totalSales.toFixed(2),
        ),

      refundsCount:
        returns.length,

      totalRefunds:
        Number(
          totalRefunds.toFixed(2),
        ),

      expectedCash:
        Number(
          expectedCash.toFixed(2),
        ),
    };
  }

  /*  GET CASH CLOSING */

  async getCashClosing(
    dateStr:
      | string
      | undefined,
    user: PosAuthenticatedUser,
  ) {
    this.validateUserScope(user);

    const scope =
      await this.resolvePosScope(
        user,
      );

    const businessDate =
      this.validateBusinessDate(
        dateStr ||
          this.getBusinessDate(),
      );

    /* EXISTING CLOSING*/

    const existing =
      await this.cashClosingRepository.findOne(
        {
          where:
            this.buildCashClosingWhere(
              scope.locationId,
              scope.tillId,
              businessDate,
            ),
        },
      );

    if (existing) {
      return {
        closed: true,

        id:
          existing.id,

        date:
          existing.businessDate,

        locationId:
          existing.locationId,

        tillId:
          existing.tillId,

        openingBalance:
          Number(
            existing.openingBalance,
          ),

        cashSales:
          Number(
            existing.cashSales,
          ),

        refunds:
          Number(
            existing.refunds,
          ),

        expectedCash:
          Number(
            existing.expectedCash,
          ),

        actualCash:
          Number(
            existing.actualCash,
          ),

        difference:
          Number(
            existing.difference,
          ),

        closedBy:
          existing.closedBy,

        closedAt:
          existing.closedAt,
      };
    }

    /*  OPENING BALANCE */

    const opening =
      await this.openingBalanceRepository.findOne(
        {
          where:
            this.buildOpeningBalanceWhere(
              scope.locationId,
              scope.tillId,
              businessDate,
            ),
        },
      );

    if (!opening) {
      throw new BadRequestException(
        'Opening balance has not been set for this POS.',
      );
    }

    /*  SUMMARY */

    const summary =
      await this.getCashClosingSummary(
        businessDate,
        user,
      );

    return {
      closed: false,

      date:
        businessDate,

      locationId:
        scope.locationId,

      tillId:
        scope.tillId,

      openingBalance:
        Number(
          summary.openingCash,
        ),

      cashSales:
        Number(
          summary.cashSales,
        ),

      refunds:
        Number(
          summary.totalRefunds,
        ),

      expectedCash:
        Number(
          summary.expectedCash,
        ),

      actualCash:
        null,

      difference:
        null,

      closedBy:
        null,

      closedAt:
        null,
    };
  }

  /* CLOSE CASH */

  async closeCash(
    dto: CloseCashDto,
    user: PosAuthenticatedUser,
  ) {
    this.validateUserScope(user);

    const scope =
      await this.resolvePosScope(
        user,
      );

    const closeData =
      dto as any;

    const actualCash =
      Number(
        closeData.actualCash,
      );

    if (
      !Number.isFinite(
        actualCash,
      ) ||
      actualCash < 0
    ) {
      throw new BadRequestException(
        'Actual cash must be a valid non-negative amount.',
      );
    }

    const businessDate =
      this.validateBusinessDate(
        closeData.businessDate ||
          this.getBusinessDate(),
      );

    /*  OPENING BALANCE */

    const opening =
      await this.openingBalanceRepository.findOne(
        {
          where:
            this.buildOpeningBalanceWhere(
              scope.locationId,
              scope.tillId,
              businessDate,
            ),
        },
      );

    if (!opening) {
      throw new BadRequestException(
        'Opening balance has not been set for this POS.',
      );
    }

    /* CHECK EXISTING CLOSING */

    const existing =
      await this.cashClosingRepository.findOne(
        {
          where:
            this.buildCashClosingWhere(
              scope.locationId,
              scope.tillId,
              businessDate,
            ),
        },
      );

    if (existing) {
      return {
        closed: true,

        id:
          existing.id,

        date:
          existing.businessDate,

        locationId:
          existing.locationId,

        tillId:
          existing.tillId,

        openingBalance:
          Number(
            existing.openingBalance,
          ),

        cashSales:
          Number(
            existing.cashSales,
          ),

        refunds:
          Number(
            existing.refunds,
          ),

        expectedCash:
          Number(
            existing.expectedCash,
          ),

        actualCash:
          Number(
            existing.actualCash,
          ),

        difference:
          Number(
            existing.difference,
          ),

        closedBy:
          existing.closedBy,

        closedAt:
          existing.closedAt,
      };
    }

    /* GET SUMMARY */

    const summary =
      await this.getCashClosingSummary(
        businessDate,
        user,
      );

    const expectedCash =
      Number(
        summary.expectedCash,
      );

    const difference =
      Number(
        (
          actualCash -
          expectedCash
        ).toFixed(2),
      );

    /*  SAVE CLOSING */

    const closing =
      this.cashClosingRepository.create({
        locationId:
          scope.locationId,

        tillId:
          scope.tillId,

        businessDate,

        openingBalance:
          Number(
            summary.openingCash,
          ),

        cashSales:
          Number(
            summary.cashSales,
          ),

        refunds:
          Number(
            summary.totalRefunds,
          ),

        expectedCash,

        actualCash,

        difference,

        closedBy:
          Number(user.id),
      } as any);

    const savedResult = await this.cashClosingRepository.save(closing);

const saved = Array.isArray(savedResult)
  ? savedResult[0]
  : savedResult;

return {
  closed: true,
  id: saved.id,
  date: saved.businessDate,
  locationId: saved.locationId,
  tillId: saved.tillId,
  openingBalance: Number(
    saved.openingBalance,
  ),
  cashSales: Number(
    saved.cashSales,
  ),
  refunds: Number(
    saved.refunds,
  ),
  expectedCash: Number(
    saved.expectedCash,
  ),
  actualCash: Number(
    saved.actualCash,
  ),
  difference: Number(
    saved.difference,
  ),
  closedBy: saved.closedBy,
  closedAt: saved.closedAt,
};
  }
  /* DATE FORMAT */

  private formatDate(
    date: Date,
  ): string {
    return this.getBusinessDate(
      date,
    );
  }
}