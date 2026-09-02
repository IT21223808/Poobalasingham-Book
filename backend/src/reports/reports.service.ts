import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PosSale,SaleStatus,} from '../pos/entities/pos-sale.entity';
import { PosReturn } from '../pos/entities/pos-return.entity';
import { ReportQueryDto } from './dto/report-query.dto';
import { Product } from '../products/entities/product.entity';
import { PosSaleItem } from '../pos/entities/pos-sale-item.entity';
import { InventoryStock } from '../inventory/entities/inventory-stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { PurchaseOrder,PurchaseOrderStatus,} from '../purchasing/entities/purchase-order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerPayment } from '../finance/entities/customer-payment.entity';
import { GoodsReceivedNote,GrnStatus,} from '../purchasing/entities/grn.entity';
import { GrnItem } from '../purchasing/entities/grn-item.entity';

import {
  FinancePaymentMethod,
  FinanceTransaction,
  TransactionType,
} from '../finance/entities/finance-transaction.entity';
import { PurchaseInvoice } from '../purchasing/entities/purchase-invoice.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(PosSale)
    private readonly posSaleRepository: Repository<PosSale>,

    @InjectRepository(PosReturn)
    private readonly posReturnRepository: Repository<PosReturn>,

    @InjectRepository(Product)
  private readonly productRepository: Repository<Product>,

  @InjectRepository(PosSaleItem)
  private readonly posSaleItemRepository: Repository<PosSaleItem>,

  @InjectRepository(InventoryStock)
private readonly inventoryStockRepository: Repository<InventoryStock>,

@InjectRepository(StockMovement)
private readonly stockMovementRepository: Repository<StockMovement>,

@InjectRepository(Supplier)
private readonly supplierRepository: Repository<Supplier>,

@InjectRepository(PurchaseOrder)
private readonly purchaseOrderRepository: Repository<PurchaseOrder>,

@InjectRepository(Customer)
private readonly customerRepository: Repository<Customer>,

@InjectRepository(CustomerPayment)
private readonly customerPaymentRepository: Repository<CustomerPayment>,

@InjectRepository(GoodsReceivedNote)
private readonly grnRepository: Repository<GoodsReceivedNote>,

@InjectRepository(GrnItem)
private readonly grnItemRepository: Repository<GrnItem>,

@InjectRepository(FinanceTransaction)
private readonly financeTransactionRepository: Repository<FinanceTransaction>,

@InjectRepository(PurchaseInvoice)
private readonly purchaseInvoiceRepository: Repository<PurchaseInvoice>,
) {}

  // =========================================================
  // STEP 2 - DAILY SALES REPORT
  // =========================================================

  async getDailySalesReport(date?: string) {
    const reportDate = date || this.getTodayDate();

    this.validateDate(reportDate);

    // ---------------------------------------------------------
    // DATE RANGE
    // ---------------------------------------------------------
    //
    // Use [start, end) instead of BETWEEN so the complete
    // selected day is included without timestamp issues.
    //
    // Example:
    // 2026-09-01 00:00:00
    // to
    // 2026-09-02 00:00:00
    //
    // ---------------------------------------------------------

    const startDate = `${reportDate} 00:00:00`;

    const nextDate = this.getNextDate(reportDate);

    const endDate = `${nextDate} 00:00:00`;

    // ---------------------------------------------------------
    // GET SALES FOR THE DAY
    // ---------------------------------------------------------

    const sales = await this.posSaleRepository
      .createQueryBuilder('sale')
      .where('sale.createdAt >= :startDate', {
        startDate,
      })
      .andWhere('sale.createdAt < :endDate', {
        endDate,
      })
      .andWhere('sale.status != :cancelledStatus', {
        cancelledStatus: SaleStatus.CANCELLED,
      })
      .orderBy('sale.createdAt', 'DESC')
      .getMany();

    // ---------------------------------------------------------
    // GET RETURNS RELATED TO THESE SALES
    // ---------------------------------------------------------

    const saleIds = sales.map((sale) => sale.id);

    let returns: PosReturn[] = [];

    if (saleIds.length > 0) {
      returns = await this.posReturnRepository
        .createQueryBuilder('ret')
        .where('ret.posSaleId IN (:...saleIds)', {
          saleIds,
        })
        .getMany();
    }

    // ---------------------------------------------------------
    // GROUP RETURNS BY SALE ID
    // ---------------------------------------------------------

    const returnsBySaleId = new Map<string, number>();

    for (const ret of returns) {
      const currentAmount =
        returnsBySaleId.get(ret.posSaleId) ?? 0;

      returnsBySaleId.set(
        ret.posSaleId,
        currentAmount +
          Number(ret.totalReturnAmount || 0),
      );
    }

    // ---------------------------------------------------------
    // CALCULATE REPORT RECORDS
    // ---------------------------------------------------------

    let grossSales = 0;
    let totalDiscount = 0;
    let totalReturnAmount = 0;
    let netSales = 0;

    let completedInvoiceCount = 0;
    let partiallyReturnedInvoiceCount = 0;
    let returnedInvoiceCount = 0;

    const records = sales
      .map((sale) => {
        const grandTotal = Number(
          sale.grandTotal || 0,
        );

        const discountAmount = Number(
          sale.discountAmount || 0,
        );

        const returnAmount = Number(
          (returnsBySaleId.get(sale.id) ?? 0).toFixed(2),
        );

        let saleNetAmount = 0;

        // -----------------------------------------------------
        // COMPLETED
        // -----------------------------------------------------

        if (sale.status === SaleStatus.COMPLETED) {
          saleNetAmount = grandTotal;
          completedInvoiceCount++;
        }

        // -----------------------------------------------------
        // PARTIALLY RETURNED
        // -----------------------------------------------------

        else if (
          sale.status ===
          SaleStatus.PARTIALLY_RETURNED
        ) {
          saleNetAmount = Math.max(
            0,
            grandTotal - returnAmount,
          );

          partiallyReturnedInvoiceCount++;
        }

        // -----------------------------------------------------
        // FULLY RETURNED
        // -----------------------------------------------------
        //
        // Keep the record for transparency, but its net sale
        // value is zero.
        //
        // -----------------------------------------------------

        else if (
          sale.status === SaleStatus.RETURNED
        ) {
          saleNetAmount = 0;
          returnedInvoiceCount++;
        }

        // -----------------------------------------------------
        // OTHER / UNKNOWN STATUS
        // -----------------------------------------------------

        else {
          return null;
        }

        grossSales += grandTotal;
        totalDiscount += discountAmount;
        totalReturnAmount += returnAmount;
        netSales += saleNetAmount;

        return {
          id: sale.id,
          invoiceNumber: sale.invoiceNumber,
          saleDate: sale.createdAt,
          customerId: sale.customerId,
          customerName:
            sale.customerName ||
            'Walk-in Customer',
          subtotal: Number(
            sale.subtotal || 0,
          ),
          discountAmount,
          grandTotal,
          returnAmount,
          netAmount: Number(
            saleNetAmount.toFixed(2),
          ),
          status: sale.status,
        };
      })
      .filter(
        (
          record,
        ): record is NonNullable<typeof record> =>
          record !== null,
      );

    // ---------------------------------------------------------
    // ROUND SUMMARY VALUES
    // ---------------------------------------------------------

    grossSales = Number(
      grossSales.toFixed(2),
    );

    totalDiscount = Number(
      totalDiscount.toFixed(2),
    );

    totalReturnAmount = Number(
      totalReturnAmount.toFixed(2),
    );

    netSales = Number(
      netSales.toFixed(2),
    );

    // ---------------------------------------------------------
    // RETURN REPORT
    // ---------------------------------------------------------

    return {
      report: 'Daily Sales',
      date: reportDate,

      summary: {
        invoiceCount: records.length,

        completedInvoiceCount,

        partiallyReturnedInvoiceCount,

        returnedInvoiceCount,

        grossSales,

        totalDiscount,

        totalReturnAmount,

        netSales,
      },

      records,
    };
  }

