import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  QueryRunner,
  Repository,
} from 'typeorm';

import {
  PurchaseReturn,
  PurchaseReturnStatus,
} from '../entities/purchase-return.entity';

import { PurchaseReturnItem } from '../entities/purchase-return-item.entity';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../entities/purchase-order.entity';

import { PurchaseInvoice } from '../entities/purchase-invoice.entity';

import {
  GoodsReceivedNote,
  GrnStatus,
} from '../entities/grn.entity';

import { GrnItem } from '../entities/grn-item.entity';

import { Product } from '../../products/entities/product.entity';

import { CreatePurchaseReturnDto } from '../dto/create-purchase-return.dto';

import { InventoryService } from '../../inventory/inventory.service';

type PurchaseReturnValidationItem = {
  productId: string;
  quantity: number;
};

@Injectable()
export class PurchaseReturnService {
  constructor(
    @InjectRepository(PurchaseReturn)
    private readonly purchaseReturnRepository: Repository<PurchaseReturn>,

    private readonly inventoryService: InventoryService,

    private readonly dataSource: DataSource,
  ) {}

  async createPurchaseReturn(
    dto: CreatePurchaseReturnDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id: dto.purchaseOrderId,
            },
            relations: {
              items: true,
            },
          },
        );

      if (!purchaseOrder) {
        throw new NotFoundException(
          'Purchase order not found',
        );
      }

      if (
        purchaseOrder.status ===
        PurchaseOrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cannot return goods from cancelled purchase order',
        );
      }

      if (dto.invoiceId) {
        const invoice =
          await queryRunner.manager.findOne(
            PurchaseInvoice,
            {
              where: {
                id: dto.invoiceId,
              },
            },
          );

        if (!invoice) {
          throw new NotFoundException(
            'Purchase invoice not found',
          );
        }

        if (
          invoice.purchaseOrderId !==
          purchaseOrder.id
        ) {
          throw new BadRequestException(
            'Invoice does not belong to this purchase order',
          );
        }
      }

      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException(
          'At least one purchase return item is required',
        );
      }

      const productIds = dto.items.map(
        (item) => item.productId,
      );

      const uniqueProductIds = [
        ...new Set(productIds),
      ];

      if (
        uniqueProductIds.length !==
        productIds.length
      ) {
        throw new BadRequestException(
          'Duplicate products are not allowed',
        );
      }

      const products =
        await queryRunner.manager.findBy(
          Product,
          {
            id: In(uniqueProductIds),
          },
        );

      if (
        products.length !==
        uniqueProductIds.length
      ) {
        throw new NotFoundException(
          'One or more products were not found',
        );
      }

      const returnItems: PurchaseReturnValidationItem[] =
        [];

      for (const item of dto.items) {
        const poItem =
          purchaseOrder.items.find(
            (poItem) =>
              String(poItem.productId) ===
              String(item.productId),
          );

        if (!poItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of this purchase order`,
          );
        }

        if (item.quantity <= 0) {
          throw new BadRequestException(
            'Return quantity must be greater than 0',
          );
        }

        const receivedQuantity =
          await this.getReceivedQuantity(
            purchaseOrder.id,
            item.productId,
            queryRunner,
          );

        const returnedQuantity =
          await this.getReturnedQuantity(
            purchaseOrder.id,
            item.productId,
            queryRunner,
          );

        const availableReturnQuantity =
          receivedQuantity -
          returnedQuantity;

        if (
          item.quantity >
          availableReturnQuantity
        ) {
          throw new BadRequestException(
            `Return quantity for product ${item.productId} exceeds available quantity`,
          );
        }

        returnItems.push({
          productId:
            item.productId,
          quantity:
            item.quantity,
        });
      }

      const returnNumber =
        await this.generateReturnNumber(
          queryRunner,
        );

      const purchaseReturn =
        queryRunner.manager.create(
          PurchaseReturn,
          {
            returnNumber,
            purchaseOrderId:
              dto.purchaseOrderId,
            invoiceId:
              dto.invoiceId,
            reason:
              dto.reason,
            status:
              PurchaseReturnStatus.COMPLETED,
          },
        );

      const savedReturn =
        await queryRunner.manager.save(
          purchaseReturn,
        );

      const items =
        returnItems.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseReturnItem,
              {
                returnId:
                  savedReturn.id,
                productId:
                  item.productId,
                quantity:
                  item.quantity,
              },
            ),
        );

      await queryRunner.manager.save(
        items,
      );

      for (const item of returnItems) {
        await this.inventoryService.stockOut({
          productId:
            item.productId,
          quantity:
            item.quantity,
        });
      }

      await queryRunner.commitTransaction();

      return this.findPurchaseReturn(
        savedReturn.id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getReceivedQuantity(
    purchaseOrderId: number,
    productId: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const result =
      await queryRunner.manager
        .createQueryBuilder(
          GrnItem,
          'item',
        )
        .innerJoin(
          GoodsReceivedNote,
          'grn',
          'grn.id = item.grnId',
        )
        .select(
          'COALESCE(SUM(item.receivedQuantity), 0)',
          'total',
        )
        .where(
          'grn.purchaseOrderId = :purchaseOrderId',
          {
            purchaseOrderId,
          },
        )
        .andWhere(
          'item.productId = :productId',
          {
            productId,
          },
        )
        .andWhere(
          'grn.status = :status',
          {
            status:
              GrnStatus.RECEIVED,
          },
        )
        .getRawOne();

    return Number(
      result?.total ?? 0,
    );
  }

  private async getReturnedQuantity(
    purchaseOrderId: number,
    productId: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const result =
      await queryRunner.manager
        .createQueryBuilder(
          PurchaseReturnItem,
          'item',
        )
        .innerJoin(
          PurchaseReturn,
          'purchaseReturn',
          'purchaseReturn.id = item.returnId',
        )
        .select(
          'COALESCE(SUM(item.quantity), 0)',
          'total',
        )
        .where(
          'purchaseReturn.purchaseOrderId = :purchaseOrderId',
          {
            purchaseOrderId,
          },
        )
        .andWhere(
          'item.productId = :productId',
          {
            productId,
          },
        )
        .andWhere(
          'purchaseReturn.status = :status',
          {
            status:
              PurchaseReturnStatus.COMPLETED,
          },
        )
        .getRawOne();

    return Number(
      result?.total ?? 0,
    );
  }

  private async generateReturnNumber(
    queryRunner?: QueryRunner,
  ): Promise<string> {
    const repository =
      queryRunner?.manager.getRepository(
        PurchaseReturn,
      ) ??
      this.purchaseReturnRepository;

    const count =
      await repository.count();

    return `PRN-${String(
      count + 1,
    ).padStart(5, '0')}`;
  }

  async findPurchaseReturn(id: number) {
    const purchaseReturn =
      await this.purchaseReturnRepository.findOne({
        where: {
          id,
        },
        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!purchaseReturn) {
      throw new NotFoundException(
        `Purchase return ${id} not found`,
      );
    }

    return purchaseReturn;
  }

  async findAllPurchaseReturns() {
    return this.purchaseReturnRepository.find({
      relations: {
        items: {
          product: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}