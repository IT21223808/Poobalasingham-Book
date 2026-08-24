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

@Injectable()
export class PurchaseRequisitionService {
  constructor(
    @InjectRepository(PurchaseRequisition)
    private readonly requisitionRepository: Repository<PurchaseRequisition>,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePurchaseRequisitionDto) {
    const queryRunner =
      this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException(
          'At least one purchase requisition item is required',
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
        if (
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
        ) {
          throw new BadRequestException(
            'Quantity must be greater than 0',
          );
        }
      }

      const requisitionNumber =
        await this.generateRequisitionNumber(
          queryRunner,
        );

      const requisition =
        queryRunner.manager.create(
          PurchaseRequisition,
          {
            requisitionNumber,
            status:
              PurchaseRequisitionStatus.PENDING,
          },
        );

      const savedRequisition =
        await queryRunner.manager.save(
          requisition,
        );

      const items = dto.items.map(
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

      await queryRunner.manager.save(items);

      await queryRunner.commitTransaction();

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