async getMonthlySalesReport(
  year?: number,
  month?: number,
) {
  const currentDate = new Date();

  const reportYear =
    year ?? currentDate.getFullYear();

  const reportMonth =
    month ?? currentDate.getMonth() + 1;

  // ---------------------------------------------------------
  // VALIDATE YEAR
  // ---------------------------------------------------------

  if (
    !Number.isInteger(reportYear) ||
    reportYear < 2000 ||
    reportYear > 2100
  ) {
    throw new BadRequestException(
      'year must be between 2000 and 2100',
    );
  }

  // ---------------------------------------------------------
  // VALIDATE MONTH
  // ---------------------------------------------------------

  if (
    !Number.isInteger(reportMonth) ||
    reportMonth < 1 ||
    reportMonth > 12
  ) {
    throw new BadRequestException(
      'month must be between 1 and 12',
    );
  }

  // ---------------------------------------------------------
  // DATE RANGE
  // ---------------------------------------------------------

  const startDate = new Date(
    reportYear,
    reportMonth - 1,
    1,
    0,
    0,
    0,
    0,
  );

  const endDate = new Date(
    reportYear,
    reportMonth,
    1,
    0,
    0,
    0,
    0,
  );

  // ---------------------------------------------------------
  // GET SALES
  // ---------------------------------------------------------

  const sales = await this.posSaleRepository
    .createQueryBuilder('sale')
    .where('sale.createdAt >= :startDate', {
      startDate,
    })
    .andWhere('sale.createdAt < :endDate', {
      endDate,
    })
    .andWhere('sale.status != :cancelledStatus', {
      cancelledStatus: SaleStatus.CANCELLED,
    })
    .orderBy('sale.createdAt', 'ASC')
    .getMany();

  // ---------------------------------------------------------
  // GET RETURNS
  // ---------------------------------------------------------

  const saleIds = sales.map(
    (sale) => sale.id,
  );

  let returns: PosReturn[] = [];

  if (saleIds.length > 0) {
    returns = await this.posReturnRepository
      .createQueryBuilder('ret')
      .where('ret.posSaleId IN (:...saleIds)', {
        saleIds,
      })
      .getMany();
  }

  // ---------------------------------------------------------
  // GROUP RETURNS BY SALE
  // ---------------------------------------------------------

  const returnsBySaleId =
    new Map<string, number>();

  for (const ret of returns) {
    const currentAmount =
      returnsBySaleId.get(ret.posSaleId) ?? 0;

    returnsBySaleId.set(
      ret.posSaleId,
      currentAmount +
        Number(
          ret.totalReturnAmount || 0,
        ),
    );
  }

  // ---------------------------------------------------------
  // MONTHLY TOTALS
  // ---------------------------------------------------------

  let grossSales = 0;
  let totalDiscount = 0;
  let totalReturnAmount = 0;
  let netSales = 0;

  let completedInvoiceCount = 0;
  let partiallyReturnedInvoiceCount = 0;
  let returnedInvoiceCount = 0;

  // ---------------------------------------------------------
  // DAY-WISE BREAKDOWN
  // ---------------------------------------------------------

  const dailyMap = new Map<
    string,
    {
      invoiceCount: number;
      grossSales: number;
      discountAmount: number;
      returnAmount: number;
      netSales: number;
    }
  >();

  for (const sale of sales) {
    const grandTotal = Number(
      sale.grandTotal || 0,
    );

    const discountAmount = Number(
      sale.discountAmount || 0,
    );

    const returnAmount = Number(
      (
        returnsBySaleId.get(sale.id) ?? 0
      ).toFixed(2),
    );

    let saleNetAmount = 0;

    // -------------------------------------------------------
    // SALE STATUS
    // -------------------------------------------------------

    if (
      sale.status === SaleStatus.COMPLETED
    ) {
      saleNetAmount = grandTotal;
      completedInvoiceCount++;
    } else if (
      sale.status ===
      SaleStatus.PARTIALLY_RETURNED
    ) {
      saleNetAmount = Math.max(
        0,
        grandTotal - returnAmount,
      );

      partiallyReturnedInvoiceCount++;
    } else if (
      sale.status === SaleStatus.RETURNED
    ) {
      saleNetAmount = 0;
      returnedInvoiceCount++;
    } else {
      continue;
    }

    // -------------------------------------------------------
    // MONTHLY TOTALS
    // -------------------------------------------------------

    grossSales += grandTotal;
    totalDiscount += discountAmount;
    totalReturnAmount += returnAmount;
    netSales += saleNetAmount;

    // -------------------------------------------------------
    // DAY KEY
    // -------------------------------------------------------

    const dayKey =
      sale.createdAt
        .toISOString()
        .slice(0, 10);

    const existing =
      dailyMap.get(dayKey) ?? {
        invoiceCount: 0,
        grossSales: 0,
        discountAmount: 0,
        returnAmount: 0,
        netSales: 0,
      };

    existing.invoiceCount += 1;
    existing.grossSales += grandTotal;
    existing.discountAmount +=
      discountAmount;
    existing.returnAmount += returnAmount;
    existing.netSales += saleNetAmount;

    dailyMap.set(
      dayKey,
      existing,
    );
  }

  // ---------------------------------------------------------
  // ROUND DAILY DATA
  // ---------------------------------------------------------

  const dailyBreakdown = Array.from(
    dailyMap.entries(),
  ).map(
    ([date, data]) => ({
      date,

      invoiceCount:
        data.invoiceCount,

      grossSales: Number(
        data.grossSales.toFixed(2),
      ),

      discountAmount: Number(
        data.discountAmount.toFixed(2),
      ),

      returnAmount: Number(
        data.returnAmount.toFixed(2),
      ),

      netSales: Number(
        data.netSales.toFixed(2),
      ),
    }),
  );

  // ---------------------------------------------------------
  // RETURN REPORT
  // ---------------------------------------------------------

  return {
    report: 'Monthly Sales',

    year: reportYear,

    month: reportMonth,

    summary: {
      invoiceCount: sales.filter(
        (sale) =>
          sale.status !==
          SaleStatus.CANCELLED,
      ).length,

      completedInvoiceCount,

      partiallyReturnedInvoiceCount,

      returnedInvoiceCount,

      grossSales: Number(
        grossSales.toFixed(2),
      ),

      totalDiscount: Number(
        totalDiscount.toFixed(2),
      ),

      totalReturnAmount: Number(
        totalReturnAmount.toFixed(2),
      ),

      netSales: Number(
        netSales.toFixed(2),
      ),
    },

    dailyBreakdown,
  };
}

