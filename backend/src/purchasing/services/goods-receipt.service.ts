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
  GoodsReceivedNote,
  GrnStatus,
} from '../entities/grn.entity';

import { GrnItem } from '../entities/grn-item.entity';

import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../entities/purchase-order.entity';

import { Product } from '../../products/entities/product.entity';

import { CreateGrnDto } from '../dto/create-grn.dto';

import { InventoryService } from '../../inventory/inventory.service';

@Injectable()
export class GoodsReceiptService {
  constructor(
    @InjectRepository(GoodsReceivedNote)
    private readonly grnRepository: Repository<GoodsReceivedNote>,

    private readonly inventoryService: InventoryService,

    private readonly dataSource: DataSource,
  ) {}

  async createGrn(dto: CreateGrnDto) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!dto.locationId) {
        throw new BadRequestException(
          'Location is required for GRN',
        );
      }

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
          'Cancelled purchase order cannot receive goods',
        );
      }

      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException(
          'At least one GRN item is required',
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

      const grnItems: Array<{
        productId: string;
        orderedQuantity: number;
        receivedQuantity: number;
      }> = [];

      for (const item of dto.items) {
        const purchaseOrderItem =
          purchaseOrder.items.find(
            (poItem) =>
              String(poItem.productId) ===
              String(item.productId),
          );

        if (!purchaseOrderItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of this purchase order`,
          );
        }

        if (
          !Number.isFinite(
            item.receivedQuantity,
          ) ||
          item.receivedQuantity <= 0
        ) {
          throw new BadRequestException(
            'Received quantity must be greater than 0',
          );
        }

        const alreadyReceived =
          await this.getReceivedQuantity(
            purchaseOrder.id,
            item.productId,
            queryRunner,
          );

        const remainingQuantity =
          purchaseOrderItem.quantity -
          alreadyReceived;

        if (
          item.receivedQuantity >
          remainingQuantity
        ) {
          throw new BadRequestException(
            `Received quantity for product ${item.productId} exceeds remaining quantity. Remaining quantity: ${remainingQuantity}`,
          );
        }

        grnItems.push({
          productId: item.productId,
          orderedQuantity:
            purchaseOrderItem.quantity,
          receivedQuantity:
            item.receivedQuantity,
        });
      }

      const grnNumber =
        await this.generateGrnNumber(
          queryRunner,
        );

      const grn =
        queryRunner.manager.create(
          GoodsReceivedNote,
          {
            grnNumber,
            purchaseOrderId:
              dto.purchaseOrderId,
            status:
              GrnStatus.RECEIVED,
          },
        );

      const savedGrn =
        await queryRunner.manager.save(grn);

      const items = grnItems.map(
        (item) =>
          queryRunner.manager.create(
            GrnItem,
            {
              grnId: savedGrn.id,
              productId:
                item.productId,
              orderedQuantity:
                item.orderedQuantity,
              receivedQuantity:
                item.receivedQuantity,
            },
          ),
      );

      await queryRunner.manager.save(items);

      for (const item of grnItems) {
        await this.inventoryService.stockIn({
          productId: item.productId,
          quantity:
            item.receivedQuantity,
          locationId:
            String(dto.locationId),
        });
      }

      let fullyReceived = true;

      for (
        const poItem of purchaseOrder.items
      ) {
        const receivedQuantity =
          await this.getReceivedQuantity(
            purchaseOrder.id,
            poItem.productId,
            queryRunner,
          );

        if (
          receivedQuantity <
          poItem.quantity
        ) {
          fullyReceived = false;
          break;
        }
      }

      if (fullyReceived) {
        purchaseOrder.status =
          PurchaseOrderStatus.RECEIVED;

        await queryRunner.manager.save(
          purchaseOrder,
        );
      }

      await queryRunner.commitTransaction();

      return this.findGrn(savedGrn.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateGrnNumber(
    queryRunner?: QueryRunner,
  ): Promise<string> {
    const repository =
      queryRunner?.manager.getRepository(
        GoodsReceivedNote,
      ) ??
      this.grnRepository;

    const count =
      await repository.count();

    return `GRN-${String(
      count + 1,
    ).padStart(5, '0')}`;
  }

  async findAllGrns() {
    return this.grnRepository.find({
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

  async findGrn(id: number) {
    const grn =
      await this.grnRepository.findOne({
        where: {
          id,
        },
        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!grn) {
      throw new NotFoundException(
        `GRN ${id} not found`,
      );
    }

    return grn;
  }

  async updateGrn(
    id: number,
    dto: CreateGrnDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const grn =
        await queryRunner.manager.findOne(
          GoodsReceivedNote,
          {
            where: { id },
            relations: {
              items: true,
            },
          },
        );

      if (!grn) {
        throw new NotFoundException(
          `GRN ${id} not found`,
        );
      }

      if (!dto.locationId) {
        throw new BadRequestException(
          'Location is required for GRN',
        );
      }

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
          'Cancelled purchase order cannot be updated',
        );
      }

      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException(
          'At least one GRN item is required',
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

      for (const item of dto.items) {
        const purchaseOrderItem =
          purchaseOrder.items.find(
            (poItem) =>
              String(poItem.productId) ===
              String(item.productId),
          );

        if (!purchaseOrderItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of this purchase order`,
          );
        }

        if (
          !Number.isFinite(
            item.receivedQuantity,
          ) ||
          item.receivedQuantity <= 0
        ) {
          throw new BadRequestException(
            'Received quantity must be greater than 0',
          );
        }

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
                purchaseOrderId:
                  purchaseOrder.id,
              },
            )
            .andWhere(
              'item.productId = :productId',
              {
                productId:
                  item.productId,
              },
            )
            .andWhere(
              'grn.id != :grnId',
              {
                grnId: id,
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

        const otherReceived =
          Number(result?.total ?? 0);

        const remainingQuantity =
          purchaseOrderItem.quantity -
          otherReceived;

        if (
          item.receivedQuantity >
          remainingQuantity
        ) {
          throw new BadRequestException(
            `Received quantity for product ${item.productId} exceeds remaining quantity. Remaining quantity: ${remainingQuantity}`,
          );
        }
      }

      // Remove old stock
      for (const oldItem of grn.items) {
        await this.inventoryService.stockOut({
          productId:
            oldItem.productId,
          quantity:
            oldItem.receivedQuantity,
        });
      }

      await queryRunner.manager.delete(
        GrnItem,
        {
          grnId: id,
        },
      );

      grn.purchaseOrderId =
        dto.purchaseOrderId;

      grn.status =
        GrnStatus.RECEIVED;

      await queryRunner.manager.save(
        GoodsReceivedNote,
        grn,
      );

      const newItems = dto.items.map(
        (item) =>
          queryRunner.manager.create(
            GrnItem,
            {
              grnId: grn.id,
              productId:
                item.productId,
              orderedQuantity:
                purchaseOrder.items.find(
                  (poItem) =>
                    String(
                      poItem.productId,
                    ) ===
                    String(
                      item.productId,
                    ),
                )!.quantity,
              receivedQuantity:
                item.receivedQuantity,
            },
          ),
      );

      await queryRunner.manager.save(
        newItems,
      );

      // Add new stock
      for (const item of dto.items) {
        await this.inventoryService.stockIn({
          productId:
            item.productId,
          quantity:
            item.receivedQuantity,
          locationId:
            String(dto.locationId),
        });
      }

      let fullyReceived = true;

      for (
        const poItem of purchaseOrder.items
      ) {
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
                purchaseOrderId:
                  purchaseOrder.id,
              },
            )
            .andWhere(
              'item.productId = :productId',
              {
                productId:
                  poItem.productId,
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

        const receivedQuantity =
          Number(result?.total ?? 0);

        if (
          receivedQuantity <
          poItem.quantity
        ) {
          fullyReceived = false;
          break;
        }
      }

      purchaseOrder.status =
        fullyReceived
          ? PurchaseOrderStatus.RECEIVED
          : PurchaseOrderStatus.APPROVED;

      await queryRunner.manager.save(
        PurchaseOrder,
        purchaseOrder,
      );

      await queryRunner.commitTransaction();

      return this.findGrn(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteGrn(id: number) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const grn =
        await queryRunner.manager.findOne(
          GoodsReceivedNote,
          {
            where: { id },
            relations: {
              items: true,
            },
          },
        );

      if (!grn) {
        throw new NotFoundException(
          `GRN ${id} not found`,
        );
      }

      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id: grn.purchaseOrderId,
            },
            relations: {
              items: true,
            },
          },
        );

      for (const item of grn.items) {
        await this.inventoryService.stockOut({
          productId:
            item.productId,
          quantity:
            item.receivedQuantity,
        });
      }

      await queryRunner.manager.delete(
        GrnItem,
        {
          grnId: id,
        },
      );

      await queryRunner.manager.delete(
        GoodsReceivedNote,
        id,
      );

      if (purchaseOrder) {
        let fullyReceived = true;

        for (
          const poItem of purchaseOrder.items
        ) {
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
                  purchaseOrderId:
                    purchaseOrder.id,
                },
              )
              .andWhere(
                'item.productId = :productId',
                {
                  productId:
                    poItem.productId,
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

          const receivedQuantity =
            Number(result?.total ?? 0);

          if (
            receivedQuantity <
            poItem.quantity
          ) {
            fullyReceived = false;
            break;
          }
        }

        purchaseOrder.status =
          fullyReceived
            ? PurchaseOrderStatus.RECEIVED
            : PurchaseOrderStatus.APPROVED;

        await queryRunner.manager.save(
          PurchaseOrder,
          purchaseOrder,
        );
      }

      await queryRunner.commitTransaction();

      return {
        message:
          'GRN deleted successfully',
        id,
      };
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
}