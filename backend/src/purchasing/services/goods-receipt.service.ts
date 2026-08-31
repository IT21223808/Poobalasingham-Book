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

  // =========================================================
  // CREATE GRN
  // =========================================================

  async createGrn(dto: CreateGrnDto) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log(
        '========== GRN CREATE START ==========',
      );

      console.log(
        'GRN DTO:',
        JSON.stringify(dto, null, 2),
      );

      // =====================================================
      // VALIDATE PURCHASE ORDER
      // =====================================================

      const purchaseOrderId =
        Number(dto.purchaseOrderId);

      if (
        !Number.isInteger(purchaseOrderId) ||
        purchaseOrderId <= 0
      ) {
        throw new BadRequestException(
          'purchaseOrderId must be a positive integer',
        );
      }

      // =====================================================
      // VALIDATE LOCATION
      // =====================================================

      const locationId =
        String(dto.locationId ?? '').trim();

      this.validateLocationId(locationId);

      // =====================================================
      // FIND PURCHASE ORDER
      // =====================================================

      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id: purchaseOrderId,
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

      // =====================================================
      // PO STATUS VALIDATION
      // =====================================================

      if (
        purchaseOrder.status ===
        PurchaseOrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled purchase order cannot receive goods',
        );
      }

      if (
        purchaseOrder.status !==
          PurchaseOrderStatus.APPROVED &&
        purchaseOrder.status !==
          PurchaseOrderStatus.PARTIALLY_RECEIVED
      ) {
        throw new BadRequestException(
          `Purchase order with status ${purchaseOrder.status} cannot receive goods`,
        );
      }

      // =====================================================
      // VALIDATE ITEMS
      // =====================================================

      this.validateItems(dto);

      const productIds =
        dto.items.map((item) =>
          String(item.productId),
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

      // =====================================================
      // VALIDATE PRODUCTS
      // =====================================================

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

      // =====================================================
      // PREPARE GRN ITEMS
      // =====================================================

      const grnItems: Array<{
        productId: string;
        orderedQuantity: number;
        receivedQuantity: number;
      }> = [];

      for (const item of dto.items) {
        const productId =
          String(item.productId);

        const poItem =
          purchaseOrder.items.find(
            (poItem) =>
              String(poItem.productId) ===
              productId,
          );

        if (!poItem) {
          throw new BadRequestException(
            `Product ${productId} is not part of this purchase order`,
          );
        }

        const receivedQuantity =
          Number(item.receivedQuantity);

        if (
          !Number.isFinite(receivedQuantity) ||
          receivedQuantity <= 0
        ) {
          throw new BadRequestException(
            'Received quantity must be greater than 0',
          );
        }

        const alreadyReceived =
          await this.getReceivedQuantity(
            purchaseOrder.id,
            productId,
            queryRunner,
          );

        const orderedQuantity =
          Number(poItem.quantity);

        const remainingQuantity =
          orderedQuantity -
          alreadyReceived;

        console.log(
          'GRN QUANTITY CHECK:',
          {
            productId,
            orderedQuantity,
            alreadyReceived,
            remainingQuantity,
            requestedReceive:
              receivedQuantity,
          },
        );

        if (
          receivedQuantity >
          remainingQuantity
        ) {
          throw new BadRequestException(
            `Received quantity for product ${productId} exceeds remaining quantity. Remaining quantity: ${remainingQuantity}`,
          );
        }

        grnItems.push({
          productId,
          orderedQuantity,
          receivedQuantity,
        });
      }

      // =====================================================
      // CALCULATE GRN STATUS
      // =====================================================

      let isFullyReceived = true;

      for (const poItem of purchaseOrder.items) {
        const previousReceived =
          await this.getReceivedQuantity(
            purchaseOrder.id,
            String(poItem.productId),
            queryRunner,
          );

        const currentItem =
          grnItems.find(
            (item) =>
              String(item.productId) ===
              String(poItem.productId),
          );

        const currentReceived =
          currentItem?.receivedQuantity ?? 0;

        const totalReceived =
          previousReceived +
          currentReceived;

        if (
          totalReceived <
          Number(poItem.quantity)
        ) {
          isFullyReceived = false;
          break;
        }
      }

      const grnStatus =
        isFullyReceived
          ? GrnStatus.RECEIVED
          : GrnStatus.PARTIAL;

      // =====================================================
      // GENERATE GRN NUMBER
      // =====================================================

      const grnNumber =
        await this.generateGrnNumber(
          queryRunner,
        );

      // =====================================================
      // CREATE GRN HEADER
      // =====================================================

      const grn =
        queryRunner.manager.create(
          GoodsReceivedNote,
          {
            grnNumber,
            purchaseOrderId,
            locationId,
            status: grnStatus,
          },
        );

      const savedGrn =
        await queryRunner.manager.save(
          GoodsReceivedNote,
          grn,
        );

      // =====================================================
      // CREATE GRN ITEMS
      // =====================================================

      const items =
        grnItems.map((item) =>
          queryRunner.manager.create(
            GrnItem,
            {
              grnId: savedGrn.id,
              productId: item.productId,
              orderedQuantity:
                item.orderedQuantity,
              receivedQuantity:
                item.receivedQuantity,
            },
          ),
        );

      await queryRunner.manager.save(
        GrnItem,
        items,
      );

      // =====================================================
      // STOCK IN
      // =====================================================

      for (const item of grnItems) {
        await this.inventoryService.stockIn({
          productId:
            item.productId,

          quantity:
            item.receivedQuantity,

          locationId,
        });
      }

      // =====================================================
      // UPDATE PO STATUS
      // =====================================================

      await this.updatePurchaseOrderStatus(
        purchaseOrder,
        queryRunner,
      );

      // =====================================================
      // COMMIT
      // =====================================================

      await queryRunner.commitTransaction();

      console.log(
        '========== GRN CREATE SUCCESS ==========',
      );

      return this.findGrn(savedGrn.id);
    } catch (error: any) {
      console.error(
        '========== GRN CREATE ERROR ==========',
      );

      console.error(
        'Error Message:',
        error?.message,
      );

      console.error(
        'Error Stack:',
        error?.stack,
      );

      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        console.error(
          'Rollback Error:',
          rollbackError,
        );
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // GENERATE GRN NUMBER
  // =========================================================

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

  // =========================================================
  // FIND ALL GRNs
  // =========================================================

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

  // =========================================================
  // FIND ONE GRN
  // =========================================================

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

  // =========================================================
  // UPDATE GRN
  // =========================================================

  async updateGrn(
    id: number,
    dto: CreateGrnDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log(
        '========== GRN UPDATE START ==========',
      );

      console.log(
        'GRN UPDATE DTO:',
        JSON.stringify(dto, null, 2),
      );

      // =====================================================
      // VALIDATE LOCATION
      // =====================================================

      const newLocationId =
        String(dto.locationId ?? '').trim();

      this.validateLocationId(
        newLocationId,
      );

      // =====================================================
      // VALIDATE PURCHASE ORDER
      // =====================================================

      const purchaseOrderId =
        Number(dto.purchaseOrderId);

      if (
        !Number.isInteger(
          purchaseOrderId,
        ) ||
        purchaseOrderId <= 0
      ) {
        throw new BadRequestException(
          'purchaseOrderId must be a positive integer',
        );
      }

      // =====================================================
      // FIND EXISTING GRN
      // =====================================================

      const grn =
        await queryRunner.manager.findOne(
          GoodsReceivedNote,
          {
            where: {
              id,
            },

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

      // =====================================================
      // CANCELLED GRN CANNOT BE UPDATED
      // =====================================================

      if (
        grn.status ===
        GrnStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled GRN cannot be updated',
        );
      }

      // =====================================================
      // FIND PURCHASE ORDER
      // =====================================================

      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id: purchaseOrderId,
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

      // =====================================================
      // VALIDATE PO STATUS
      // =====================================================

      if (
        purchaseOrder.status ===
        PurchaseOrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled purchase order cannot be updated',
        );
      }

      // =====================================================
      // VALIDATE ITEMS
      // =====================================================

      this.validateItems(dto);

      // =====================================================
      // PRODUCT IDS
      // =====================================================

      const productIds =
        dto.items.map((item) =>
          String(item.productId),
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

      // =====================================================
      // PRODUCT VALIDATION
      // =====================================================

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

      // =====================================================
      // PREPARE NEW ITEMS
      // =====================================================

      const newItemsMap =
        new Map<
          string,
          {
            productId: string;
            orderedQuantity: number;
            receivedQuantity: number;
          }
        >();

      for (const item of dto.items) {
        const productId =
          String(item.productId);

        const poItem =
          purchaseOrder.items.find(
            (poItem) =>
              String(poItem.productId) ===
              productId,
          );

        if (!poItem) {
          throw new BadRequestException(
            `Product ${productId} is not part of this purchase order`,
          );
        }

        const receivedQuantity =
          Number(item.receivedQuantity);

        if (
          !Number.isFinite(
            receivedQuantity,
          ) ||
          receivedQuantity <= 0
        ) {
          throw new BadRequestException(
            'Received quantity must be greater than 0',
          );
        }

        newItemsMap.set(
          productId,
          {
            productId,
            orderedQuantity:
              Number(poItem.quantity),
            receivedQuantity,
          },
        );
      }

      // =====================================================
      // VALIDATE QUANTITY AGAINST OTHER GRNs
      // =====================================================

      for (
        const [
          productId,
          newItem,
        ] of newItemsMap
      ) {
        const poItem =
          purchaseOrder.items.find(
            (item) =>
              String(item.productId) ===
              productId,
          );

        if (!poItem) {
          throw new BadRequestException(
            `Product ${productId} is not part of this purchase order`,
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
              'otherGrn',
              'otherGrn.id = item.grnId',
            )
            .select(
              'COALESCE(SUM(item.receivedQuantity), 0)',
              'total',
            )
            .where(
              'otherGrn.purchaseOrderId = :purchaseOrderId',
              {
                purchaseOrderId:
                  purchaseOrder.id,
              },
            )
            .andWhere(
              'item.productId = :productId',
              {
                productId,
              },
            )
            .andWhere(
              'otherGrn.id != :grnId',
              {
                grnId: id,
              },
            )
            .andWhere(
              'otherGrn.status IN (:...statuses)',
              {
                statuses: [
                  GrnStatus.RECEIVED,
                  GrnStatus.PARTIAL,
                ],
              },
            )
            .getRawOne();

        const otherReceived =
          Number(
            result?.total ?? 0,
          );

        const orderedQuantity =
          Number(poItem.quantity);

        const remainingQuantity =
          orderedQuantity -
          otherReceived;

        if (
          newItem.receivedQuantity >
          remainingQuantity
        ) {
          throw new BadRequestException(
            `Received quantity for product ${productId} exceeds remaining quantity. Remaining quantity: ${remainingQuantity}`,
          );
        }
      }

      // =====================================================
      // CALCULATE NEW GRN STATUS
      // =====================================================

      let isFullyReceived = true;

      for (
        const poItem of
        purchaseOrder.items
      ) {
        const productId =
          String(poItem.productId);

        const result =
          await queryRunner.manager
            .createQueryBuilder(
              GrnItem,
              'item',
            )
            .innerJoin(
              GoodsReceivedNote,
              'otherGrn',
              'otherGrn.id = item.grnId',
            )
            .select(
              'COALESCE(SUM(item.receivedQuantity), 0)',
              'total',
            )
            .where(
              'otherGrn.purchaseOrderId = :purchaseOrderId',
              {
                purchaseOrderId:
                  purchaseOrder.id,
              },
            )
            .andWhere(
              'item.productId = :productId',
              {
                productId,
              },
            )
            .andWhere(
              'otherGrn.id != :grnId',
              {
                grnId: id,
              },
            )
            .andWhere(
              'otherGrn.status IN (:...statuses)',
              {
                statuses: [
                  GrnStatus.RECEIVED,
                  GrnStatus.PARTIAL,
                ],
              },
            )
            .getRawOne();

        const otherReceived =
          Number(
            result?.total ?? 0,
          );

        const currentReceived =
          newItemsMap.get(
            productId,
          )?.receivedQuantity ?? 0;

        const totalReceived =
          otherReceived +
          currentReceived;

        if (
          totalReceived <
          Number(poItem.quantity)
        ) {
          isFullyReceived = false;
          break;
        }
      }

      const newGrnStatus =
        isFullyReceived
          ? GrnStatus.RECEIVED
          : GrnStatus.PARTIAL;

      // =====================================================
      // OLD ITEMS MAP
      // =====================================================

      const oldItemsMap =
        new Map<
          string,
          GrnItem
        >();

      for (const oldItem of grn.items) {
        oldItemsMap.set(
          String(oldItem.productId),
          oldItem,
        );
      }

      // =====================================================
      // STOCK UPDATE
      // =====================================================

      const allProductIds = [
        ...new Set([
          ...oldItemsMap.keys(),
          ...newItemsMap.keys(),
        ]),
      ];

      const oldLocationId =
        String(grn.locationId);

      // =====================================================
      // SAME LOCATION
      // =====================================================

      if (
        oldLocationId ===
        newLocationId
      ) {
        for (
          const productId of
          allProductIds
        ) {
          const oldQuantity =
            Number(
              oldItemsMap.get(
                productId,
              )?.receivedQuantity ?? 0,
            );

          const newQuantity =
            Number(
              newItemsMap.get(
                productId,
              )?.receivedQuantity ?? 0,
            );

          const difference =
            newQuantity -
            oldQuantity;

          console.log(
            'GRN STOCK DELTA:',
            {
              productId,
              oldQuantity,
              newQuantity,
              difference,
              locationId:
                newLocationId,
            },
          );

          if (difference > 0) {
            await this.inventoryService.stockIn({
              productId,
              quantity: difference,
              locationId:
                newLocationId,
            });
          } else if (
            difference < 0
          ) {
            await this.inventoryService.stockOut({
              productId,
              quantity:
                Math.abs(
                  difference,
                ),
              locationId:
                oldLocationId,
            });
          }
        }
      }

      // =====================================================
      // LOCATION CHANGED
      // =====================================================

      else {
        console.log(
          'GRN LOCATION CHANGED:',
          {
            oldLocationId,
            newLocationId,
          },
        );

        // ---------------------------------------------------
        // REMOVE OLD STOCK
        // ---------------------------------------------------

        for (
          const oldItem of
          grn.items
        ) {
          await this.inventoryService.stockOut({
            productId:
              String(
                oldItem.productId,
              ),

            quantity:
              Number(
                oldItem.receivedQuantity,
              ),

            locationId:
              oldLocationId,
          });
        }

        // ---------------------------------------------------
        // ADD NEW STOCK
        // ---------------------------------------------------

        for (
          const [
            productId,
            newItem,
          ] of newItemsMap
        ) {
          await this.inventoryService.stockIn({
            productId,

            quantity:
              Number(
                newItem.receivedQuantity,
              ),

            locationId:
              newLocationId,
          });
        }
      }

      // =====================================================
      // UPDATE EXISTING GRN ITEMS
      // =====================================================

      for (
        const oldItem of
        grn.items
      ) {
        const productId =
          String(oldItem.productId);

        const newItem =
          newItemsMap.get(
            productId,
          );

        // ---------------------------------------------------
        // PRODUCT REMOVED FROM GRN
        // ---------------------------------------------------

        if (!newItem) {
          await queryRunner.manager.delete(
            GrnItem,
            {
              id: oldItem.id,
            },
          );

          console.log(
            'GRN ITEM REMOVED:',
            productId,
          );

          continue;
        }

        // ---------------------------------------------------
        // UPDATE SAME ROW
        // ---------------------------------------------------

        oldItem.orderedQuantity =
          newItem.orderedQuantity;

        oldItem.receivedQuantity =
          newItem.receivedQuantity;

        await queryRunner.manager.save(
          GrnItem,
          oldItem,
        );

        console.log(
          'GRN ITEM UPDATED:',
          {
            productId,
            newQuantity:
              newItem.receivedQuantity,
          },
        );
      }

      // =====================================================
      // ADD BRAND NEW PRODUCTS
      // =====================================================

      for (
        const [
          productId,
          newItem,
        ] of newItemsMap
      ) {
        const existingItem =
          oldItemsMap.get(
            productId,
          );

        if (existingItem) {
          continue;
        }

        const newGrnItem =
          queryRunner.manager.create(
            GrnItem,
            {
              grnId: grn.id,

              productId,

              orderedQuantity:
                newItem.orderedQuantity,

              receivedQuantity:
                newItem.receivedQuantity,
            },
          );

        await queryRunner.manager.save(
          GrnItem,
          newGrnItem,
        );

        console.log(
          'NEW GRN ITEM CREATED:',
          productId,
        );
      }

      // =====================================================
      // UPDATE GRN HEADER
      // =====================================================

      grn.purchaseOrderId =
        purchaseOrderId;

      grn.locationId =
        newLocationId;

      grn.status =
        newGrnStatus;

      await queryRunner.manager.save(
        GoodsReceivedNote,
        grn,
      );

      // =====================================================
      // UPDATE PO STATUS
      // =====================================================

      await this.updatePurchaseOrderStatus(
        purchaseOrder,
        queryRunner,
      );

      // =====================================================
      // COMMIT
      // =====================================================

      await queryRunner.commitTransaction();

      console.log(
        '========== GRN UPDATE SUCCESS ==========',
      );

      return this.findGrn(id);
    } catch (error: any) {
      console.error(
        '========== GRN UPDATE ERROR ==========',
      );

      console.error(
        'Error Message:',
        error?.message,
      );

      console.error(
        'Error Stack:',
        error?.stack,
      );

      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        console.error(
          'Rollback Error:',
          rollbackError,
        );
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // CANCEL GRN
  // =========================================================

  async cancelGrn(id: number) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log(
        '========== GRN CANCEL START ==========',
      );

      // =====================================================
      // FIND GRN
      // =====================================================

      const grn =
        await queryRunner.manager.findOne(
          GoodsReceivedNote,
          {
            where: {
              id,
            },

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

      // =====================================================
      // ALREADY CANCELLED
      // =====================================================

      if (
        grn.status ===
        GrnStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'GRN is already cancelled',
        );
      }

      // =====================================================
      // ONLY RECEIVED / PARTIAL CAN BE CANCELLED
      // =====================================================

      if (
        grn.status !==
          GrnStatus.RECEIVED &&
        grn.status !==
          GrnStatus.PARTIAL
      ) {
        throw new BadRequestException(
          `GRN with status ${grn.status} cannot be cancelled`,
        );
      }

      // =====================================================
      // FIND PURCHASE ORDER
      // =====================================================

      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id:
                grn.purchaseOrderId,
            },

            relations: {
              items: true,
            },
          },
        );

      // =====================================================
      // REVERSE STOCK
      // =====================================================

      for (
        const item of
        grn.items
      ) {
        const productId =
          String(item.productId);

        const quantity =
          Number(
            item.receivedQuantity,
          );

        const locationId =
          String(grn.locationId);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          continue;
        }

        console.log(
          'CANCEL GRN STOCK OUT:',
          {
            productId,
            quantity,
            locationId,
          },
        );

        await this.inventoryService.stockOut({
          productId,
          quantity,
          locationId,
        });
      }

      // =====================================================
      // CHANGE GRN STATUS
      // =====================================================

      grn.status =
        GrnStatus.CANCELLED;

      await queryRunner.manager.save(
        GoodsReceivedNote,
        grn,
      );

      // =====================================================
      // UPDATE PO STATUS
      // =====================================================

      if (purchaseOrder) {
        await this.updatePurchaseOrderStatus(
          purchaseOrder,
          queryRunner,
        );
      }

      // =====================================================
      // COMMIT
      // =====================================================

      await queryRunner.commitTransaction();

      console.log(
        '========== GRN CANCEL SUCCESS ==========',
      );

      return this.findGrn(id);
    } catch (error: any) {
      console.error(
        '========== GRN CANCEL ERROR ==========',
      );

      console.error(
        'Error Message:',
        error?.message,
      );

      console.error(
        'Error Stack:',
        error?.stack,
      );

      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        console.error(
          'Rollback Error:',
          rollbackError,
        );
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // DELETE GRN
  // =========================================================

  async deleteGrn(id: number) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // =====================================================
      // FIND GRN
      // =====================================================

      const grn =
        await queryRunner.manager.findOne(
          GoodsReceivedNote,
          {
            where: {
              id,
            },

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

      // =====================================================
      // CANCELLED GRN
      // =====================================================

      if (
        grn.status ===
        GrnStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Cancelled GRN cannot be deleted',
        );
      }

      // =====================================================
      // FIND PO
      // =====================================================

      const purchaseOrder =
        await queryRunner.manager.findOne(
          PurchaseOrder,
          {
            where: {
              id:
                grn.purchaseOrderId,
            },

            relations: {
              items: true,
            },
          },
        );

      // =====================================================
      // REVERSE STOCK
      // =====================================================

      for (
        const item of
        grn.items
      ) {
        console.log(
          'DELETE GRN STOCK OUT:',
          {
            productId:
              item.productId,

            quantity:
              Number(
                item.receivedQuantity,
              ),

            locationId:
              grn.locationId,
          },
        );

        await this.inventoryService.stockOut({
          productId:
            String(
              item.productId,
            ),

          quantity:
            Number(
              item.receivedQuantity,
            ),

          locationId:
            String(
              grn.locationId,
            ),
        });
      }

      // =====================================================
      // DELETE ITEMS
      // =====================================================

      await queryRunner.manager.delete(
        GrnItem,
        {
          grnId: id,
        },
      );

      // =====================================================
      // DELETE GRN
      // =====================================================

      await queryRunner.manager.delete(
        GoodsReceivedNote,
        {
          id,
        },
      );

      // =====================================================
      // UPDATE PO STATUS
      // =====================================================

      if (purchaseOrder) {
        await this.updatePurchaseOrderStatus(
          purchaseOrder,
          queryRunner,
        );
      }

      // =====================================================
      // COMMIT
      // =====================================================

      await queryRunner.commitTransaction();

      return {
        message:
          'GRN deleted successfully',

        id,
      };
    } catch (error: any) {
      console.error(
        'Error Message:',
        error?.message,
      );

      console.error(
        'Error Stack:',
        error?.stack,
      );

      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        console.error(
          'Rollback Error:',
          rollbackError,
        );
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // UPDATE PURCHASE ORDER STATUS
  // =========================================================

  private async updatePurchaseOrderStatus(
    purchaseOrder: PurchaseOrder,
    queryRunner: QueryRunner,
  ) {
    let totalOrdered = 0;
    let totalReceived = 0;

    for (
      const poItem of
      purchaseOrder.items
    ) {
      totalOrdered +=
        Number(
          poItem.quantity,
        );

      const received =
        await this.getReceivedQuantity(
          purchaseOrder.id,
          String(
            poItem.productId,
          ),
          queryRunner,
        );

      totalReceived +=
        received;
    }

    if (
      totalReceived <= 0
    ) {
      purchaseOrder.status =
        PurchaseOrderStatus.APPROVED;
    } else if (
      totalReceived <
      totalOrdered
    ) {
      purchaseOrder.status =
        PurchaseOrderStatus.PARTIALLY_RECEIVED;
    } else {
      purchaseOrder.status =
        PurchaseOrderStatus.RECEIVED;
    }

    await queryRunner.manager.save(
      PurchaseOrder,
      purchaseOrder,
    );

    console.log(
      'PO STATUS:',
      purchaseOrder.status,
    );
  }

  // =========================================================
  // GET RECEIVED QUANTITY
  // =========================================================

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
          'grn.status IN (:...statuses)',
          {
            statuses: [
              GrnStatus.RECEIVED,
              GrnStatus.PARTIAL,
            ],
          },
        )
        .getRawOne();

    const total =
      Number(
        result?.total ?? 0,
      );

    console.log({
      purchaseOrderId,
      productId,
      totalReceived: total,
    });

    return total;
  }

  // =========================================================
  // LOCATION UUID VALIDATION
  // =========================================================

  private validateLocationId(
    locationId: string,
  ) {
    if (!locationId) {
      throw new BadRequestException(
        'locationId is required',
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !uuidRegex.test(locationId)
    ) {
      throw new BadRequestException(
        'locationId must be a valid UUID',
      );
    }
  }

  // =========================================================
  // ITEMS VALIDATION
  // =========================================================

  private validateItems(
    dto: CreateGrnDto,
  ) {
    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'At least one GRN item is required',
      );
    }
  }
}