async getAnnualSalesReport(year?: number) {
  const currentDate = new Date();

  const reportYear =
    year ?? currentDate.getFullYear();

  // ---------------------------------------------------------
  // VALIDATE YEAR
  // ---------------------------------------------------------

  if (
    !Number.isInteger(reportYear) ||
    reportYear < 2000 ||
    reportYear > 2100
  ) {
    throw new BadRequestException(
      'year must be between 2000 and 2100',
    );
  }

  // ---------------------------------------------------------
  // DATE RANGE
  // ---------------------------------------------------------

  const startDate = new Date(
    reportYear,
    0,
    1,
    0,
    0,
    0,
    0,
  );

  const endDate = new Date(
    reportYear + 1,
    0,
    1,
    0,
    0,
    0,
    0,
  );

  // ---------------------------------------------------------
  // GET SALES
  // ---------------------------------------------------------

  const sales = await this.posSaleRepository
    .createQueryBuilder('sale')
    .where('sale.createdAt >= :startDate', {
      startDate,
    })
    .andWhere('sale.createdAt < :endDate', {
      endDate,
    })
    .andWhere('sale.status != :cancelledStatus', {
      cancelledStatus: SaleStatus.CANCELLED,
    })
    .orderBy('sale.createdAt', 'ASC')
    .getMany();

  // ---------------------------------------------------------
  // GET RETURNS
  // ---------------------------------------------------------

  const saleIds = sales.map(
    (sale) => sale.id,
  );

  let returns: PosReturn[] = [];

  if (saleIds.length > 0) {
    returns = await this.posReturnRepository
      .createQueryBuilder('ret')
      .where('ret.posSaleId IN (:...saleIds)', {
        saleIds,
      })
      .getMany();
  }

  // ---------------------------------------------------------
  // GROUP RETURNS BY SALE
  // ---------------------------------------------------------

  const returnsBySaleId =
    new Map<string, number>();

  for (const ret of returns) {
    const currentAmount =
      returnsBySaleId.get(ret.posSaleId) ?? 0;

    returnsBySaleId.set(
      ret.posSaleId,
      currentAmount +
        Number(
          ret.totalReturnAmount || 0,
        ),
    );
  }

  // ---------------------------------------------------------
  // YEARLY TOTALS
  // ---------------------------------------------------------

  let grossSales = 0;
  let totalDiscount = 0;
  let totalReturnAmount = 0;
  let netSales = 0;

  let completedInvoiceCount = 0;
  let partiallyReturnedInvoiceCount = 0;
  let returnedInvoiceCount = 0;

  // ---------------------------------------------------------
  // MONTH-WISE DATA
  // ---------------------------------------------------------

  const monthlyData = Array.from(
    { length: 12 },
    (_, index) => ({
      month: index + 1,
      invoiceCount: 0,
      grossSales: 0,
      discountAmount: 0,
      returnAmount: 0,
      netSales: 0,
    }),
  );

  // ---------------------------------------------------------
  // PROCESS SALES
  // ---------------------------------------------------------

  for (const sale of sales) {
    const grandTotal = Number(
      sale.grandTotal || 0,
    );

    const discountAmount = Number(
      sale.discountAmount || 0,
    );

    const returnAmount = Number(
      (
        returnsBySaleId.get(sale.id) ?? 0
      ).toFixed(2),
    );

    let saleNetAmount = 0;

    // -------------------------------------------------------
    // COMPLETED
    // -------------------------------------------------------

    if (
      sale.status === SaleStatus.COMPLETED
    ) {
      saleNetAmount = grandTotal;
      completedInvoiceCount++;
    }

    // -------------------------------------------------------
    // PARTIALLY RETURNED
    // -------------------------------------------------------

    else if (
      sale.status ===
      SaleStatus.PARTIALLY_RETURNED
    ) {
      saleNetAmount = Math.max(
        0,
        grandTotal - returnAmount,
      );

      partiallyReturnedInvoiceCount++;
    }

    // -------------------------------------------------------
    // RETURNED
    // -------------------------------------------------------

    else if (
      sale.status === SaleStatus.RETURNED
    ) {
      saleNetAmount = 0;
      returnedInvoiceCount++;
    }

    else {
      continue;
    }

    // -------------------------------------------------------
    // YEAR TOTALS
    // -------------------------------------------------------

    grossSales += grandTotal;
    totalDiscount += discountAmount;
    totalReturnAmount += returnAmount;
    netSales += saleNetAmount;

    // -------------------------------------------------------
    // MONTH INDEX
    // -------------------------------------------------------

    const monthIndex =
      sale.createdAt.getMonth();

    const monthly =
      monthlyData[monthIndex];

    monthly.invoiceCount += 1;
    monthly.grossSales += grandTotal;
    monthly.discountAmount +=
      discountAmount;
    monthly.returnAmount +=
      returnAmount;
    monthly.netSales +=
      saleNetAmount;
  }

  // ---------------------------------------------------------
  // ROUND MONTHLY DATA
  // ---------------------------------------------------------

  const monthlyBreakdown =
    monthlyData.map((month) => ({
      month: month.month,

      invoiceCount:
        month.invoiceCount,

      grossSales: Number(
        month.grossSales.toFixed(2),
      ),

      discountAmount: Number(
        month.discountAmount.toFixed(2),
      ),

      returnAmount: Number(
        month.returnAmount.toFixed(2),
      ),

      netSales: Number(
        month.netSales.toFixed(2),
      ),
    }));

  // ---------------------------------------------------------
  // RETURN REPORT
  // ---------------------------------------------------------

  return {
    report: 'Annual Sales',

    year: reportYear,

    summary: {
      invoiceCount: sales.filter(
        (sale) =>
          sale.status !==
          SaleStatus.CANCELLED,
      ).length,

      completedInvoiceCount,

      partiallyReturnedInvoiceCount,

      returnedInvoiceCount,

      grossSales: Number(
        grossSales.toFixed(2),
      ),

      totalDiscount: Number(
        totalDiscount.toFixed(2),
      ),

      totalReturnAmount: Number(
        totalReturnAmount.toFixed(2),
      ),

      netSales: Number(
        netSales.toFixed(2),
      ),
    },

    monthlyBreakdown,
  };
}

  // =========================================================
  // GET TODAY
  // =========================================================

  private getTodayDate(): string {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1,
    ).padStart(2, '0');

    const day = String(
      now.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // VALIDATE DATE
  // =========================================================

  private validateDate(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        'date must be in YYYY-MM-DD format',
      );
    }

    const parsedDate = new Date(
      `${date}T00:00:00`,
    );

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Invalid date',
      );
    }

    const normalizedDate =
      `${parsedDate.getFullYear()}-${String(
        parsedDate.getMonth() + 1,
      ).padStart(2, '0')}-${String(
        parsedDate.getDate(),
      ).padStart(2, '0')}`;

    if (normalizedDate !== date) {
      throw new BadRequestException(
        'Invalid date',
      );
    }
  }

  // =========================================================
  // GET NEXT DATE
  // =========================================================

  private getNextDate(date: string): string {
    const parsedDate = new Date(
      `${date}T00:00:00`,
    );

    parsedDate.setDate(
      parsedDate.getDate() + 1,
    );

    const year =
      parsedDate.getFullYear();

    const month = String(
      parsedDate.getMonth() + 1,
    ).padStart(2, '0');

    const day = String(
      parsedDate.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
// =========================================================
// 5. CATEGORY-WISE SALES
// =========================================================

async getCategoryWiseSales(query?: ReportQueryDto) {
  const sales = await this.getSalesWithItems(query);

  const categoryMap = new Map<
    string,
    {
      categoryId: string | null;
      category: string;
      quantitySold: number;
      grossSales: number;
      discount: number;
      returnAmount: number;
      netSales: number;
      cost: number;
      profit: number;
    }
  >();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      const product = await this.productRepository.findOne({
        where: {
          id: item.productId,
        },
        relations: {
          category: true,
        },
      });

      if (!product) {
        continue;
      }

      const category = (product as any).category;

      const categoryId = category?.id
        ? String(category.id)
        : null;

      const categoryName =
        category?.name ||
        category?.categoryName ||
        'Uncategorized';

      const key = categoryId || categoryName;

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          categoryId,
          category: categoryName,
          quantitySold: 0,
          grossSales: 0,
          discount: 0,
          returnAmount: 0,
          netSales: 0,
          cost: 0,
          profit: 0,
        });
      }

      const record = categoryMap.get(key)!;

      const quantity = Number(
        item.quantity || 0,
      );

      const grossSales = Number(
        item.lineTotal ??
          Number(item.unitPrice || 0) *
            quantity,
      );

      const purchasePrice = Number(
        (product as any).purchasePrice || 0,
      );

      const cost = purchasePrice * quantity;

      record.quantitySold += quantity;
      record.grossSales += grossSales;
      record.netSales += grossSales;
      record.cost += cost;
      record.profit += grossSales - cost;
    }
  }

  const records = Array.from(
    categoryMap.values(),
  )
    .map((item) => ({
      categoryId: item.categoryId,

      category: item.category,

      quantitySold: item.quantitySold,

      grossSales: Number(
        item.grossSales.toFixed(2),
      ),

      discount: Number(
        item.discount.toFixed(2),
      ),

      returnAmount: Number(
        item.returnAmount.toFixed(2),
      ),

      netSales: Number(
        item.netSales.toFixed(2),
      ),

      cost: Number(
        item.cost.toFixed(2),
      ),

      profit: Number(
        item.profit.toFixed(2),
      ),

      margin:
        item.netSales > 0
          ? Number(
              (
                (item.profit /
                  item.netSales) *
                100
              ).toFixed(2),
            )
          : 0,
    }))
    .sort(
      (a, b) =>
        b.netSales - a.netSales,
    );

  return {
    report: 'Category-wise Sales',

    period: {
      startDate:
        query?.startDate || null,
      endDate:
        query?.endDate || null,
    },

    summary: {
      totalCategories:
        records.length,

      totalItemsSold:
        records.reduce(
          (sum, item) =>
            sum + item.quantitySold,
          0,
        ),

      totalSales: Number(
        records
          .reduce(
            (sum, item) =>
              sum + item.netSales,
            0,
          )
          .toFixed(2),
      ),

      totalProfit: Number(
        records
          .reduce(
            (sum, item) =>
              sum + item.profit,
            0,
          )
          .toFixed(2),
      ),
    },

    records,
  };
}

// =========================================================
// 6. PRODUCT-WISE SALES
// =========================================================

async getProductWiseSales(
  query?: ReportQueryDto,
) {
  const sales =
    await this.getSalesWithItems(query);

  const productMap = new Map<
    string,
    {
      productId: string;
      productCode: string;
      productName: string;
      quantitySold: number;
      grossSales: number;
      discount: number;
      returnAmount: number;
      netSales: number;
      cost: number;
      profit: number;
    }
  >();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      const product =
        await this.productRepository.findOne({
          where: {
            id: item.productId,
          },
        });

      if (!product) {
        continue;
      }

      const productId =
        String(product.id);

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,

          productCode: String(
            (product as any).productCode ||
              '',
          ),

          productName: String(
            (product as any).productName ||
              item.productName ||
              '',
          ),

          quantitySold: 0,
          grossSales: 0,
          discount: 0,
          returnAmount: 0,
          netSales: 0,
          cost: 0,
          profit: 0,
        });
      }

      const record =
        productMap.get(productId)!;

      const quantity = Number(
        item.quantity || 0,
      );

      const salesAmount = Number(
        item.lineTotal ??
          Number(item.unitPrice || 0) *
            quantity,
      );

      const purchasePrice = Number(
        (product as any).purchasePrice || 0,
      );

      const cost =
        purchasePrice * quantity;

      record.quantitySold += quantity;

      record.grossSales +=
        salesAmount;

      record.netSales +=
        salesAmount;

      record.cost += cost;

      record.profit +=
        salesAmount - cost;
    }
  }

  const records = Array.from(
    productMap.values(),
  )
    .map((item) => ({
      productId:
        item.productId,

      productCode:
        item.productCode,

      productName:
        item.productName,

      quantitySold:
        item.quantitySold,

      grossSales:
        Number(
          item.grossSales.toFixed(2),
        ),

      discount:
        Number(
          item.discount.toFixed(2),
        ),

      returnAmount:
        Number(
          item.returnAmount.toFixed(2),
        ),

      netSales:
        Number(
          item.netSales.toFixed(2),
        ),

      cost:
        Number(
          item.cost.toFixed(2),
        ),

      profit:
        Number(
          item.profit.toFixed(2),
        ),
    }))
    .sort(
      (a, b) =>
        b.netSales - a.netSales,
    );

  return {
    report:
      'Product-wise Sales',

    period: {
      startDate:
        query?.startDate || null,
      endDate:
        query?.endDate || null,
    },

    summary: {
      totalProducts:
        records.length,

      totalQtySold:
        records.reduce(
          (sum, item) =>
            sum + item.quantitySold,
          0,
        ),

      totalSales:
        Number(
          records
            .reduce(
              (sum, item) =>
                sum + item.netSales,
              0,
            )
            .toFixed(2),
        ),

      totalProfit:
        Number(
          records
            .reduce(
              (sum, item) =>
                sum + item.profit,
              0,
            )
            .toFixed(2),
        ),
    },

    records,
  };
}


// =========================================================
// 7. PROFIT ANALYSIS
// =========================================================

