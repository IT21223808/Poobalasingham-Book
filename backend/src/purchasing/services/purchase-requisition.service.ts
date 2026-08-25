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
  PurchaseRequisition,
  PurchaseRequisitionStatus,
} from '../entities/purchase-requisition.entity';

import { PurchaseRequisitionItem } from '../entities/purchase-requisition-item.entity';

import { Product } from '../../products/entities/product.entity';

import { CreatePurchaseRequisitionDto } from '../dto/create-purchase-requisition.dto';

import { UpdatePurchaseRequisitionDto } from '../dto/update-purchase-requisition.dto';

@Injectable()
export class PurchaseRequisitionService {
  constructor(
    @InjectRepository(PurchaseRequisition)
    private readonly requisitionRepository: Repository<PurchaseRequisition>,

    @InjectRepository(PurchaseRequisitionItem)
    private readonly requisitionItemRepository: Repository<PurchaseRequisitionItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly dataSource: DataSource,
  ) {}

  /* =========================================================
     CREATE PURCHASE REQUISITION
  ========================================================= */

  async create(dto: CreatePurchaseRequisitionDto) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /* =====================================================
         VALIDATE ITEMS
      ===================================================== */

      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase requisition item is required',
        );
      }

      /* =====================================================
         VALIDATE REQUESTED BY
      ===================================================== */

      if (
        !dto.requestedBy ||
        !dto.requestedBy.trim()
      ) {
        throw new BadRequestException(
          'Requested by is required',
        );
      }

      /* =====================================================
         VALIDATE DATES
      ===================================================== */

      if (
        dto.requestedDate &&
        dto.requiredDate &&
        dto.requiredDate < dto.requestedDate
      ) {
        throw new BadRequestException(
          'Required date cannot be earlier than requested date',
        );
      }

      /* =====================================================
         PRODUCT IDS
      ===================================================== */

      const productIds =
        dto.items.map(
          (item) => item.productId,
        );

      const uniqueProductIds = [
        ...new Set(productIds),
      ];

      /* =====================================================
         DUPLICATE PRODUCTS
      ===================================================== */

      if (
        uniqueProductIds.length !==
        productIds.length
      ) {
        throw new BadRequestException(
          'Duplicate products are not allowed',
        );
      }

      /* =====================================================
         CHECK PRODUCTS
      ===================================================== */

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

      /* =====================================================
         VALIDATE QUANTITY
      ===================================================== */

      for (const item of dto.items) {
        if (
          !Number.isFinite(
            item.quantity,
          ) ||
          item.quantity <= 0
        ) {
          throw new BadRequestException(
            'Quantity must be greater than 0',
          );
        }
      }

      /* =====================================================
         GENERATE REQUISITION NUMBER
      ===================================================== */

      const requisitionNumber =
        await this.generateRequisitionNumber(
          queryRunner,
        );

      /* =====================================================
         CREATE REQUISITION
      ===================================================== */

      const requisition =
        queryRunner.manager.create(
          PurchaseRequisition,
          {
            requisitionNumber,

            requestedBy:
              dto.requestedBy.trim(),

            status:
              PurchaseRequisitionStatus.PENDING,

            requestedDate:
              dto.requestedDate,

            requiredDate:
              dto.requiredDate,

            notes:
              dto.notes?.trim() || null,
          },
        );

      const savedRequisition =
        await queryRunner.manager.save(
          PurchaseRequisition,
          requisition,
        );

      /* =====================================================
         CREATE REQUISITION ITEMS
      ===================================================== */

      const items =
        dto.items.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseRequisitionItem,
              {
                requisition:
                  savedRequisition,

                productId:
                  item.productId,

                quantity:
                  item.quantity,
              },
            ),
        );

      await queryRunner.manager.save(
        PurchaseRequisitionItem,
        items,
      );

      /* =====================================================
         COMMIT
      ===================================================== */

      await queryRunner.commitTransaction();

      /* =====================================================
         RETURN COMPLETE REQUISITION
      ===================================================== */

      return this.findOne(
        savedRequisition.id,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* =========================================================
     FIND ALL PURCHASE REQUISITIONS
  ========================================================= */

  async findAll() {
    return this.requisitionRepository.find({
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

  /* =========================================================
     FIND ONE PURCHASE REQUISITION
  ========================================================= */

  async findOne(id: number) {
    const requisition =
      await this.requisitionRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!requisition) {
      throw new NotFoundException(
        `Purchase requisition ${id} not found`,
      );
    }

    return requisition;
  }

  /* =========================================================
     UPDATE PURCHASE REQUISITION
  ========================================================= */

  async update(
    id: number,
    dto: UpdatePurchaseRequisitionDto,
  ) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      /* =====================================================
         FIND REQUISITION
      ===================================================== */

      const requisition =
        await queryRunner.manager.findOne(
          PurchaseRequisition,
          {
            where: {
              id,
            },

            relations: {
              items: true,
            },
          },
        );

      if (!requisition) {
        throw new NotFoundException(
          `Purchase requisition ${id} not found`,
        );
      }

      /* =====================================================
         STATUS CHECK
      ===================================================== */

      if (
        requisition.status !==
        PurchaseRequisitionStatus.PENDING
      ) {
        throw new BadRequestException(
          'Only pending requisitions can be edited',
        );
      }

      /* =====================================================
         VALIDATE ITEMS
      ===================================================== */

      if (
        !dto.items ||
        dto.items.length === 0
      ) {
        throw new BadRequestException(
          'At least one purchase requisition item is required',
        );
      }

      /* =====================================================
         VALIDATE DATES
      ===================================================== */

      const requestedDate =
        dto.requestedDate ??
        requisition.requestedDate;

      const requiredDate =
        dto.requiredDate ??
        requisition.requiredDate;

      if (
        requestedDate &&
        requiredDate &&
        requiredDate < requestedDate
      ) {
        throw new BadRequestException(
          'Required date cannot be earlier than requested date',
        );
      }

      /* =====================================================
         PRODUCT IDS
      ===================================================== */

      const productIds =
        dto.items.map(
          (item) => item.productId,
        );

      const uniqueProductIds = [
        ...new Set(productIds),
      ];

      /* =====================================================
         DUPLICATE PRODUCT CHECK
      ===================================================== */

      if (
        uniqueProductIds.length !==
        productIds.length
      ) {
        throw new BadRequestException(
          'Duplicate products are not allowed',
        );
      }

      /* =====================================================
         CHECK PRODUCTS
      ===================================================== */

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

      /* =====================================================
         VALIDATE QUANTITY
      ===================================================== */

      for (const item of dto.items) {
        if (
          !Number.isFinite(
            item.quantity,
          ) ||
          item.quantity <= 0
        ) {
          throw new BadRequestException(
            'Quantity must be greater than 0',
          );
        }
      }

      /* =====================================================
         UPDATE MAIN REQUISITION
      ===================================================== */

      if (
        dto.requestedBy !== undefined
      ) {
        const requestedBy =
          dto.requestedBy.trim();

        if (!requestedBy) {
          throw new BadRequestException(
            'Requested by is required',
          );
        }

        requisition.requestedBy =
          requestedBy;
      }

      if (
        dto.requestedDate !==
        undefined
      ) {
        requisition.requestedDate =
          dto.requestedDate;
      }

      if (
        dto.requiredDate !==
        undefined
      ) {
        requisition.requiredDate =
          dto.requiredDate;
      }

      if (
        dto.notes !== undefined
      ) {
        requisition.notes =
          dto.notes?.trim() || null;
      }

      /* =====================================================
         SAVE REQUISITION
      ===================================================== */

      await queryRunner.manager.save(
        PurchaseRequisition,
        requisition,
      );

      /* =====================================================
         DELETE OLD ITEMS
      ===================================================== */

      await queryRunner.manager.delete(
        PurchaseRequisitionItem,
        {
          requisition: {
            id: requisition.id,
          },
        },
      );

      /* =====================================================
         CREATE UPDATED ITEMS
      ===================================================== */

      const newItems =
        dto.items.map(
          (item) =>
            queryRunner.manager.create(
              PurchaseRequisitionItem,
              {
                requisition:
                  requisition,

                productId:
                  item.productId,

                quantity:
                  item.quantity,
              },
            ),
        );

      await queryRunner.manager.save(
        PurchaseRequisitionItem,
        newItems,
      );

      /* =====================================================
         COMMIT
      ===================================================== */

      await queryRunner.commitTransaction();

      /* =====================================================
         RETURN UPDATED REQUISITION
      ===================================================== */

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /* =========================================================
     APPROVE
  ========================================================= */

  async approve(id: number) {
    const requisition =
      await this.requisitionRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!requisition) {
      throw new NotFoundException(
        `Purchase requisition ${id} not found`,
      );
    }

    /* =====================================================
       STATUS CHECK
    ===================================================== */

    if (
      requisition.status !==
      PurchaseRequisitionStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending requisitions can be approved',
      );
    }

    /* =====================================================
       APPROVE
    ===================================================== */

    requisition.status =
      PurchaseRequisitionStatus.APPROVED;

    return this.requisitionRepository.save(
      requisition,
    );
  }

  /* =========================================================
     REJECT
  ========================================================= */

  async reject(id: number) {
    const requisition =
      await this.requisitionRepository.findOne({
        where: {
          id,
        },

        relations: {
          items: {
            product: true,
          },
        },
      });

    if (!requisition) {
      throw new NotFoundException(
        `Purchase requisition ${id} not found`,
      );
    }

    /* =====================================================
       STATUS CHECK
    ===================================================== */

    if (
      requisition.status !==
      PurchaseRequisitionStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending requisitions can be rejected',
      );
    }

    /* =====================================================
       REJECT
    ===================================================== */

    requisition.status =
      PurchaseRequisitionStatus.REJECTED;

    return this.requisitionRepository.save(
      requisition,
    );
  }

  /* =========================================================
     GENERATE REQUISITION NUMBER
  ========================================================= */

  private async generateRequisitionNumber(
    queryRunner?: QueryRunner,
  ): Promise<string> {
    const repository =
      queryRunner?.manager.getRepository(
        PurchaseRequisition,
      ) ??
      this.requisitionRepository;

    const count =
      await repository.count();

    return `PR-${String(
      count + 1,
    ).padStart(5, '0')}`;
  }
}