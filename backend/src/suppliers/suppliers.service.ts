import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
import { GoodsReceivedNote } from '../purchasing/entities/grn.entity';
import { PurchaseInvoice } from '../purchasing/entities/purchase-invoice.entity';
import { PurchaseReturn } from '../purchasing/entities/purchase-return.entity';


@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    
    @InjectRepository(GoodsReceivedNote)
    private readonly grnRepository: Repository<GoodsReceivedNote>,
    
    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,

    @InjectRepository(PurchaseReturn)
    private readonly purchaseReturnRepository: Repository<PurchaseReturn>,
  ) {}

  // CREATE

  async create(
    dto: CreateSupplierDto,
  ): Promise<Supplier> {
    const existingCode =
      await this.supplierRepository.findOne({
        where: {
          supplierCode: dto.supplierCode,
        },
      });

    if (existingCode) {
      throw new ConflictException(
        'Supplier code already exists',
      );
    }

    const supplier =
      this.supplierRepository.create({
        ...dto,
        isActive:
          dto.isActive ?? true,
      });

    return this.supplierRepository.save(
      supplier,
    );
  }

  // =========================================================
  // LIST
  // =========================================================

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // =========================================================
  // VIEW
  // =========================================================

  async findOne(
    id: number,
  ): Promise<Supplier> {
    const supplier =
      await this.supplierRepository.findOne({
        where: {
          id,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        `Supplier with ID ${id} not found`,
      );
    }

    return supplier;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    id: number,
    dto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier =
      await this.findOne(id);

    if (
      dto.supplierCode &&
      dto.supplierCode !==
        supplier.supplierCode
    ) {
      const existingCode =
        await this.supplierRepository.findOne({
          where: {
            supplierCode:
              dto.supplierCode,
          },
        });

      if (
        existingCode &&
        existingCode.id !== id
      ) {
        throw new ConflictException(
          'Supplier code already exists',
        );
      }
    }

    Object.assign(
      supplier,
      dto,
    );

    return this.supplierRepository.save(
      supplier,
    );
  }

  // =========================================================
  // DELETE / DEACTIVATE
  // =========================================================

  async remove(
    id: number,
  ): Promise<Supplier> {
    const supplier =
      await this.findOne(id);

    supplier.isActive = false;

    return this.supplierRepository.save(
      supplier,
    );
  }

  // =========================================================
  // ACTIVATE
  // =========================================================

  async activate(
    id: number,
  ): Promise<Supplier> {
    const supplier =
      await this.findOne(id);

    supplier.isActive = true;

    return this.supplierRepository.save(
      supplier,
    );
  }

  // =========================================================
  // PURCHASE HISTORY
  // =========================================================

  async getPurchaseHistory(
    id: number,
  ) {
    // =======================================================
    // FIND SUPPLIER
    // =======================================================

    const supplier =
      await this.supplierRepository.findOne({
        where: {
          id,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        `Supplier with ID ${id} not found`,
      );
    }

    // =======================================================
    // PURCHASE ORDERS
    // =======================================================

    const purchaseOrders =
      await this.purchaseOrderRepository.find({
        where: {
          supplierId: id,
        },

        relations: {
          items: {
            product: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },
      });

    // =======================================================
    // PURCHASE ORDER IDS
    // =======================================================

    const purchaseOrderIds =
      purchaseOrders.map(
        (po) => po.id,
      );

    // =======================================================
    // GRNs
    // =======================================================

    let grns: GoodsReceivedNote[] = [];

    // =======================================================
    // INVOICES
    // =======================================================

    let invoices: PurchaseInvoice[] = [];

    // =======================================================
    // RETURNS
    // =======================================================

    let returns: PurchaseReturn[] = [];

    // =======================================================
    // IF PURCHASE ORDERS EXIST
    // =======================================================

    if (
      purchaseOrderIds.length > 0
    ) {
      // -----------------------------------------------------
      // GRNs
      // -----------------------------------------------------

      grns =
        await this.grnRepository
          .createQueryBuilder('grn')

          .leftJoinAndSelect(
            'grn.items',
            'items',
          )

          .leftJoinAndSelect(
            'items.product',
            'product',
          )

          .where(
            'grn.purchaseOrderId IN (:...ids)',
            {
              ids: purchaseOrderIds,
            },
          )

          .orderBy(
            'grn.createdAt',
            'DESC',
          )

          .getMany();

      // -----------------------------------------------------
      // PURCHASE INVOICES
      // -----------------------------------------------------

      invoices =
        await this.purchaseInvoiceRepository.find({
          where: {
            purchaseOrderId:
              In(purchaseOrderIds),
          },

          relations: {
            items: {
              product: true,
            },
          },

          order: {
            createdAt: 'DESC',
          },
        });

      // -----------------------------------------------------
      // PURCHASE RETURNS
      // -----------------------------------------------------

      returns =
        await this.purchaseReturnRepository.find({
          where: {
            purchaseOrderId:
              In(purchaseOrderIds),
          },

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

    // =======================================================
    // RESPONSE
    // =======================================================

    return {
      success: true,

      supplier: {
        id:
          supplier.id,

        supplierCode:
          supplier.supplierCode,

        supplierName:
          supplier.supplierName,
      },
      summary: {
        totalPurchaseOrders:purchaseOrders.length,
        totalGRNs:grns.length,
        totalInvoices:invoices.length,
        totalReturns: returns.length,
      },
      purchaseOrders,
      grns,
      invoices,
      returns,
    };
  }
}