async getProfitAnalysis(
  query?: ReportQueryDto,
) {
  const sales =
    await this.getSalesWithItems(query);

  const productMap = new Map<
    string,
    {
      productId: string;
      product: string;
      quantitySold: number;
      salesAmount: number;
      costAmount: number;
      grossProfit: number;
    }
  >();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      const product =
        await this.productRepository.findOne({
          where: {
            id: item.productId,
          },
        });

      if (!product) {
        continue;
      }

      const productId =
        String(product.id);

      const productName =
        String(
          (product as any).productName ||
            item.productName ||
            '',
        );

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          product: productName,
          quantitySold: 0,
          salesAmount: 0,
          costAmount: 0,
          grossProfit: 0,
        });
      }

      const record =
        productMap.get(productId)!;

      const quantity =
        Number(item.quantity || 0);

      const salesAmount =
        Number(
          item.lineTotal ??
            Number(item.unitPrice || 0) *
              quantity,
        );

      const purchasePrice =
        Number(
          (product as any)
            .purchasePrice || 0,
        );

      const costAmount =
        purchasePrice * quantity;

      const grossProfit =
        salesAmount - costAmount;

      record.quantitySold +=
        quantity;

      record.salesAmount +=
        salesAmount;

      record.costAmount +=
        costAmount;

      record.grossProfit +=
        grossProfit;
    }
  }

  const records =
    Array.from(
      productMap.values(),
    )
      .map((item) => ({
        productId:
          item.productId,

        product:
          item.product,

        quantitySold:
          item.quantitySold,

        salesAmount:
          Number(
            item.salesAmount.toFixed(2),
          ),

        costAmount:
          Number(
            item.costAmount.toFixed(2),
          ),

        grossProfit:
          Number(
            item.grossProfit.toFixed(2),
          ),

        profitMargin:
          item.salesAmount > 0
            ? Number(
                (
                  (item.grossProfit /
                    item.salesAmount) *
                  100
                ).toFixed(2),
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.grossProfit -
          a.grossProfit,
      );

  const totalRevenue =
    records.reduce(
      (sum, item) =>
        sum + item.salesAmount,
      0,
    );

  const totalCost =
    records.reduce(
      (sum, item) =>
        sum + item.costAmount,
      0,
    );

  const totalProfit =
    records.reduce(
      (sum, item) =>
        sum + item.grossProfit,
      0,
    );

  return {
    report:
      'Profit Analysis',

    period: {
      startDate:
        query?.startDate || null,
      endDate:
        query?.endDate || null,
    },

    summary: {
      totalRevenue:
        Number(
          totalRevenue.toFixed(2),
        ),

      costOfGoodsSold:
        Number(
          totalCost.toFixed(2),
        ),

      grossProfit:
        Number(
          totalProfit.toFixed(2),
        ),

      grossMargin:
        totalRevenue > 0
          ? Number(
              (
                (totalProfit /
                  totalRevenue) *
                100
              ).toFixed(2),
            )
          : 0,
    },

    records,
  };
}

// =========================================================
// 8. BEST-SELLING PRODUCTS
// =========================================================

async getBestSellingProducts(
  query?: ReportQueryDto,
) {
  const result =
    await this.getProductWiseSales(query);

  const limit = query?.limit || 10;

  const records = result.records
  .slice(0, limit)
  .map((item, index) => ({
    rank: index + 1,
    productId: item.productId,
    productCode: item.productCode,
    productName: item.productName,
    qtySold: item.quantitySold,
    revenue: item.netSales,
    profit: item.profit,
  }));

  return {
    report: 'Best-selling Products',

    period: {
      startDate:
        query?.startDate || null,

      endDate:
        query?.endDate || null,
    },

    summary: {
      totalProducts:
        result.records.length,

      topProducts:
        records.length,
    },

    records,
  };
}

// =========================================================
// 8. SLOW-MOVING PRODUCTS
// =========================================================

async getSlowMovingProducts(
  query?: ReportQueryDto,
) {
  const days = query?.days || 30;

  const endDate = query?.endDate
    ? new Date(query.endDate)
    : new Date();

  const startDate = query?.startDate
    ? new Date(query.startDate)
    : new Date(
        endDate.getTime() -
          days * 24 * 60 * 60 * 1000,
      );

  const products =
    await this.productRepository.find();

  const sales = await this.getSalesBetweenDates(
    startDate,
    endDate,
  );

  const soldMap = new Map<
    string,
    {
      qtySold: number;
      lastSoldDate: Date | null;
    }
  >();

  for (const sale of sales) {
    for (const item of sale.items || []) {
      const productId =
        String(item.productId);

      const existing =
        soldMap.get(productId) || {
          qtySold: 0,
          lastSoldDate: null,
        };

      existing.qtySold += Number(
        item.quantity || 0,
      );

      const saleDate = new Date(
        sale.createdAt,
      );

      if (
        !existing.lastSoldDate ||
        saleDate >
          existing.lastSoldDate
      ) {
        existing.lastSoldDate =
          saleDate;
      }

      soldMap.set(
        productId,
        existing,
      );
    }
  }

  const records = products
    .map((product) => {
      const productId =
        String(product.id);

      const sold =
        soldMap.get(productId);

      const stock = Number(
        product.stockQuantity || 0,
      );

      const qtySold =
        sold?.qtySold || 0;

      return {
        productId,
        productCode: String(
          (product as unknown as {
            productCode?: string;
          }).productCode || '',
        ),
        productName: String(
          (product as unknown as {
            productName?: string;
          }).productName || '',
        ),
        currentStock: stock,
        qtySold,
        lastSoldDate:
          sold?.lastSoldDate
            ? sold.lastSoldDate
                .toISOString()
                .slice(0, 10)
            : null,
      };
    })
    .filter(
      (item) =>
        item.currentStock > 0 &&
        item.qtySold <= 5,
    )
    .sort(
      (a, b) =>
        a.qtySold -
        b.qtySold,
    );

  return {
    report: 'Slow-moving Products',

    period: {
      startDate:
        startDate
          .toISOString()
          .slice(0, 10),
      endDate:
        endDate
          .toISOString()
          .slice(0, 10),
    },

    criteria: {
      days,
      maximumQtySold: 5,
    },

    summary: {
      totalSlowMovingProducts:
        records.length,
    },

    records,
  };
}


// =========================================================
// 9. DEAD STOCK
// =========================================================

async getDeadStock(
  query?: ReportQueryDto,
) {
  const days = query?.days || 90;

  const endDate = query?.endDate
    ? new Date(query.endDate)
    : new Date();

  const cutoffDate =
    new Date(
      endDate.getTime() -
        days *
          24 *
          60 *
          60 *
          1000,
    );

  const products =
    await this.productRepository.find();

  const sales =
    await this.getSalesBetweenDates(
      new Date(2000, 0, 1),
      endDate,
    );

  const lastSaleMap =
    new Map<
      string,
      Date
    >();

  for (const sale of sales) {
    const saleDate =
      new Date(
        sale.createdAt,
      );

    for (
      const item of sale.items || []
    ) {
      const productId =
        String(item.productId);

      const existing =
        lastSaleMap.get(
          productId,
        );

      if (
        !existing ||
        saleDate > existing
      ) {
        lastSaleMap.set(
          productId,
          saleDate,
        );
      }
    }
  }

  const records = products
    .map((product) => {
      const productId =
        String(product.id);

      const stock =
        Number(
          product.stockQuantity || 0,
        );

      const purchasePrice =
        Number(
          (product as unknown as {
            purchasePrice?: number;
          }).purchasePrice || 0,
        );

      const lastSale =
        lastSaleMap.get(
          productId,
        ) || null;

      const deadDays =
        lastSale
          ? Math.floor(
              (
                endDate.getTime() -
                lastSale.getTime()
              ) /
                (24 *
                  60 *
                  60 *
                  1000),
            )
          : null;

      const stockValue =
        stock *
        purchasePrice;

      return {
        productId,
        productCode: String(
          (product as unknown as {
            productCode?: string;
          }).productCode || '',
        ),
        productName: String(
          (product as unknown as {
            productName?: string;
          }).productName || '',
        ),
        currentStock: stock,
        purchasePrice,
        stockValue: Number(
          stockValue.toFixed(2),
        ),
        lastSaleDate:
          lastSale
            ? lastSale
                .toISOString()
                .slice(0, 10)
            : null,
        daysSinceLastSale:
          deadDays,
      };
    })
    .filter(
      (item) =>
        item.currentStock > 0 &&
        (
          item.lastSaleDate === null ||
          (item.daysSinceLastSale !== null &&
            item.daysSinceLastSale >= days)
        ),
    )
    .sort(
      (a, b) =>
        b.stockValue -
        a.stockValue,
    );

  return {
    report: 'Dead Stock',

    period: {
      endDate:
        endDate
          .toISOString()
          .slice(0, 10),
    },

    criteria: {
      minimumDaysWithoutSale:
        days,
    },

    summary: {
      totalDeadStockProducts:
        records.length,

      totalDeadStockUnits:
        records.reduce(
          (sum, item) =>
            sum +
            item.currentStock,
          0,
        ),

      totalDeadStockValue:
        Number(
          records
            .reduce(
              (sum, item) =>
                sum +
                item.stockValue,
              0,
            )
            .toFixed(2),
        ),
    },

    records,
  };
}


// =========================================================
// HELPER
// =========================================================

private async getSalesWithItems(
  query?: ReportQueryDto,
) {
  const qb =
    this.posSaleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect(
        'sale.items',
        'items',
      )
      .where(
        'sale.status NOT IN (:...statuses)',
        {
          statuses: [
            'CANCELLED',
          ],
        },
      );

  if (query?.startDate) {
    qb.andWhere(
      'sale.createdAt >= :startDate',
      {
        startDate:
          `${query.startDate} 00:00:00`,
      },
    );
  }

  if (query?.endDate) {
    qb.andWhere(
      'sale.createdAt <= :endDate',
      {
        endDate:
          `${query.endDate} 23:59:59`,
      },
    );
  }

  qb.orderBy(
    'sale.createdAt',
    'DESC',
  );

  return qb.getMany();
}


// =========================================================
// HELPER - SALES BETWEEN DATES
// =========================================================

private async getSalesBetweenDates(
  startDate: Date,
  endDate: Date,
) {
  const endExclusive =
    new Date(endDate);

  endExclusive.setDate(
    endExclusive.getDate() + 1,
  );

  return this.posSaleRepository
    .createQueryBuilder('sale')
    .leftJoinAndSelect(
      'sale.items',
      'items',
    )
    .where(
      'sale.status NOT IN (:...statuses)',
      {
        statuses: [
          SaleStatus.CANCELLED,
        ],
      },
    )
    .andWhere(
      'sale.createdAt >= :startDate',
      {
        startDate,
      },
    )
    .andWhere(
      'sale.createdAt < :endDate',
      {
        endDate: endExclusive,
      },
    )
    .orderBy(
      'sale.createdAt',
      'DESC',
    )
    .getMany();
}

// =========================================================
// 10. INVENTORY / STOCK REPORT
// =========================================================

async getInventoryStockReport() {
  const products = await this.productRepository.find({
    relations: {
      category: true,
      subcategory: true,
    },
    order: {
      productName: 'ASC',
    },
  });

  const records = products.map((product) => {
    const stock = Number(product.stockQuantity || 0);
    const reorderLevel = Number(product.reorderLevel || 0);

    let status = 'IN_STOCK';

    if (stock === 0) {
      status = 'OUT_OF_STOCK';
    } else if (
      reorderLevel > 0 &&
      stock <= reorderLevel
    ) {
      status = 'LOW_STOCK';
    }

    return {
      productId: product.id,
      productCode: product.productCode,
      barcode: product.barcode || null,
      isbn: product.isbn || null,
      productName: product.productName,
      category: product.category?.name || null,
      subcategory: product.subcategory?.name || null,
      currentStock: stock,
      reorderLevel,
      purchasePrice: Number(product.purchasePrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
      stockValue: Number(
        (
          stock * Number(product.purchasePrice || 0)
        ).toFixed(2),
      ),
      status,
    };
  });

  return {
    report: 'Inventory / Stock Report',

    summary: {
      totalProducts: records.length,

      totalStockQuantity: records.reduce(
        (sum, item) => sum + item.currentStock,
        0,
      ),

      totalStockValue: Number(
        records
          .reduce(
            (sum, item) => sum + item.stockValue,
            0,
          )
          .toFixed(2),
      ),

      lowStockProducts: records.filter(
        (item) => item.status === 'LOW_STOCK',
      ).length,

      outOfStockProducts: records.filter(
        (item) => item.status === 'OUT_OF_STOCK',
      ).length,
    },

    records,
  };
}

// 11. STOCK MOVEMENT REPORT

async getStockMovementReport(
  query?: ReportQueryDto,
) {
  const qb =
    this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect(
        'movement.product',
        'product',
      )
      .leftJoinAndSelect(
        'movement.fromLocation',
        'fromLocation',
      )
      .leftJoinAndSelect(
        'movement.toLocation',
        'toLocation',
      );

  if (query?.startDate) {
    qb.andWhere(
      'movement.createdAt >= :startDate',
      {
        startDate: `${query.startDate} 00:00:00`,
      },
    );
  }

  if (query?.endDate) {
    qb.andWhere(
      'movement.createdAt < :endDate',
      {
        endDate: `${query.endDate} 23:59:59`,
      },
    );
  }

  qb.orderBy(
    'movement.createdAt',
    'DESC',
  );

  const movements =
    await qb.getMany();

  const records = movements.map(
    (movement) => ({
      id: movement.id,

      date: movement.createdAt
        ? movement.createdAt
            .toISOString()
            .slice(0, 10)
        : null,

      time: movement.createdAt
        ? movement.createdAt
            .toISOString()
            .slice(11, 19)
        : null,

      productId: movement.product?.id || null,

      productCode:
        movement.product?.productCode || '',

      productName:
        movement.product?.productName || '',

      movementType:
        movement.movementType,

      quantity:
        Number(movement.quantity || 0),

      previousStock:
        Number(movement.previousStock || 0),

      newStock:
        Number(movement.newStock || 0),

      fromLocation:
        movement.fromLocation?.name || null,

      toLocation:
        movement.toLocation?.name || null,

      reason:
        movement.reason || null,

      userId:
        movement.userId || null,
    }),
  );

  const totalIn = records
    .filter((item) =>
      [
        MovementType.IN,
        MovementType.TRANSFER_IN,
        MovementType.ADJUSTMENT_IN,
      ].includes(item.movementType),
    )
    .reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

  const totalOut = records
    .filter((item) =>
      [
        MovementType.OUT,
        MovementType.TRANSFER_OUT,
        MovementType.ADJUSTMENT_OUT,
        MovementType.DAMAGED,
        MovementType.LOST,
      ].includes(item.movementType),
    )
    .reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

  return {
    report: 'Stock Movement Report',

    period: {
      startDate: query?.startDate || null,
      endDate: query?.endDate || null,
    },

    summary: {
      totalMovements: records.length,
      totalIn,
      totalOut,
      netMovement: totalIn - totalOut,
    },

    records,
  };
}


// =========================================================
// 12. STOCK VALUATION REPORT
// =========================================================

async getStockValuationReport() {
  const products =
    await this.productRepository.find({
      relations: {
        category: true,
      },
      order: {
        productName: 'ASC',
      },
    });

  const records = products.map(
    (product) => {
      const quantity =
        Number(
          product.stockQuantity || 0,
        );

      const purchasePrice =
        Number(
          product.purchasePrice || 0,
        );

      const sellingPrice =
        Number(
          product.sellingPrice || 0,
        );

      return {
        productId: product.id,
        productCode:
          product.productCode,
        productName:
          product.productName,

        category:
          product.category?.name ||
          null,

        quantity,

        purchasePrice,

        sellingPrice,

        purchaseValue:
          Number(
            (
              quantity *
              purchasePrice
            ).toFixed(2),
          ),

        sellingValue:
          Number(
            (
              quantity *
              sellingPrice
            ).toFixed(2),
          ),

        potentialProfit:
          Number(
            (
              quantity *
              (sellingPrice -
                purchasePrice)
            ).toFixed(2),
          ),
      };
    },
  );

  return {
    report: 'Stock Valuation Report',

    summary: {
      totalProducts:
        records.length,

      totalQuantity:
        records.reduce(
          (sum, item) =>
            sum + item.quantity,
          0,
        ),

      totalPurchaseValue:
        Number(
          records
            .reduce(
              (sum, item) =>
                sum +
                item.purchaseValue,
              0,
            )
            .toFixed(2),
        ),

      totalSellingValue:
        Number(
          records
            .reduce(
              (sum, item) =>
                sum +
                item.sellingValue,
              0,
            )
            .toFixed(2),
        ),

      potentialProfit:
        Number(
          records
            .reduce(
              (sum, item) =>
                sum +
                item.potentialProfit,
              0,
            )
            .toFixed(2),
        ),
    },

    records,
  };
}


// =========================================================
// 13. LOW STOCK REPORT
// =========================================================

async getLowStockReport() {
  const products =
    await this.productRepository.find({
      relations: {
        category: true,
      },
      order: {
        stockQuantity: 'ASC',
      },
    });

  const records = products
    .filter((product) => {
      const stock =
        Number(
          product.stockQuantity || 0,
        );

      const reorderLevel =
        Number(
          product.reorderLevel || 0,
        );

      return (
        reorderLevel > 0 &&
        stock > 0 &&
        stock <= reorderLevel
      );
    })
    .map((product) => {
      const stock =
        Number(
          product.stockQuantity || 0,
        );

      const reorderLevel =
        Number(
          product.reorderLevel || 0,
        );

      return {
        productId: product.id,
        productCode:
          product.productCode,
        productName:
          product.productName,

        category:
          product.category?.name ||
          null,

        currentStock: stock,
        reorderLevel,

        shortage:
          Math.max(
            0,
            reorderLevel - stock,
          ),

        purchasePrice:
          Number(
            product.purchasePrice || 0,
          ),

        stockValue:
          Number(
            (
              stock *
              Number(
                product.purchasePrice ||
                  0,
              )
            ).toFixed(2),
          ),
      };
    });

  return {
    report: 'Low Stock Report',

    summary: {
      totalLowStockProducts:
        records.length,

      totalCurrentStock:
        records.reduce(
          (sum, item) =>
            sum + item.currentStock,
          0,
        ),

      totalShortage:
        records.reduce(
          (sum, item) =>
            sum + item.shortage,
          0,
        ),
    },

    records,
  };
}


// =========================================================
// 14. OUT OF STOCK REPORT
// =========================================================

async getOutOfStockReport() {
  const products =
    await this.productRepository.find({
      relations: {
        category: true,
      },
      order: {
        productName: 'ASC',
      },
    });

  const records = products
    .filter(
      (product) =>
        Number(
          product.stockQuantity || 0,
        ) === 0,
    )
    .map((product) => ({
      productId: product.id,

      productCode:
        product.productCode,

      productName:
        product.productName,

      category:
        product.category?.name ||
        null,

      reorderLevel:
        Number(
          product.reorderLevel || 0,
        ),

      purchasePrice:
        Number(
          product.purchasePrice || 0,
        ),

      sellingPrice:
        Number(
          product.sellingPrice || 0,
        ),

      status: 'OUT_OF_STOCK',
    }));

  return {
    report: 'Out-of-Stock Report',

    summary: {
      totalOutOfStockProducts:
        records.length,
    },

    records,
  };
}

// =========================================================
// 15. SUPPLIER REPORT
// =========================================================

async getSupplierReport(
  query?: ReportQueryDto,
) {
  const suppliers = await this.supplierRepository.find({
    order: {
      supplierName: 'ASC',
    },
  });

  const purchaseQb =
    this.purchaseOrderRepository
      .createQueryBuilder('purchaseOrder')
      .leftJoinAndSelect(
        'purchaseOrder.supplier',
        'supplier',
      );

  // -------------------------------------------------------
  // DATE FILTER
  // -------------------------------------------------------

  if (query?.startDate) {
    purchaseQb.andWhere(
      'purchaseOrder.poDate >= :startDate',
      {
        startDate: query.startDate,
      },
    );
  }

  if (query?.endDate) {
    const nextDate = this.getNextDate(
      query.endDate,
    );

    purchaseQb.andWhere(
      'purchaseOrder.poDate < :endDate',
      {
        endDate: nextDate,
      },
    );
  }

  // Cancelled purchase orders are not counted
  purchaseQb.andWhere(
    'purchaseOrder.status != :cancelled',
    {
      cancelled:
        PurchaseOrderStatus.CANCELLED,
    },
  );

  const purchaseOrders =
    await purchaseQb.getMany();

  // -------------------------------------------------------
  // GROUP PURCHASE ORDERS BY SUPPLIER
  // -------------------------------------------------------

  const purchaseMap =
    new Map<
      number,
      {
        totalOrders: number;
        totalAmount: number;
        draftOrders: number;
        pendingOrders: number;
        approvedOrders: number;
        partiallyReceivedOrders: number;
        receivedOrders: number;
      }
    >();

  for (const order of purchaseOrders) {
    const supplierId =
      Number(order.supplierId);

    if (!purchaseMap.has(supplierId)) {
      purchaseMap.set(supplierId, {
        totalOrders: 0,
        totalAmount: 0,
        draftOrders: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        partiallyReceivedOrders: 0,
        receivedOrders: 0,
      });
    }

    const data =
      purchaseMap.get(supplierId)!;

    data.totalOrders += 1;

    data.totalAmount += Number(
      order.totalAmount || 0,
    );

    switch (order.status) {
      case PurchaseOrderStatus.DRAFT:
        data.draftOrders += 1;
        break;

      case PurchaseOrderStatus.PENDING:
        data.pendingOrders += 1;
        break;

      case PurchaseOrderStatus.APPROVED:
        data.approvedOrders += 1;
        break;

      case PurchaseOrderStatus.PARTIALLY_RECEIVED:
        data.partiallyReceivedOrders += 1;
        break;

      case PurchaseOrderStatus.RECEIVED:
        data.receivedOrders += 1;
        break;
    }
  }

  // -------------------------------------------------------
  // BUILD SUPPLIER RECORDS
  // -------------------------------------------------------

  const records = suppliers.map(
    (supplier) => {
      const purchase =
        purchaseMap.get(
          Number(supplier.id),
        ) || {
          totalOrders: 0,
          totalAmount: 0,
          draftOrders: 0,
          pendingOrders: 0,
          approvedOrders: 0,
          partiallyReceivedOrders: 0,
          receivedOrders: 0,
        };

      return {
        supplierId: supplier.id,

        supplierCode:
          supplier.supplierCode,

        supplierName:
          supplier.supplierName,

        contactPerson:
          supplier.contactPerson || null,

        phone:
          supplier.phone || null,

        email:
          supplier.email || null,

        address:
          supplier.address || null,

        city:
          supplier.city || null,

        country:
          supplier.country || null,

        taxNumber:
          supplier.taxNumber || null,

        vatNumber:
          supplier.vatNumber || null,

        paymentTerms:
          supplier.paymentTerms || null,

        creditLimit: Number(
          supplier.creditLimit || 0,
        ),

        bankName:
          supplier.bankName || null,

        isActive:
          supplier.isActive,

        totalPurchaseOrders:
          purchase.totalOrders,

        totalPurchaseAmount:
          Number(
            purchase.totalAmount.toFixed(2),
          ),

        draftOrders:
          purchase.draftOrders,

        pendingOrders:
          purchase.pendingOrders,

        approvedOrders:
          purchase.approvedOrders,

        partiallyReceivedOrders:
          purchase.partiallyReceivedOrders,

        receivedOrders:
          purchase.receivedOrders,

        status:
          supplier.isActive
            ? 'ACTIVE'
            : 'INACTIVE',
      };
    },
  );

  // -------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------

  const totalPurchaseOrders =
    records.reduce(
      (sum, supplier) =>
        sum +
        supplier.totalPurchaseOrders,
      0,
    );

  const totalPurchaseAmount =
    records.reduce(
      (sum, supplier) =>
        sum +
        supplier.totalPurchaseAmount,
      0,
    );

  return {
    report: 'Supplier Report',

    period: {
      startDate:
        query?.startDate || null,

      endDate:
        query?.endDate || null,
    },

    summary: {
      totalSuppliers:
        records.length,

      activeSuppliers:
        records.filter(
          (item) =>
            item.status === 'ACTIVE',
        ).length,

      inactiveSuppliers:
        records.filter(
          (item) =>
            item.status === 'INACTIVE',
        ).length,

      totalPurchaseOrders:
        totalPurchaseOrders,

      totalPurchaseAmount:
        Number(
          totalPurchaseAmount.toFixed(2),
        ),
    },

    records,
  };
}

// =========================================================
// STEP 12 - CUSTOMER REPORT
// =========================================================

async getCustomerReport(query?: ReportQueryDto) {
  // ---------------------------------------------------------
  // GET ALL CUSTOMERS
  // ---------------------------------------------------------

  const customers = await this.customerRepository.find({
    order: {
      customerName: 'ASC',
    },
  });

  // ---------------------------------------------------------
  // GET CUSTOMER SALES
  // ---------------------------------------------------------

  const salesQb = this.posSaleRepository
    .createQueryBuilder('sale')
    .where('sale.customerId IS NOT NULL')
    .andWhere('sale.status != :cancelledStatus', {
      cancelledStatus: SaleStatus.CANCELLED,
    });

  // ---------------------------------------------------------
  // START DATE
  // ---------------------------------------------------------

  if (query?.startDate) {
    salesQb.andWhere(
      'sale.createdAt >= :startDate',
      {
        startDate: `${query.startDate} 00:00:00`,
      },
    );
  }

  // ---------------------------------------------------------
  // END DATE
  // ---------------------------------------------------------

  if (query?.endDate) {
    const nextDate = this.getNextDate(query.endDate);

    salesQb.andWhere(
      'sale.createdAt < :endDate',
      {
        endDate: `${nextDate} 00:00:00`,
      },
    );
  }

  // ---------------------------------------------------------
  // SORT
  // ---------------------------------------------------------

  salesQb.orderBy(
    'sale.createdAt',
    'DESC',
  );

  const sales = await salesQb.getMany();

  // ---------------------------------------------------------
  // GET RETURNS
  // ---------------------------------------------------------

  const saleIds = sales.map(
    (sale) => sale.id,
  );

  let returns: PosReturn[] = [];

  if (saleIds.length > 0) {
    returns = await this.posReturnRepository
      .createQueryBuilder('ret')
      .where(
        'ret.posSaleId IN (:...saleIds)',
        {
          saleIds,
        },
      )
      .getMany();
  }

  // ---------------------------------------------------------
  // GROUP RETURNS BY SALE
  // ---------------------------------------------------------

  const returnsBySaleId =
    new Map<string, number>();

  for (const ret of returns) {
    const currentAmount =
      returnsBySaleId.get(ret.posSaleId) ?? 0;

    returnsBySaleId.set(
      ret.posSaleId,
      currentAmount +
        Number(ret.totalReturnAmount || 0),
    );
  }

  // ---------------------------------------------------------
  // CUSTOMER SALES MAP
  // ---------------------------------------------------------

  const customerMap =
    new Map<
      number,
      {
        totalOrders: number;
        totalSalesAmount: number;
        totalPaidAmount: number;
        lastPurchaseDate: Date | null;
      }
    >();

  // ---------------------------------------------------------
  // SALE ID -> CUSTOMER MAP
  //
  // IMPORTANT:
  // CustomerPayment.salesInvoiceId references PosSale.id
  // which is UUID.
  //
  // DO NOT use invoiceNumber here.
  // ---------------------------------------------------------

  const saleCustomerMap =
    new Map<string, number>();

  // ---------------------------------------------------------
  // PROCESS SALES
  // ---------------------------------------------------------

  for (const sale of sales) {
    if (
      sale.customerId === null ||
      sale.customerId === undefined
    ) {
      continue;
    }

    // -------------------------------------------------------
    // SALE TOTAL
    // -------------------------------------------------------

    const grandTotal = Number(
      sale.grandTotal || 0,
    );

    // -------------------------------------------------------
    // RETURN AMOUNT
    // -------------------------------------------------------

    const returnAmount = Number(
      (
        returnsBySaleId.get(sale.id) ?? 0
      ).toFixed(2),
    );

    // -------------------------------------------------------
    // CALCULATE NET SALE
    // -------------------------------------------------------

    let netSaleAmount = 0;

    // COMPLETED
    if (
      sale.status === SaleStatus.COMPLETED
    ) {
      netSaleAmount = grandTotal;
    }

    // PARTIALLY RETURNED
    else if (
      sale.status ===
      SaleStatus.PARTIALLY_RETURNED
    ) {
      netSaleAmount = Math.max(
        0,
        grandTotal - returnAmount,
      );
    }

    // FULLY RETURNED
    else if (
      sale.status === SaleStatus.RETURNED
    ) {
      netSaleAmount = 0;
    }

    // UNKNOWN STATUS
    else {
      continue;
    }

    // -------------------------------------------------------
    // CUSTOMER ID
    // -------------------------------------------------------

    const customerId =
      Number(sale.customerId);

    if (!Number.isFinite(customerId)) {
      continue;
    }

    // -------------------------------------------------------
    // CREATE CUSTOMER RECORD
    // -------------------------------------------------------

    if (!customerMap.has(customerId)) {
      customerMap.set(
        customerId,
        {
          totalOrders: 0,
          totalSalesAmount: 0,
          totalPaidAmount: 0,
          lastPurchaseDate: null,
        },
      );
    }

    const customer =
      customerMap.get(customerId)!;

    // -------------------------------------------------------
    // UPDATE SALES
    // -------------------------------------------------------

    customer.totalOrders += 1;

    customer.totalSalesAmount +=
      netSaleAmount;

    // -------------------------------------------------------
    // LAST PURCHASE DATE
    // -------------------------------------------------------

    const saleDate =
      new Date(sale.createdAt);

    if (
      !customer.lastPurchaseDate ||
      saleDate >
        customer.lastPurchaseDate
    ) {
      customer.lastPurchaseDate =
        saleDate;
    }

    // -------------------------------------------------------
    // IMPORTANT PAYMENT MAPPING
    //
    // CustomerPayment.salesInvoiceId
    //        ↓
    // PosSale.id
    //
    // PosSale.id is UUID.
    // -------------------------------------------------------

    saleCustomerMap.set(
      sale.id,
      customerId,
    );
  }

  // ---------------------------------------------------------
  // GET CUSTOMER PAYMENTS
  // ---------------------------------------------------------

  const saleIdsForPayments =
    Array.from(
      saleCustomerMap.keys(),
    );

  let payments: CustomerPayment[] = [];

  if (saleIdsForPayments.length > 0) {
    payments =
      await this.customerPaymentRepository
        .createQueryBuilder('payment')
        .where(
          'payment.salesInvoiceId IN (:...saleIdsForPayments)',
          {
            saleIdsForPayments,
          },
        )
        .getMany();
  }

  // ---------------------------------------------------------
  // ADD PAYMENTS TO CUSTOMER
  // ---------------------------------------------------------

  for (const payment of payments) {
    if (!payment.salesInvoiceId) {
      continue;
    }

    // salesInvoiceId = PosSale.id
    const customerId =
      saleCustomerMap.get(
        payment.salesInvoiceId,
      );

    if (customerId === undefined) {
      continue;
    }

    const customer =
      customerMap.get(customerId);

    if (!customer) {
      continue;
    }

    customer.totalPaidAmount +=
      Number(payment.amount || 0);
  }

  // ---------------------------------------------------------
  // BUILD FINAL RECORDS
  // ---------------------------------------------------------

  const records = customers.map(
    (customer) => {
      const customerId =
        Number(customer.id);

      const data =
        customerMap.get(customerId) || {
          totalOrders: 0,
          totalSalesAmount: 0,
          totalPaidAmount: 0,
          lastPurchaseDate: null,
        };

      // -----------------------------------------------------
      // TOTAL SALES
      // -----------------------------------------------------

      const totalSalesAmount =
        Number(
          data.totalSalesAmount.toFixed(2),
        );

      // -----------------------------------------------------
      // TOTAL PAID
      // -----------------------------------------------------

      const totalPaidAmount =
        Number(
          data.totalPaidAmount.toFixed(2),
        );

      // -----------------------------------------------------
      // OUTSTANDING
      // -----------------------------------------------------

      const outstandingAmount =
        Number(
          Math.max(
            0,
            totalSalesAmount -
              totalPaidAmount,
          ).toFixed(2),
        );

      return {
        customerId:
          customer.id,

        customerCode:
          customer.customerCode,

        customerName:
          customer.customerName,

        phone:
          customer.phone || null,

        email:
          customer.email || null,

        address:
          customer.address || null,

        city:
          customer.city || null,

        totalOrders:
          data.totalOrders,

        totalSalesAmount,

        totalPaidAmount,

        outstandingAmount,

        lastPurchaseDate:
          data.lastPurchaseDate
            ? data.lastPurchaseDate
                .toISOString()
                .slice(0, 10)
            : null,

        status:
          customer.isActive
            ? 'ACTIVE'
            : 'INACTIVE',
      };
    },
  );

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------

  const totalOrders =
    records.reduce(
      (sum, item) =>
        sum + item.totalOrders,
      0,
    );

  const totalSalesAmount =
    records.reduce(
      (sum, item) =>
        sum + item.totalSalesAmount,
      0,
    );

  const totalPaidAmount =
    records.reduce(
      (sum, item) =>
        sum + item.totalPaidAmount,
      0,
    );

  const totalOutstandingAmount =
    records.reduce(
      (sum, item) =>
        sum + item.outstandingAmount,
      0,
    );

  const customersWithPurchases =
    records.filter(
      (item) =>
        item.totalOrders > 0,
    ).length;

  // ---------------------------------------------------------
  // RETURN REPORT
  // ---------------------------------------------------------

  return {
    report: 'Customer Report',

    period: {
      startDate:
        query?.startDate || null,

      endDate:
        query?.endDate || null,
    },

    summary: {
      totalCustomers:
        records.length,

      activeCustomers:
        records.filter(
          (item) =>
            item.status === 'ACTIVE',
        ).length,

      inactiveCustomers:
        records.filter(
          (item) =>
            item.status === 'INACTIVE',
        ).length,

      customersWithPurchases,

      totalOrders,

      totalSalesAmount:
        Number(
          totalSalesAmount.toFixed(2),
        ),

      totalPaidAmount:
        Number(
          totalPaidAmount.toFixed(2),
        ),

      totalOutstandingAmount:
        Number(
          totalOutstandingAmount.toFixed(2),
        ),
    },

    records,
  };
}

// =========================================================
// STEP 13 - PURCHASE REPORT
// =========================================================

async getPurchaseReport(
  query?: ReportQueryDto,
) {
  const purchaseOrders =
    await this.purchaseOrderRepository.find({
      relations: {
        supplier: true,
        items: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

  // -------------------------------------------------------
  // DATE FILTER
  // -------------------------------------------------------

  const filteredPurchaseOrders =
    purchaseOrders.filter((po) => {
      const poDate = new Date(po.createdAt);

      if (query?.startDate) {
        const startDate = new Date(
          `${query.startDate}T00:00:00`,
        );

        if (poDate < startDate) {
          return false;
        }
      }

      if (query?.endDate) {
        const endDate = new Date(
          `${query.endDate}T23:59:59.999`,
        );

        if (poDate > endDate) {
          return false;
        }
      }

      return true;
    });

  // -------------------------------------------------------
  // GET PO IDS
  // -------------------------------------------------------

  const purchaseOrderIds =
    filteredPurchaseOrders.map(
      (po) => po.id,
    );

  // -------------------------------------------------------
  // GET GRN ITEMS
  // -------------------------------------------------------

  let grnItems: GrnItem[] = [];

  if (purchaseOrderIds.length > 0) {
    grnItems =
      await this.grnItemRepository
        .createQueryBuilder('item')
        .innerJoin(
          GoodsReceivedNote,
          'grn',
          'grn.id = item.grnId',
        )
        .where(
          'grn.purchaseOrderId IN (:...purchaseOrderIds)',
          {
            purchaseOrderIds,
          },
        )
        .andWhere(
          'grn.status = :status',
          {
            status: GrnStatus.RECEIVED,
          },
        )
        .getMany();
  }

  // -------------------------------------------------------
  // RECEIVED QUANTITY MAP
  // PO ID + PRODUCT ID
  // -------------------------------------------------------

  const receivedMap =
    new Map<string, number>();

  for (const item of grnItems) {
    const key =
      `${String(item.grnId)}-${String(item.productId)}`;

    const current =
      receivedMap.get(key) ?? 0;

    receivedMap.set(
      key,
      current +
        Number(item.receivedQuantity || 0),
    );
  }

  // -------------------------------------------------------
  // IMPORTANT:
  // GRN ID IS NOT PO ID.
  // BUILD PO RECEIVED QUANTITY DIRECTLY.
  // -------------------------------------------------------

  const receivedByPoProduct =
    new Map<string, number>();

  if (purchaseOrderIds.length > 0) {
    const rawReceived =
      await this.grnRepository
        .createQueryBuilder('grn')
        .innerJoin(
          GrnItem,
          'item',
          'item.grnId = grn.id',
        )
        .select(
          'grn.purchaseOrderId',
          'purchaseOrderId',
        )
        .addSelect(
          'item.productId',
          'productId',
        )
        .addSelect(
          'COALESCE(SUM(item.receivedQuantity), 0)',
          'receivedQuantity',
        )
        .where(
          'grn.purchaseOrderId IN (:...purchaseOrderIds)',
          {
            purchaseOrderIds,
          },
        )
        .andWhere(
          'grn.status = :status',
          {
            status: GrnStatus.RECEIVED,
          },
        )
        .groupBy(
          'grn.purchaseOrderId',
        )
        .addGroupBy(
          'item.productId',
        )
        .getRawMany();

    for (const row of rawReceived) {
      const key =
        `${String(row.purchaseOrderId)}-${String(row.productId)}`;

      receivedByPoProduct.set(
        key,
        Number(row.receivedQuantity || 0),
      );
    }
  }

  // -------------------------------------------------------
  // BUILD RECORDS
  // -------------------------------------------------------

  const records =
    filteredPurchaseOrders.map((po) => {
      const items =
        po.items || [];

      const totalItems =
        items.length;

      const totalQuantity =
        items.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity || 0),
          0,
        );

      const totalReceivedQuantity =
        items.reduce(
          (sum, item) => {
            const key =
              `${String(po.id)}-${String(item.productId)}`;

            return (
              sum +
              Number(
                receivedByPoProduct.get(
                  key,
                ) ?? 0,
              )
            );
          },
          0,
        );

      const outstandingQuantity =
        Math.max(
          0,
          totalQuantity -
            totalReceivedQuantity,
        );

      const totalAmount =
        Number(
          Number(
            po.totalAmount || 0,
          ).toFixed(2),
        );

      const receivedPercentage =
        totalQuantity > 0
          ? Number(
              (
                (totalReceivedQuantity /
                  totalQuantity) *
                100
              ).toFixed(2),
            )
          : 0;

      let receivingStatus =
        'NOT_RECEIVED';

      if (
        totalReceivedQuantity >=
        totalQuantity &&
        totalQuantity > 0
      ) {
        receivingStatus = 'FULLY_RECEIVED';
      } else if (
        totalReceivedQuantity > 0
      ) {
        receivingStatus =
          'PARTIALLY_RECEIVED';
      }

      return {
        purchaseOrderId: po.id,

        poNumber:
          po.poNumber,

        supplierId:
          po.supplierId ?? null,

        supplierCode:
          po.supplier?.supplierCode ??
          null,

        supplierName:
          po.supplier?.supplierName ??
          'N/A',

        poDate:
          po.createdAt
            ? new Date(
                po.createdAt,
              )
                .toISOString()
                .slice(0, 10)
            : null,

        expectedDeliveryDate:
          (po as any)
            .expectedDeliveryDate
            ? new Date(
                (po as any)
                  .expectedDeliveryDate,
              )
                .toISOString()
                .slice(0, 10)
            : null,

        status:
          po.status,

        totalItems,

        totalQuantity,

        receivedQuantity:
          totalReceivedQuantity,

        outstandingQuantity,

        receivedPercentage,

        receivingStatus,

        totalAmount,
      };
    });

  // -------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------

  const totalPurchaseOrders =
    records.length;

  const totalPurchaseAmount =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.totalAmount || 0,
        ),
      0,
    );

  const totalOrderedQuantity =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.totalQuantity || 0,
        ),
      0,
    );

  const totalReceivedQuantity =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.receivedQuantity || 0,
        ),
      0,
    );

  const totalOutstandingQuantity =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.outstandingQuantity ||
            0,
        ),
      0,
    );

  const totalItems =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.totalItems || 0,
        ),
      0,
    );

  const fullyReceivedOrders =
    records.filter(
      (record) =>
        record.receivingStatus ===
        'FULLY_RECEIVED',
    ).length;

  const partiallyReceivedOrders =
    records.filter(
      (record) =>
        record.receivingStatus ===
        'PARTIALLY_RECEIVED',
    ).length;

  const notReceivedOrders =
    records.filter(
      (record) =>
        record.receivingStatus ===
        'NOT_RECEIVED',
    ).length;

  // -------------------------------------------------------
  // STATUS COUNTS
  // -------------------------------------------------------

  const draftOrders =
    records.filter(
      (record) =>
        String(record.status)
          .toUpperCase() ===
        'DRAFT',
    ).length;

  const pendingOrders =
    records.filter(
      (record) =>
        String(record.status)
          .toUpperCase() ===
        'PENDING',
    ).length;

  const approvedOrders =
    records.filter(
      (record) =>
        String(record.status)
          .toUpperCase() ===
        'APPROVED',
    ).length;

  const receivedOrders =
    records.filter(
      (record) =>
        String(record.status)
          .toUpperCase() ===
        'RECEIVED',
    ).length;

  const cancelledOrders =
    records.filter(
      (record) =>
        String(record.status)
          .toUpperCase() ===
        'CANCELLED',
    ).length;

  return {
    report: 'Purchase Report',

    period: {
      startDate:
        query?.startDate || null,

      endDate:
        query?.endDate || null,
    },

    summary: {
      totalPurchaseOrders,
      totalItems,
      totalPurchaseAmount:
        Number(
          totalPurchaseAmount.toFixed(2),
        ),

      totalOrderedQuantity,
      totalReceivedQuantity,
      totalOutstandingQuantity,
      fullyReceivedOrders,
      partiallyReceivedOrders,
      notReceivedOrders,
      draftOrders,
      pendingOrders,
      approvedOrders,
      receivedOrders,
      cancelledOrders,
    },

    records,
  };
}

