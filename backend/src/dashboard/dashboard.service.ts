import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PosSale } from '../pos/entities/pos-sale.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PosSale)
    private readonly saleRepository: Repository<PosSale>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async getDashboard() {
    const now = new Date();

    /* =========================================================
       DATE RANGE
    ========================================================= */

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    /* =========================================================
       BASIC COUNTS
    ========================================================= */

    const totalProducts =
      await this.productRepository.count();

    const customers =
      await this.customerRepository.count();

    /* =========================================================
       PRODUCTS / INVENTORY
    ========================================================= */

    const products =
      await this.productRepository.find();

    let totalStock = 0;
    let stockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockProducts: any[] = [];

    for (const product of products) {
      const stock = Number(
        product.stockQuantity ?? 0,
      );

      const reorderLevel = Number(
        (product as any).reorderLevel ?? 0,
      );

      const purchasePrice = Number(
        (product as any).purchasePrice ?? 0,
      );

      totalStock += stock;

      stockValue +=
        stock * purchasePrice;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (
        reorderLevel > 0 &&
        stock <= reorderLevel
      ) {
        lowStockCount++;

        lowStockProducts.push({
          id: product.id,
          productCode:
            (product as any).productCode ?? '',
          productName:
            (product as any).productName ??
            'Unknown Product',
          stockQuantity: stock,
          reorderLevel,
        });
      }
    }

    /* =========================================================
       TODAY SALES
    ========================================================= */

    const todaySalesResult =
      await this.saleRepository
        .createQueryBuilder('sale')
        .select(
          'COALESCE(SUM(sale.grandTotal), 0)',
          'total',
        )
        .where(
          'sale.createdAt >= :startOfToday',
          {
            startOfToday,
          },
        )
        .andWhere(
          'sale.status = :status',
          {
            status: 'COMPLETED',
          },
        )
        .getRawOne();

    const todaySales = Number(
      todaySalesResult?.total ?? 0,
    );

    /* =========================================================
       MONTHLY SALES
    ========================================================= */

    const monthlySalesResult =
      await this.saleRepository
        .createQueryBuilder('sale')
        .select(
          'COALESCE(SUM(sale.grandTotal), 0)',
          'total',
        )
        .where(
          'sale.createdAt >= :startOfMonth',
          {
            startOfMonth,
          },
        )
        .andWhere(
          'sale.status = :status',
          {
            status: 'COMPLETED',
          },
        )
        .getRawOne();

    const monthlySales = Number(
      monthlySalesResult?.total ?? 0,
    );

    /* =========================================================
       SALES WITH ITEMS
    ========================================================= */

    const sales =
      await this.saleRepository.find({
        where: {
          status: 'COMPLETED' as any,
        },
        relations: {
          items: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    /* =========================================================
       PRODUCT PURCHASE PRICE MAP
    ========================================================= */

    const purchasePriceMap =
      new Map<string, number>();

    for (const product of products) {
      purchasePriceMap.set(
        String(product.id),
        Number(
          (product as any).purchasePrice ?? 0,
        ),
      );
    }

    /* =========================================================
       PROFIT CALCULATION
    ========================================================= */

    let todayProfit = 0;
    let monthlyProfit = 0;
    let grossProfit = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const sale of sales) {
      const saleDate = new Date(
        sale.createdAt,
      );

      const saleRevenue = Number(
        sale.grandTotal ?? 0,
      );

      let saleCost = 0;

      for (const item of sale.items ?? []) {
        const productId = String(
          item.productId,
        );

        const purchasePrice =
          purchasePriceMap.get(
            productId,
          ) ?? 0;

        const quantity = Number(
          item.quantity ?? 0,
        );

        saleCost +=
          purchasePrice * quantity;
      }

      const saleProfit =
        saleRevenue - saleCost;

      totalRevenue += saleRevenue;
      totalCost += saleCost;

      grossProfit += saleProfit;

      if (saleDate >= startOfToday) {
        todayProfit += saleProfit;
      }

      if (saleDate >= startOfMonth) {
        monthlyProfit += saleProfit;
      }
    }

    const profitMargin =
      monthlySales > 0
        ? (monthlyProfit / monthlySales) * 100
        : 0;

    /* =========================================================
       RECENT SALES
    ========================================================= */

    const recentSales =
      await this.saleRepository.find({
        where: {
          status: 'COMPLETED' as any,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 5,
      });

    /* =========================================================
       SALES CHART - LAST 7 DAYS
    ========================================================= */

    const salesChart: {
      date: string;
      sales: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);

      date.setDate(
        now.getDate() - i,
      );

      date.setHours(
        0,
        0,
        0,
        0,
      );

      const nextDate = new Date(date);

      nextDate.setDate(
        date.getDate() + 1,
      );

      const result =
        await this.saleRepository
          .createQueryBuilder('sale')
          .select(
            'COALESCE(SUM(sale.grandTotal), 0)',
            'total',
          )
          .where(
            'sale.createdAt >= :date',
            { date },
          )
          .andWhere(
            'sale.createdAt < :nextDate',
            { nextDate },
          )
          .andWhere(
            'sale.status = :status',
            {
              status: 'COMPLETED',
            },
          )
          .getRawOne();

      salesChart.push({
        date: date
          .toISOString()
          .slice(0, 10),

        sales: Number(
          result?.total ?? 0,
        ),
      });
    }

    /* =========================================================
       FINAL RESPONSE
    ========================================================= */

    return {
      summary: {
        todaySales: Number(
          todaySales.toFixed(2),
        ),

        monthlySales: Number(
          monthlySales.toFixed(2),
        ),

        totalProducts,

        customers,

        lowStock:
          lowStockCount,

        outOfStock:
          outOfStockCount,

        /* Inventory */

        totalStock: Math.round(
          totalStock,
        ),

        stockValue: Number(
          stockValue.toFixed(2),
        ),

        /* Profit */

        todayProfit: Number(
          todayProfit.toFixed(2),
        ),

        monthlyProfit: Number(
          monthlyProfit.toFixed(2),
        ),

        grossProfit: Number(
          grossProfit.toFixed(2),
        ),

        profitMargin: Number(
          profitMargin.toFixed(2),
        ),
      },

      salesChart,

      recentSales,

      lowStockProducts:
        lowStockProducts.slice(0, 10),
    };
  }
}