// 14. EXPENSE REPORT

async getExpenseReport(query?: ReportQueryDto) {
  const qb = this.financeTransactionRepository
    .createQueryBuilder('t')
    .leftJoinAndSelect('t.supplier', 'supplier')
    .leftJoinAndSelect('t.purchaseInvoice', 'purchaseInvoice')
    .where('t.type = :expenseType', {
      expenseType: TransactionType.EXPENSE,
    });

  // DATE FILTER
  if (query?.startDate) {
    qb.andWhere(
      't.transactionDate >= :startDate',
      {
        startDate: query.startDate,
      },
    );
  }

  if (query?.endDate) {
    qb.andWhere(
      't.transactionDate <= :endDate',
      {
        endDate: query.endDate,
      },
    );
  }

  // CATEGORY FILTER
  if (query?.category?.trim()) {
    qb.andWhere(
      't.category = :category',
      {
        category: query.category.trim(),
      },
    );
  }

  // PAYMENT METHOD FILTER
  if (query?.paymentMethod) {
    qb.andWhere(
      't.paymentMethod = :paymentMethod',
      {
        paymentMethod: query.paymentMethod,
      },
    );
  }

  // SEARCH
  if (query?.search?.trim()) {
    qb.andWhere(
      `(
        LOWER(t.transactionNumber) LIKE LOWER(:search)
        OR LOWER(t.description) LIKE LOWER(:search)
        OR LOWER(t.category) LIKE LOWER(:search)
        OR LOWER(COALESCE(t.reference, '')) LIKE LOWER(:search)
        OR LOWER(COALESCE(supplier.supplierName, '')) LIKE LOWER(:search)
        OR LOWER(COALESCE(purchaseInvoice.invoiceNumber, '')) LIKE LOWER(:search)
      )`,
      {
        search: `%${query.search.trim()}%`,
      },
    );
  }

  qb.orderBy('t.transactionDate', 'DESC')
    .addOrderBy('t.id', 'DESC');

  const transactions = await qb.getMany();

  
  // SUMMARY

  let totalExpenses = 0;
  let cashExpenses = 0;
  let bankExpenses = 0;
  let otherExpenses = 0;

  const categoryMap = new Map<
    string,
    {
      transactionCount: number;
      amount: number;
    }
  >();

  const paymentMethodMap = new Map<
    string,
    {
      transactionCount: number;
      amount: number;
    }
  >();

  for (const transaction of transactions) {
    const amount = Number(transaction.amount || 0);

    totalExpenses += amount;

    // PAYMENT METHOD TOTALS
    if (
      transaction.paymentMethod ===
      FinancePaymentMethod.CASH
    ) {
      cashExpenses += amount;
    } else if (
      transaction.paymentMethod ===
      FinancePaymentMethod.BANK
    ) {
      bankExpenses += amount;
    } else {
      otherExpenses += amount;
    }

    // CATEGORY TOTALS
    const category =
      transaction.category || 'Uncategorized';

    const categoryData =
      categoryMap.get(category) || {
        transactionCount: 0,
        amount: 0,
      };

    categoryData.transactionCount += 1;
    categoryData.amount += amount;

    categoryMap.set(category, categoryData);

    // PAYMENT METHOD TOTALS
    const paymentMethod =
      transaction.paymentMethod || 'UNKNOWN';

    const paymentData =
      paymentMethodMap.get(paymentMethod) || {
        transactionCount: 0,
        amount: 0,
      };

    paymentData.transactionCount += 1;
    paymentData.amount += amount;

    paymentMethodMap.set(
      paymentMethod,
      paymentData,
    );
  }

  // RECORDS
  const records = transactions.map(
    (transaction) => ({
      transactionId: transaction.id,

      transactionNumber:
        transaction.transactionNumber,

      expenseDate:
        transaction.transactionDate,

      category:
        transaction.category || '',

      description:
        transaction.description || '',

      paymentMethod:
        transaction.paymentMethod || '',

      reference:
        transaction.reference || null,

      amount:
        Number(
          Number(transaction.amount || 0).toFixed(2),
        ),

      supplierId:
        transaction.supplierId || null,

      supplierCode:
        transaction.supplier?.supplierCode || null,

      supplierName:
        transaction.supplier?.supplierName || null,

      purchaseInvoiceId:
        transaction.purchaseInvoiceId || null,

      purchaseInvoiceNumber:
        transaction.purchaseInvoice?.invoiceNumber ||
        null,
    }),
  );

  // CATEGORY BREAKDOWN
  const categoryBreakdown = Array.from(
    categoryMap.entries(),
  )
    .map(([category, data]) => ({
      category,

      transactionCount:
        data.transactionCount,

      amount:
        Number(data.amount.toFixed(2)),
    }))
    .sort(
      (a, b) =>
        b.amount - a.amount,
    );

  // =========================================================
  // PAYMENT METHOD BREAKDOWN
  // =========================================================

  const paymentMethodBreakdown =
    Array.from(
      paymentMethodMap.entries(),
    )
      .map(([paymentMethod, data]) => ({
        paymentMethod,

        transactionCount:
          data.transactionCount,

        amount:
          Number(data.amount.toFixed(2)),
      }))
      .sort(
        (a, b) =>
          b.amount - a.amount,
      );

  const transactionCount =
    records.length;

  const averageExpense =
    transactionCount > 0
      ? totalExpenses / transactionCount
      : 0;

  return {
    report: 'Expense Report',

    period: {
      startDate:
        query?.startDate || null,

      endDate:
        query?.endDate || null,
    },

    summary: {
      totalExpenses:
        Number(
          totalExpenses.toFixed(2),
        ),

      transactionCount,

      cashExpenses:
        Number(
          cashExpenses.toFixed(2),
        ),

      bankExpenses:
        Number(
          bankExpenses.toFixed(2),
        ),

      otherExpenses:
        Number(
          otherExpenses.toFixed(2),
        ),

      averageExpense:
        Number(
          averageExpense.toFixed(2),
        ),

      categoryCount:
        categoryBreakdown.length,
    },

    categoryBreakdown,

    paymentMethodBreakdown,

    records,
  };
}
}