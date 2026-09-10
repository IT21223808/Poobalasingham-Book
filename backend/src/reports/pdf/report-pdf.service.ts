import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportPdfService {
  private readonly companyName =
    'POOBALASINGHAM BOOK DEPOT';

  private readonly systemName =
    'ERP MANAGEMENT SYSTEM';

  private readonly logoPath = path.join(
    process.cwd(),
    'assets',
    'logo2.png',
  );

  // =========================================================
  // DAILY SALES
  // =========================================================

  async generateDailySalesPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    this.addHeader(
      doc,
      'Daily Sales Report',
      report?.date ?? 'Daily',
    );

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addSummaryCards(doc, [
      {
        label: 'Total Sales',
        value: this.formatCurrency(
          summary.netSales ?? 0,
        ),
      },
      {
        label: 'Transactions',
        value: String(
          summary.invoiceCount ?? 0,
        ),
      },
      {
        label: 'Returns',
        value: this.formatCurrency(
          summary.totalReturnAmount ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Sales Details',
    );

    const headers = [
      'Invoice No',
      'Sale Date',
      'Customer',
      'Subtotal',
      'Discount',
      'Gross Total',
      'Return',
      'Net Amount',
      'Status',
    ];

    const rows: string[][] = records.map(
      (record: any) => [
        String(
          record.invoiceNumber ?? '',
        ),
        record.saleDate
          ? this.formatDate(record.saleDate)
          : '',
        String(
          record.customerName ?? '',
        ),
        this.formatNumber(
          record.subtotal ?? 0,
        ),
        this.formatNumber(
          record.discountAmount ?? 0,
        ),
        this.formatNumber(
          record.grandTotal ?? 0,
        ),
        this.formatNumber(
          record.returnAmount ?? 0,
        ),
        this.formatNumber(
          record.netAmount ?? 0,
        ),
        String(
          record.status ?? '',
        ),
      ],
    );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'Subtotal',
        this.formatCurrency(
          this.sumRecords(
            records,
            'subtotal',
          ),
        ),
      ],
      [
        'Discount',
        this.formatCurrency(
          summary.totalDiscount ?? 0,
        ),
      ],
      [
        'Return Amount',
        this.formatCurrency(
          summary.totalReturnAmount ?? 0,
        ),
      ],
      [
        'NET SALES',
        this.formatCurrency(
          summary.netSales ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // MONTHLY SALES
  // =========================================================

  async generateMonthlySalesPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};

    const breakdown =
      Array.isArray(
        report?.dailyBreakdown,
      )
        ? report.dailyBreakdown
        : [];

    this.addHeader(
      doc,
      'Monthly Sales Report',
      `${this.getMonthName(
        Number(report?.month ?? 1),
      )} ${report?.year ?? ''}`,
    );

    this.addSummaryCards(doc, [
      {
        label: 'Gross Sales',
        value: this.formatCurrency(
          summary.grossSales ?? 0,
        ),
      },
      {
        label: 'Net Sales',
        value: this.formatCurrency(
          summary.netSales ?? 0,
        ),
      },
      {
        label: 'Transactions',
        value: String(
          summary.invoiceCount ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Daily Sales Breakdown',
    );

    const headers = [
      'Date',
      'Transactions',
      'Gross Sales',
      'Discount',
      'Returns',
      'Net Sales',
    ];

    const rows: string[][] =
      breakdown.map(
        (record: any) => [
          record.date
            ? this.formatShortDate(
                record.date,
              )
            : '',
          String(
            record.invoiceCount ?? 0,
          ),
          this.formatNumber(
            record.grossSales ?? 0,
          ),
          this.formatNumber(
            record.discountAmount ?? 0,
          ),
          this.formatNumber(
            record.returnAmount ?? 0,
          ),
          this.formatNumber(
            record.netSales ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'Gross Sales',
        this.formatCurrency(
          summary.grossSales ?? 0,
        ),
      ],
      [
        'Discount',
        this.formatCurrency(
          summary.totalDiscount ?? 0,
        ),
      ],
      [
        'Return Amount',
        this.formatCurrency(
          summary.totalReturnAmount ?? 0,
        ),
      ],
      [
        'NET SALES',
        this.formatCurrency(
          summary.netSales ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // ANNUAL SALES
  // =========================================================

  async generateAnnualSalesPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};

    const breakdown =
      Array.isArray(
        report?.monthlyBreakdown,
      )
        ? report.monthlyBreakdown
        : [];

    this.addHeader(
      doc,
      'Annual Sales Report',
      `Financial Year ${
        report?.year ?? ''
      }`,
    );

    this.addSummaryCards(doc, [
      {
        label: 'Gross Sales',
        value: this.formatCurrency(
          summary.grossSales ?? 0,
        ),
      },
      {
        label: 'Net Sales',
        value: this.formatCurrency(
          summary.netSales ?? 0,
        ),
      },
      {
        label: 'Transactions',
        value: String(
          summary.invoiceCount ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Monthly Sales Breakdown',
    );

    const headers = [
      'Month',
      'Transactions',
      'Gross Sales',
      'Discount',
      'Returns',
      'Net Sales',
    ];

    const rows: string[][] =
      breakdown.map(
        (record: any) => [
          this.getMonthName(
            Number(record.month ?? 1),
          ),
          String(
            record.invoiceCount ?? 0,
          ),
          this.formatNumber(
            record.grossSales ?? 0,
          ),
          this.formatNumber(
            record.discountAmount ?? 0,
          ),
          this.formatNumber(
            record.returnAmount ?? 0,
          ),
          this.formatNumber(
            record.netSales ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'Gross Sales',
        this.formatCurrency(
          summary.grossSales ?? 0,
        ),
      ],
      [
        'Discount',
        this.formatCurrency(
          summary.totalDiscount ?? 0,
        ),
      ],
      [
        'Return Amount',
        this.formatCurrency(
          summary.totalReturnAmount ?? 0,
        ),
      ],
      [
        'NET SALES',
        this.formatCurrency(
          summary.netSales ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // CATEGORY-WISE SALES
  // =========================================================

  async generateCategoryWiseSalesPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Category-wise Sales Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Total Sales',
        value: this.formatCurrency(
          summary.totalSales ?? 0,
        ),
      },
      {
        label: 'Items Sold',
        value: String(
          summary.totalItemsSold ?? 0,
        ),
      },
      {
        label: 'Total Profit',
        value: this.formatCurrency(
          summary.totalProfit ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Category Sales Details',
    );

    const headers = [
      'Category',
      'Items Sold',
      'Sales',
      'Profit',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.categoryName ??
              record.category ??
              '',
          ),
          String(
            record.itemsSold ?? 0,
          ),
          this.formatNumber(
            record.sales ?? 0,
          ),
          this.formatNumber(
            record.profit ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL SALES',
        this.formatCurrency(
          summary.totalSales ?? 0,
        ),
      ],
      [
        'TOTAL PROFIT',
        this.formatCurrency(
          summary.totalProfit ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // PRODUCT-WISE SALES
  // =========================================================

  async generateProductWiseSalesPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Product-wise Sales Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Total Products',
        value: String(
          summary.totalProducts ?? 0,
        ),
      },
      {
        label: 'Qty Sold',
        value: String(
          summary.totalQtySold ?? 0,
        ),
      },
      {
        label: 'Total Sales',
        value: this.formatCurrency(
          summary.totalSales ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Product Sales Details',
    );

    const headers = [
      'Code',
      'Product',
      'Qty Sold',
      'Sales',
      'Cost',
      'Profit',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.productCode ?? '',
          ),
          String(
            record.productName ?? '',
          ),
          String(
            record.qtySold ?? 0,
          ),
          this.formatNumber(
            record.sales ?? 0,
          ),
          this.formatNumber(
            record.cost ?? 0,
          ),
          this.formatNumber(
            record.profit ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL SALES',
        this.formatCurrency(
          summary.totalSales ?? 0,
        ),
      ],
      [
        'TOTAL PROFIT',
        this.formatCurrency(
          summary.totalProfit ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // PROFIT ANALYSIS
  // =========================================================

  async generateProfitAnalysisPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Profit Analysis Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Revenue',
        value: this.formatCurrency(
          summary.totalRevenue ?? 0,
        ),
      },
      {
        label: 'Cost of Goods',
        value: this.formatCurrency(
          summary.costOfGoodsSold ?? 0,
        ),
      },
      {
        label: 'Gross Profit',
        value: this.formatCurrency(
          summary.grossProfit ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Profit by Category',
    );

    const headers = [
      'Category',
      'Revenue',
      'Cost',
      'Gross Profit',
      'Margin',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.category ?? '',
          ),
          this.formatNumber(
            record.revenue ?? 0,
          ),
          this.formatNumber(
            record.cost ?? 0,
          ),
          this.formatNumber(
            record.grossProfit ?? 0,
          ),
          `${this.formatNumber(
            record.margin ?? 0,
          )}%`,
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL REVENUE',
        this.formatCurrency(
          summary.totalRevenue ?? 0,
        ),
      ],
      [
        'COGS',
        this.formatCurrency(
          summary.costOfGoodsSold ?? 0,
        ),
      ],
      [
        'GROSS PROFIT',
        this.formatCurrency(
          summary.grossProfit ?? 0,
        ),
      ],
      [
        'GROSS MARGIN',
        `${this.formatNumber(
          summary.grossMargin ?? 0,
        )}%`,
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // BEST-SELLING PRODUCTS
  // =========================================================

  async generateBestSellingProductsPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Best-selling Products Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Products',
        value: String(
          summary.totalProducts ?? 0,
        ),
      },
      {
        label: 'Top Products',
        value: String(
          summary.topProducts ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Top-selling Products',
    );

    const headers = [
      'Rank',
      'Code',
      'Product',
      'Qty Sold',
      'Revenue',
      'Profit',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.rank ?? '',
          ),
          String(
            record.productCode ?? '',
          ),
          String(
            record.productName ?? '',
          ),
          String(
            record.qtySold ?? 0,
          ),
          this.formatNumber(
            record.revenue ?? 0,
          ),
          this.formatNumber(
            record.profit ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // SLOW-MOVING PRODUCTS
  // =========================================================

  async generateSlowMovingProductsPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Slow-moving Products Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Slow-moving Products',
        value: String(
          summary.totalSlowMovingProducts ?? 0,
        ),
      },
      {
        label: 'Criteria',
        value: `≤ ${
          report?.criteria
            ?.maximumQtySold ?? 0
        } Sold`,
      },
    ]);

    this.addSectionTitle(
      doc,
      'Slow-moving Product Details',
    );

    const headers = [
      'Code',
      'Product',
      'Current Stock',
      'Qty Sold',
      'Last Sold',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.productCode ?? '',
          ),
          String(
            record.productName ?? '',
          ),
          String(
            record.currentStock ?? 0,
          ),
          String(
            record.qtySold ?? 0,
          ),
          record.lastSoldDate
            ? this.formatDate(
                record.lastSoldDate,
              )
            : 'Never',
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL SLOW-MOVING',
        String(
          summary.totalSlowMovingProducts ??
            0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // DEAD STOCK
  // =========================================================

  async generateDeadStockPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Dead Stock Report',
      report?.period?.endDate
        ? `As of ${this.formatDate(
            report.period.endDate,
          )}`
        : 'Current',
    );

    this.addSummaryCards(doc, [
      {
        label: 'Dead Stock Products',
        value: String(
          summary.totalDeadStockProducts ?? 0,
        ),
      },
      {
        label: 'Dead Stock Units',
        value: String(
          summary.totalDeadStockUnits ?? 0,
        ),
      },
      {
        label: 'Stock Value',
        value: this.formatCurrency(
          summary.totalDeadStockValue ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Dead Stock Details',
    );

    const headers = [
      'Code',
      'Product',
      'Current Stock',
      'Days Without Sale',
      'Stock Value',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.productCode ?? '',
          ),
          String(
            record.productName ?? '',
          ),
          String(
            record.currentStock ?? 0,
          ),
          String(
            record.daysWithoutSale ?? 0,
          ),
          this.formatNumber(
            record.stockValue ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL UNITS',
        String(
          summary.totalDeadStockUnits ?? 0,
        ),
      ],
      [
        'TOTAL VALUE',
        this.formatCurrency(
          summary.totalDeadStockValue ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // SUPPLIER REPORT
  // =========================================================

  async generateSupplierReportPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Supplier Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Total Suppliers',
        value: String(
          summary.totalSuppliers ?? 0,
        ),
      },
      {
        label: 'Active Suppliers',
        value: String(
          summary.activeSuppliers ?? 0,
        ),
      },
      {
        label: 'Purchase Orders',
        value: String(
          summary.totalPurchaseOrders ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Supplier Details',
    );

    const headers = [
      'Code',
      'Supplier',
      'Contact',
      'Phone',
      'Orders',
      'Purchase Amount',
      'Status',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.supplierCode ?? '',
          ),
          String(
            record.supplierName ?? '',
          ),
          String(
            record.contactPerson ?? '',
          ),
          String(
            record.phone ?? '',
          ),
          String(
            record.totalPurchaseOrders ?? 0,
          ),
          this.formatNumber(
            record.totalPurchaseAmount ?? 0,
          ),
          String(
            record.status ?? '',
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL SUPPLIERS',
        String(
          summary.totalSuppliers ?? 0,
        ),
      ],
      [
        'ACTIVE SUPPLIERS',
        String(
          summary.activeSuppliers ?? 0,
        ),
      ],
      [
        'TOTAL PURCHASE ORDERS',
        String(
          summary.totalPurchaseOrders ?? 0,
        ),
      ],
      [
        'TOTAL PURCHASE AMOUNT',
        this.formatCurrency(
          summary.totalPurchaseAmount ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // CUSTOMER REPORT
  // =========================================================

  async generateCustomerReportPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Customer Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Total Customers',
        value: String(
          summary.totalCustomers ?? 0,
        ),
      },
      {
        label: 'Active Customers',
        value: String(
          summary.activeCustomers ?? 0,
        ),
      },
      {
        label: 'Total Sales',
        value: this.formatCurrency(
          summary.totalSalesAmount ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Customer Details',
    );

    const headers = [
      'Code',
      'Customer',
      'Phone',
      'Orders',
      'Sales',
      'Paid',
      'Outstanding',
      'Last Purchase',
      'Status',
    ];

    const rows: string[][] =
      records.map(
        (customer: any) => [
          String(
            customer.customerCode ?? '',
          ),
          String(
            customer.customerName ?? '',
          ),
          String(
            customer.phone ?? '',
          ),
          String(
            customer.totalOrders ?? 0,
          ),
          this.formatNumber(
            customer.totalSalesAmount ?? 0,
          ),
          this.formatNumber(
            customer.totalPaidAmount ?? 0,
          ),
          this.formatNumber(
            customer.outstandingAmount ?? 0,
          ),
          customer.lastPurchaseDate
            ? this.formatDate(
                customer.lastPurchaseDate,
              )
            : '-',
          String(
            customer.status ?? '',
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL CUSTOMERS',
        String(
          summary.totalCustomers ?? 0,
        ),
      ],
      [
        'TOTAL ORDERS',
        String(
          summary.totalOrders ?? 0,
        ),
      ],
      [
        'TOTAL SALES',
        this.formatCurrency(
          summary.totalSalesAmount ?? 0,
        ),
      ],
      [
        'TOTAL PAID',
        this.formatCurrency(
          summary.totalPaidAmount ?? 0,
        ),
      ],
      [
        'TOTAL OUTSTANDING',
        this.formatCurrency(
          summary.totalOutstandingAmount ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // PURCHASE REPORT
  // =========================================================

  async generatePurchaseReportPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Purchase Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Purchase Orders',
        value: String(
          summary.totalPurchaseOrders ?? 0,
        ),
      },
      {
        label: 'Purchase Amount',
        value: this.formatCurrency(
          summary.totalPurchaseAmount ?? 0,
        ),
      },
      {
        label: 'Received Quantity',
        value: String(
          summary.totalReceivedQuantity ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Purchase Order Details',
    );

    const headers = [
      'PO Number',
      'Supplier',
      'PO Date',
      'Status',
      'Items',
      'Ordered',
      'Received',
      'Outstanding',
      'Amount',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.poNumber ?? '',
          ),
          String(
            record.supplierName ?? '',
          ),
          record.poDate
            ? this.formatDate(
                record.poDate,
              )
            : '',
          String(
            record.status ?? '',
          ),
          String(
            record.totalItems ?? 0,
          ),
          String(
            record.totalQuantity ?? 0,
          ),
          String(
            record.receivedQuantity ?? 0,
          ),
          String(
            record.outstandingQuantity ?? 0,
          ),
          this.formatNumber(
            record.totalAmount ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL PURCHASE ORDERS',
        String(
          summary.totalPurchaseOrders ?? 0,
        ),
      ],
      [
        'TOTAL ORDERED',
        String(
          summary.totalOrderedQuantity ?? 0,
        ),
      ],
      [
        'TOTAL RECEIVED',
        String(
          summary.totalReceivedQuantity ?? 0,
        ),
      ],
      [
        'TOTAL OUTSTANDING',
        String(
          summary.totalOutstandingQuantity ?? 0,
        ),
      ],
      [
        'TOTAL PURCHASE AMOUNT',
        this.formatCurrency(
          summary.totalPurchaseAmount ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // INVENTORY STOCK REPORT
  // =========================================================

  async generateInventoryStockPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const records = this.getRecords(report);

    const totalProducts =
      report?.summary?.totalProducts ??
      report?.totalProducts ??
      records.length;

    const totalStock =
      report?.summary?.totalStock ??
      report?.totalStock ??
      0;

    const totalStockValue =
      report?.summary?.totalStockValue ??
      report?.totalStockValue ??
      0;

    this.addHeader(
      doc,
      'Inventory Stock Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Total Products',
        value: String(
          totalProducts,
        ),
      },
      {
        label: 'Total Stock',
        value: String(
          totalStock,
        ),
      },
      {
        label: 'Stock Value',
        value: this.formatCurrency(
          totalStockValue,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Inventory Stock Details',
    );

    const headers = [
      'Code',
      'Product',
      'Location',
      'Quantity',
      'Reorder Level',
      'Stock Value',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.productCode ??
              record.product?.productCode ??
              '',
          ),
          String(
            record.productName ??
              record.product?.productName ??
              '',
          ),
          String(
            record.locationName ??
              record.location?.name ??
              record.location?.locationName ??
              '',
          ),
          String(
            record.quantity ??
              record.stockQuantity ??
              record.currentStock ??
              0,
          ),
          String(
            record.reorderLevel ??
              record.product?.reorderLevel ??
              0,
          ),
          this.formatNumber(
            record.stockValue ??
              record.totalValue ??
              0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL PRODUCTS',
        String(totalProducts),
      ],
      [
        'TOTAL STOCK',
        String(totalStock),
      ],
      [
        'TOTAL STOCK VALUE',
        this.formatCurrency(
          totalStockValue,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // STOCK MOVEMENT REPORT
  // =========================================================

  async generateStockMovementPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const records = this.getRecords(report);

    const totalMovements =
      report?.summary?.totalMovements ??
      records.length;

    const totalStockIn =
      report?.summary?.totalStockIn ??
      report?.summary?.stockIn ??
      0;

    const totalStockOut =
      report?.summary?.totalStockOut ??
      report?.summary?.stockOut ??
      0;

    this.addHeader(
      doc,
      'Stock Movement Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Total Movements',
        value: String(
          totalMovements,
        ),
      },
      {
        label: 'Stock In',
        value: String(
          totalStockIn,
        ),
      },
      {
        label: 'Stock Out',
        value: String(
          totalStockOut,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Stock Movement Details',
    );

    const headers = [
      'Date',
      'Product',
      'Type',
      'Quantity',
      'From',
      'To',
      'Reference',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          record.createdAt
            ? this.formatDate(
                record.createdAt,
              )
            : record.date
              ? this.formatDate(
                  record.date,
                )
              : '',
          String(
            record.productName ??
              record.product?.productName ??
              '',
          ),
          String(
            record.movementType ??
              record.type ??
              '',
          ),
          String(
            record.quantity ??
              record.changeQuantity ??
              0,
          ),
          String(
            record.fromLocationName ??
              record.fromLocation?.name ??
              record.fromLocation?.locationName ??
              '-',
          ),
          String(
            record.toLocationName ??
              record.toLocation?.name ??
              record.toLocation?.locationName ??
              '-',
          ),
          String(
            record.referenceNumber ??
              record.reference ??
              record.referenceId ??
              '-',
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL MOVEMENTS',
        String(totalMovements),
      ],
      [
        'TOTAL STOCK IN',
        String(totalStockIn),
      ],
      [
        'TOTAL STOCK OUT',
        String(totalStockOut),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // STOCK VALUATION REPORT
  // =========================================================

  async generateStockValuationPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const records = this.getRecords(report);

    const totalProducts =
      report?.summary?.totalProducts ??
      report?.totalProducts ??
      records.length;

    const totalQuantity =
      report?.summary?.totalQuantity ??
      report?.totalQuantity ??
      0;

    const totalStockValue =
      report?.summary?.totalStockValue ??
      report?.totalStockValue ??
      0;

    this.addHeader(
      doc,
      'Stock Valuation Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Products',
        value: String(
          totalProducts,
        ),
      },
      {
        label: 'Total Quantity',
        value: String(
          totalQuantity,
        ),
      },
      {
        label: 'Stock Value',
        value: this.formatCurrency(
          totalStockValue,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Stock Valuation Details',
    );

    const headers = [
      'Code',
      'Product',
      'Quantity',
      'Unit Cost',
      'Stock Value',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.productCode ??
              record.product?.productCode ??
              '',
          ),
          String(
            record.productName ??
              record.product?.productName ??
              '',
          ),
          String(
            record.quantity ??
              record.stockQuantity ??
              record.currentStock ??
              0,
          ),
          this.formatNumber(
            record.unitCost ??
              record.purchasePrice ??
              record.costPrice ??
              0,
          ),
          this.formatNumber(
            record.stockValue ??
              record.totalValue ??
              0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL QUANTITY',
        String(totalQuantity),
      ],
      [
        'TOTAL STOCK VALUE',
        this.formatCurrency(
          totalStockValue,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // LOW STOCK REPORT
  // =========================================================

  async generateLowStockPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const records = this.getRecords(report);

    const totalLowStock =
      report?.summary
        ?.totalLowStockProducts ??
      report?.summary?.totalProducts ??
      records.length;

    const totalQuantity =
      report?.summary?.totalStock ??
      report?.summary?.totalQuantity ??
      0;

    const reorderRequired =
      report?.summary?.reorderRequired ??
      records.length;

    this.addHeader(
      doc,
      'Low Stock Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Low Stock Products',
        value: String(
          totalLowStock,
        ),
      },
      {
        label: 'Total Quantity',
        value: String(
          totalQuantity,
        ),
      },
      {
        label: 'Reorder Required',
        value: String(
          reorderRequired,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Low Stock Product Details',
    );

    const headers = [
      'Code',
      'Product',
      'Current Stock',
      'Reorder Level',
      'Shortage',
      'Status',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => {
          const currentStock =
            Number(
              record.currentStock ??
                record.stockQuantity ??
                record.quantity ??
                0,
            );

          const reorderLevel =
            Number(
              record.reorderLevel ??
                record.product?.reorderLevel ??
                0,
            );

          const shortage =
            Math.max(
              reorderLevel -
                currentStock,
              0,
            );

          return [
            String(
              record.productCode ??
                record.product?.productCode ??
                '',
            ),
            String(
              record.productName ??
                record.product?.productName ??
                '',
            ),
            String(
              currentStock,
            ),
            String(
              reorderLevel,
            ),
            String(
              record.shortage ??
                shortage,
            ),
            String(
              record.status ??
                'LOW STOCK',
            ),
          ];
        },
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'LOW STOCK PRODUCTS',
        String(totalLowStock),
      ],
      [
        'REORDER REQUIRED',
        String(reorderRequired),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // OUT OF STOCK REPORT
  // =========================================================

  async generateOutOfStockPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const records = this.getRecords(report);

    const totalOutOfStock =
      report?.summary
        ?.totalOutOfStockProducts ??
      report?.summary?.totalProducts ??
      records.length;

    const totalQuantity =
      report?.summary?.totalStock ??
      report?.summary?.totalQuantity ??
      0;

    const reorderRequired =
      report?.summary?.reorderRequired ??
      records.length;

    this.addHeader(
      doc,
      'Out of Stock Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Out of Stock Products',
        value: String(
          totalOutOfStock,
        ),
      },
      {
        label: 'Total Quantity',
        value: String(
          totalQuantity,
        ),
      },
      {
        label: 'Reorder Required',
        value: String(
          reorderRequired,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Out of Stock Product Details',
    );

    const headers = [
      'Code',
      'Product',
      'Current Stock',
      'Reorder Level',
      'Status',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          String(
            record.productCode ??
              record.product?.productCode ??
              '',
          ),
          String(
            record.productName ??
              record.product?.productName ??
              '',
          ),
          String(
            record.currentStock ??
              record.stockQuantity ??
              record.quantity ??
              0,
          ),
          String(
            record.reorderLevel ??
              record.product?.reorderLevel ??
              0,
          ),
          String(
            record.status ??
              'OUT OF STOCK',
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'OUT OF STOCK PRODUCTS',
        String(totalOutOfStock),
      ],
      [
        'REORDER REQUIRED',
        String(reorderRequired),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

  // =========================================================
  // EXPENSE REPORT
  // =========================================================

  async generateExpenseReportPdf(
    report: any,
  ): Promise<Buffer> {
    const doc = this.createDocument();

    const summary = report?.summary ?? {};
    const records = this.getRecords(report);

    this.addHeader(
      doc,
      'Expense Report',
      this.getPeriodText(
        report?.period,
      ),
    );

    this.addSummaryCards(doc, [
      {
        label: 'Total Expenses',
        value: this.formatCurrency(
          summary.totalExpenses ?? 0,
        ),
      },
      {
        label: 'Transactions',
        value: String(
          summary.transactionCount ?? 0,
        ),
      },
      {
        label: 'Cash Expenses',
        value: this.formatCurrency(
          summary.cashExpenses ?? 0,
        ),
      },
    ]);

    this.addSectionTitle(
      doc,
      'Expense Details',
    );

    const headers = [
      'Date',
      'Transaction',
      'Category',
      'Description',
      'Payment',
      'Supplier',
      'Amount',
    ];

    const rows: string[][] =
      records.map(
        (record: any) => [
          record.expenseDate
            ? this.formatDate(
                record.expenseDate,
              )
            : '',
          String(
            record.transactionNumber ?? '',
          ),
          String(
            record.category ?? '',
          ),
          String(
            record.description ?? '',
          ),
          String(
            record.paymentMethod ?? '',
          ),
          String(
            record.supplierName ?? '',
          ),
          this.formatNumber(
            record.amount ?? 0,
          ),
        ],
      );

    this.addTable(
      doc,
      headers,
      rows,
    );

    this.addTotalsBox(doc, [
      [
        'TOTAL EXPENSES',
        this.formatCurrency(
          summary.totalExpenses ?? 0,
        ),
      ],
      [
        'CASH EXPENSES',
        this.formatCurrency(
          summary.cashExpenses ?? 0,
        ),
      ],
      [
        'BANK EXPENSES',
        this.formatCurrency(
          summary.bankExpenses ?? 0,
        ),
      ],
      [
        'OTHER EXPENSES',
        this.formatCurrency(
          summary.otherExpenses ?? 0,
        ),
      ],
    ]);

    this.addFooter(doc);

    return this.finalizeDocument(doc);
  }

// =========================================================
// FINANCE - PROFIT & LOSS
// =========================================================

async generateProfitLossPdf(
  report: any,
): Promise<Buffer> {
  const doc = this.createDocument();

  const data =
    report?.data &&
    typeof report.data === 'object'
      ? report.data
      : report ?? {};

  const income =
    data.income &&
    typeof data.income === 'object'
      ? data.income
      : {};

  const expenses =
    data.expenses &&
    typeof data.expenses === 'object'
      ? data.expenses
      : {};

  const totalIncome = Number(
    income.total ?? 0,
  );

  const totalExpenses = Number(
    expenses.total ?? 0,
  );

  const netProfit = Number(
    data.netProfit ??
      totalIncome - totalExpenses,
  );

  const profitMargin = Number(
    data.profitMargin ??
      (totalIncome > 0
        ? (netProfit / totalIncome) * 100
        : 0),
  );

  const period =
    data.period ??
    report?.period ??
    report;

  this.addHeader(
    doc,
    'PROFIT & LOSS STATEMENT',
    this.getPeriodText(period),
  );

  // -------------------------------------------------------
  // SUMMARY CARDS
  // -------------------------------------------------------

  this.addSummaryCards(doc, [
    {
      label: 'Total Income',
      value: this.formatCurrency(
        totalIncome,
      ),
    },
    {
      label: 'Total Expenses',
      value: this.formatCurrency(
        totalExpenses,
      ),
    },
    {
      label: 'Net Profit',
      value: this.formatCurrency(
        netProfit,
      ),
    },
  ]);

  // -------------------------------------------------------
  // PROFIT & LOSS SUMMARY
  // -------------------------------------------------------

  this.addSectionTitle(
    doc,
    'Profit & Loss Summary',
  );

  const summaryRows: string[][] = [
    [
      'Total Income',
      this.formatCurrency(
        totalIncome,
      ),
    ],
    [
      'Total Expenses',
      this.formatCurrency(
        totalExpenses,
      ),
    ],
    [
      'Net Profit',
      this.formatCurrency(
        netProfit,
      ),
    ],
    [
      'Profit Margin',
      `${profitMargin.toFixed(2)}%`,
    ],
  ];

  this.addTable(
    doc,
    [
      'Particular',
      'Amount',
    ],
    summaryRows,
  );

  // -------------------------------------------------------
  // INCOME BREAKDOWN
  // -------------------------------------------------------

  const incomeBreakdown =
    Array.isArray(
      income.breakdown,
    )
      ? income.breakdown
      : [];

  if (
    incomeBreakdown.length > 0
  ) {
    this.addSectionTitle(
      doc,
      'Income Breakdown',
    );

    const incomeRows: string[][] =
      incomeBreakdown.map(
        (item: any) => [
          String(
            item.category ??
              item.name ??
              item.label ??
              '—',
          ),
          this.formatCurrency(
            Number(
              item.amount ??
                item.total ??
                item.value ??
                0,
            ),
          ),
        ],
      );

    this.addTable(
      doc,
      [
        'Income Category',
        'Amount',
      ],
      incomeRows,
    );
  }

  // -------------------------------------------------------
  // EXPENSE BREAKDOWN
  // -------------------------------------------------------

  const expenseBreakdown =
    Array.isArray(
      expenses.breakdown,
    )
      ? expenses.breakdown
      : [];

  if (
    expenseBreakdown.length > 0
  ) {
    this.addSectionTitle(
      doc,
      'Expense Breakdown',
    );

    const expenseRows: string[][] =
      expenseBreakdown.map(
        (item: any) => [
          String(
            item.category ??
              item.name ??
              item.label ??
              '—',
          ),
          this.formatCurrency(
            Number(
              item.amount ??
                item.total ??
                item.value ??
                0,
            ),
          ),
        ],
      );

    this.addTable(
      doc,
      [
        'Expense Category',
        'Amount',
      ],
      expenseRows,
    );
  }

  // -------------------------------------------------------
  // TOTALS
  // -------------------------------------------------------

  this.addTotalsBox(doc, [
    [
      'TOTAL INCOME',
      this.formatCurrency(
        totalIncome,
      ),
    ],
    [
      'TOTAL EXPENSES',
      this.formatCurrency(
        totalExpenses,
      ),
    ],
    [
      'NET PROFIT',
      this.formatCurrency(
        netProfit,
      ),
    ],
    [
      'PROFIT MARGIN',
      `${profitMargin.toFixed(2)}%`,
    ],
  ]);

  this.addFooter(doc);

  return this.finalizeDocument(doc);
}

 // =========================================================
// FINANCE - BALANCE SHEET
// =========================================================

async generateBalanceSheetPdf(
  report: any,
): Promise<Buffer> {
  const doc = this.createDocument();

  const data =
    report?.data &&
    typeof report.data === 'object'
      ? report.data
      : report ?? {};

  // -------------------------------------------------------
  // ASSETS
  // -------------------------------------------------------

  const assets =
    data.assets &&
    typeof data.assets === 'object'
      ? data.assets
      : {};

  const currentAssets =
    assets.currentAssets &&
    typeof assets.currentAssets === 'object'
      ? assets.currentAssets
      : {};

  const cashOnHand = Number(
    currentAssets.cashOnHand ?? 0,
  );

  const bankAccounts = Number(
    currentAssets.bankAccounts ?? 0,
  );

  const accountsReceivable =
    Number(
      currentAssets.accountsReceivable ??
        0,
    );

  const inventoryValuation =
    Number(
      currentAssets.inventoryValuation ??
        0,
    );

  const totalAssets = Number(
    assets.totalAssets ??
      cashOnHand +
        bankAccounts +
        accountsReceivable +
        inventoryValuation,
  );

  // -------------------------------------------------------
  // LIABILITIES
  // -------------------------------------------------------

  const liabilities =
    data.liabilities &&
    typeof data.liabilities === 'object'
      ? data.liabilities
      : {};

  const currentLiabilities =
    liabilities.currentLiabilities &&
    typeof liabilities.currentLiabilities ===
      'object'
      ? liabilities.currentLiabilities
      : {};

  const accountsPayable = Number(
    currentLiabilities.accountsPayable ??
      0,
  );

  const totalLiabilities =
    Number(
      liabilities.totalLiabilities ??
        accountsPayable,
    );

  // -------------------------------------------------------
  // EQUITY
  // -------------------------------------------------------

  const equity =
    data.equity &&
    typeof data.equity === 'object'
      ? data.equity
      : {};

  const retainedEarnings = Number(
    equity.retainedEarnings ?? 0,
  );

  const netWorkingCapital = Number(
    equity.netWorkingCapital ?? 0,
  );

  const totalLiabilitiesAndEquity =
    Number(
      equity.totalLiabilitiesAndEquity ??
        totalLiabilities +
          retainedEarnings,
    );

  // Actual accounting equity
  const totalEquity =
    totalAssets -
    totalLiabilities;

  const asOfDate =
    data.asOfDate ??
    report?.asOfDate;

  this.addHeader(
    doc,
    'BALANCE SHEET',
    asOfDate
      ? `As of ${this.formatDate(
          asOfDate,
        )}`
      : 'Financial Position',
  );

  // -------------------------------------------------------
  // SUMMARY CARDS
  // -------------------------------------------------------

  this.addSummaryCards(doc, [
    {
      label: 'Total Assets',
      value: this.formatCurrency(
        totalAssets,
      ),
    },
    {
      label: 'Total Liabilities',
      value: this.formatCurrency(
        totalLiabilities,
      ),
    },
    {
      label: 'Total Equity',
      value: this.formatCurrency(
        totalEquity,
      ),
    },
  ]);

  // -------------------------------------------------------
  // ASSETS
  // -------------------------------------------------------

  this.addSectionTitle(
    doc,
    'ASSETS',
  );

  const assetRows: string[][] = [
    [
      'Cash on Hand',
      this.formatCurrency(
        cashOnHand,
      ),
    ],
    [
      'Bank Accounts',
      this.formatCurrency(
        bankAccounts,
      ),
    ],
    [
      'Accounts Receivable',
      this.formatCurrency(
        accountsReceivable,
      ),
    ],
    [
      'Inventory Valuation',
      this.formatCurrency(
        inventoryValuation,
      ),
    ],
    [
      'TOTAL ASSETS',
      this.formatCurrency(
        totalAssets,
      ),
    ],
  ];

  this.addTable(
    doc,
    [
      'Particular',
      'Amount',
    ],
    assetRows,
  );

  // -------------------------------------------------------
  // LIABILITIES
  // -------------------------------------------------------

  this.addSectionTitle(
    doc,
    'LIABILITIES',
  );

  const liabilityRows: string[][] = [
    [
      'Accounts Payable',
      this.formatCurrency(
        accountsPayable,
      ),
    ],
    [
      'TOTAL LIABILITIES',
      this.formatCurrency(
        totalLiabilities,
      ),
    ],
  ];

  this.addTable(
    doc,
    [
      'Particular',
      'Amount',
    ],
    liabilityRows,
  );

  // -------------------------------------------------------
  // EQUITY
  // -------------------------------------------------------

  this.addSectionTitle(
    doc,
    'EQUITY',
  );

  const equityRows: string[][] = [
    [
      'Retained Earnings',
      this.formatCurrency(
        retainedEarnings,
      ),
    ],
    [
      'Net Working Capital',
      this.formatCurrency(
        netWorkingCapital,
      ),
    ],
    [
      'Total Equity',
      this.formatCurrency(
        totalEquity,
      ),
    ],
    [
      'Liabilities + Equity',
      this.formatCurrency(
        totalLiabilitiesAndEquity,
      ),
    ],
  ];

  this.addTable(
    doc,
    [
      'Particular',
      'Amount',
    ],
    equityRows,
  );

  // -------------------------------------------------------
  // TOTALS
  // -------------------------------------------------------

  this.addTotalsBox(doc, [
    [
      'TOTAL ASSETS',
      this.formatCurrency(
        totalAssets,
      ),
    ],
    [
      'TOTAL LIABILITIES',
      this.formatCurrency(
        totalLiabilities,
      ),
    ],
    [
      'TOTAL EQUITY',
      this.formatCurrency(
        totalEquity,
      ),
    ],
    [
      'LIABILITIES + EQUITY',
      this.formatCurrency(
        totalLiabilitiesAndEquity,
      ),
    ],
  ]);

  this.addFooter(doc);

  return this.finalizeDocument(doc);
}
  // =========================================================
  // FINANCE - CASH FLOW
  // =========================================================

  async generateCashFlowPdf(report: any): Promise<Buffer> {
  const doc = this.createDocument();

  const data =
    report?.data &&
    typeof report.data === 'object'
      ? report.data
      : report ?? {};

  // =========================================================
  // CASH FLOW VALUES
  // =========================================================

  const openingCash = Number(
    data.openingBalance?.cash ?? 0,
  );

  const openingBank = Number(
    data.openingBalance?.bank ?? 0,
  );

  const openingTotal = Number(
    data.openingBalance?.total ??
      openingCash + openingBank,
  );

  const cashIn = Number(
    data.inflows?.cashIn ?? 0,
  );

  const bankIn = Number(
    data.inflows?.bankIn ?? 0,
  );

  const totalInflows = Number(
    data.inflows?.total ??
      cashIn + bankIn,
  );

  const cashOut = Number(
    data.outflows?.cashOut ?? 0,
  );

  const bankOut = Number(
    data.outflows?.bankOut ?? 0,
  );

  const totalOutflows = Number(
    data.outflows?.total ??
      cashOut + bankOut,
  );

  const netCashFlow = Number(
    data.netCashFlow ??
      totalInflows - totalOutflows,
  );

  const closingCash = Number(
    data.closingBalance?.cash ??
      openingCash + cashIn - cashOut,
  );

  const closingBank = Number(
    data.closingBalance?.bank ??
      openingBank + bankIn - bankOut,
  );

  const closingTotal = Number(
    data.closingBalance?.total ??
      closingCash + closingBank,
  );

  const period =
    data.period ??
    report?.period ??
    null;

  // =========================================================
  // HEADER
  // =========================================================

  this.addHeader(
    doc,
    'CASH FLOW STATEMENT',
    this.getPeriodText(period),
  );

  // =========================================================
  // SUMMARY CARDS
  // =========================================================

  this.addSummaryCards(doc, [
    {
      label: 'Opening Balance',
      value: this.formatCurrency(openingTotal),
    },
    {
      label: 'Total Inflows',
      value: this.formatCurrency(totalInflows),
    },
    {
      label: 'Closing Balance',
      value: this.formatCurrency(closingTotal),
    },
  ]);

  // =========================================================
  // CASH FLOW SUMMARY
  // =========================================================

  this.addSectionTitle(
    doc,
    'Cash Flow Summary',
  );

  const summaryRows = [
    [
      'Opening Cash Balance',
      this.formatCurrency(openingCash),
    ],
    [
      'Opening Bank Balance',
      this.formatCurrency(openingBank),
    ],
    [
      'Opening Total Balance',
      this.formatCurrency(openingTotal),
    ],

    [
      'Cash Inflows',
      this.formatCurrency(cashIn),
    ],
    [
      'Bank Inflows',
      this.formatCurrency(bankIn),
    ],
    [
      'Total Cash Inflows',
      this.formatCurrency(totalInflows),
    ],

    [
      'Cash Outflows',
      this.formatCurrency(cashOut),
    ],
    [
      'Bank Outflows',
      this.formatCurrency(bankOut),
    ],
    [
      'Total Cash Outflows',
      this.formatCurrency(totalOutflows),
    ],

    [
      'Net Cash Flow',
      this.formatCurrency(netCashFlow),
    ],

    [
      'Closing Cash Balance',
      this.formatCurrency(closingCash),
    ],
    [
      'Closing Bank Balance',
      this.formatCurrency(closingBank),
    ],
    [
      'Closing Total Balance',
      this.formatCurrency(closingTotal),
    ],
  ];

  this.addTable(
    doc,
    ['Particular', 'Amount'],
    summaryRows,
  );

  // =========================================================
  // OPTIONAL TRANSACTION DETAILS
  // =========================================================

  const records = this.getRecords(report);

  if (records.length > 0) {
    this.addSectionTitle(
      doc,
      'Cash Flow Transactions',
    );

    const detailRows = records.map(
      (item: any) => [
        this.formatDate(
          item.date ??
            item.transactionDate,
        ),

        String(
          item.type ??
            item.category ??
            '-',
        ),

        String(
          item.description ??
            item.reference ??
            '-',
        ),

        this.formatCurrency(
          Number(
            item.inflow ??
              item.cashIn ??
              item.bankIn ??
              0,
          ),
        ),

        this.formatCurrency(
          Number(
            item.outflow ??
              item.cashOut ??
              item.bankOut ??
              0,
          ),
        ),
      ],
    );

    this.addTable(
      doc,
      [
        'Date',
        'Type',
        'Description',
        'Inflow',
        'Outflow',
      ],
      detailRows,
    );
  }

  // =========================================================
  // TOTALS BOX
  // =========================================================

  this.addTotalsBox(doc, [
    [
      'OPENING BALANCE',
      this.formatCurrency(openingTotal),
    ],
    [
      'TOTAL INFLOWS',
      this.formatCurrency(totalInflows),
    ],
    [
      'TOTAL OUTFLOWS',
      this.formatCurrency(totalOutflows),
    ],
    [
      'NET CASH FLOW',
      this.formatCurrency(netCashFlow),
    ],
    [
      'CLOSING BALANCE',
      this.formatCurrency(closingTotal),
    ],
  ]);

  // =========================================================
  // FOOTER
  // =========================================================

  this.addFooter(doc);

  return this.finalizeDocument(doc);
}
  // =========================================================
  // COMMON DOCUMENT
  // =========================================================

  private createDocument(): PDFKit.PDFDocument {
    return new PDFDocument({
      size: 'A4',
      layout: 'portrait',

      margins: {
        top: 40,
        bottom: 50,
        left: 40,
        right: 40,
      },

      bufferPages: true,

      info: {
        Title:
          'Poobalasingham Book Depot - ERP Report',
        Author:
          'Poobalasingham Book Depot ERP',
        Subject:
          'ERP Report',
      },
    });
  }

  // =========================================================
  // HEADER
  // =========================================================

  private addHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    period: string,
  ): void {
    const headerTop = 35;

    // -------------------------------------------------------
    // LOGO
    // -------------------------------------------------------

    if (fs.existsSync(this.logoPath)) {
      try {
        doc.image(
          this.logoPath,
          40,
          headerTop,
          {
            fit: [65, 55],
            valign: 'center',
          },
        );
      } catch (error) {
        console.warn(
          'Unable to load report logo:',
          error,
        );
      }
    }

    // -------------------------------------------------------
    // COMPANY NAME
    // -------------------------------------------------------

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#1f2937')
      .text(
        this.companyName,
        120,
        38,
        {
          width: 350,
          lineBreak: false,
        },
      );

    // -------------------------------------------------------
    // SYSTEM NAME
    // -------------------------------------------------------

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text(
        this.systemName,
        120,
        59,
        {
          width: 350,
          lineBreak: false,
        },
      );

    // -------------------------------------------------------
    // GENERATED DATE
    // -------------------------------------------------------

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#4b5563')
      .text(
        `Generated On: ${this.formatDateTime(
          new Date(),
        )}`,
        390,
        42,
        {
          width: 165,
          align: 'right',
        },
      );

    // -------------------------------------------------------
    // REPORT TITLE
    // -------------------------------------------------------

    doc
      .font('Helvetica-Bold')
      .fontSize(17)
      .fillColor('#111827')
      .text(
        title,
        40,
        105,
        {
          width: 515,
          lineBreak: false,
        },
      );

    // -------------------------------------------------------
    // PERIOD
    // -------------------------------------------------------

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#4b5563')
      .text(
        `Report Period: ${
          period ?? 'All Period'
        }`,
        40,
        128,
        {
          width: 515,
          lineBreak: false,
        },
      );

    // -------------------------------------------------------
    // BLUE LINE
    // -------------------------------------------------------

    doc
      .moveTo(40, 150)
      .lineTo(555, 150)
      .lineWidth(2)
      .strokeColor('#2563eb')
      .stroke();

    doc.y = 165;
  }

  // =========================================================
  // SUMMARY CARDS
  // =========================================================

  private addSummaryCards(
    doc: PDFKit.PDFDocument,
    cards: {
      label: string;
      value: string;
    }[],
  ): void {
    const startX = 40;
    const startY = doc.y;

    const cardWidth = 160;
    const cardHeight = 58;
    const gap = 17;

    cards.forEach(
      (card, index) => {
        const x =
          startX +
          index *
            (cardWidth + gap);

        doc
          .roundedRect(
            x,
            startY,
            cardWidth,
            cardHeight,
            4,
          )
          .fillColor('#f3f6fb')
          .fill();

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#6b7280')
          .text(
            card.label,
            x + 10,
            startY + 10,
            {
              width:
                cardWidth - 20,
              lineBreak: false,
            },
          );

        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#1f2937')
          .text(
            card.value,
            x + 10,
            startY + 29,
            {
              width:
                cardWidth - 20,
              lineBreak: false,
            },
          );
      },
    );

    doc.y =
      startY +
      cardHeight +
      25;
  }

  // =========================================================
  // SECTION TITLE
  // =========================================================

  private addSectionTitle(
    doc: PDFKit.PDFDocument,
    title: string,
  ): void {
    const requiredHeight = 25;

    this.ensureSpace(
      doc,
      requiredHeight,
    );

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1f2937')
      .text(
        title,
        40,
        doc.y,
        {
          width: 515,
          lineBreak: false,
        },
      );

    doc.moveDown(0.5);
  }

  // =========================================================
  // COMMON TABLE
  // =========================================================

  private addTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: string[][],
  ): void {
    const pageWidth = 515;
    const columnWidth =
      pageWidth / headers.length;

    const rowHeight = 22;

    const topLimit =
      doc.page.margins.top;

    const bottomLimit =
      doc.page.height -
      doc.page.margins.bottom -
      15;

    let y = doc.y;

    // -------------------------------------------------------
    // Start table on new page if header doesn't fit
    // -------------------------------------------------------

    if (
      y + rowHeight >
      bottomLimit
    ) {
      doc.addPage();
      y = topLimit;
    }

    // -------------------------------------------------------
    // Draw Table Header
    // -------------------------------------------------------

    const drawHeader = () => {
      doc
        .rect(
          40,
          y,
          pageWidth,
          rowHeight,
        )
        .fillColor('#eef2f7')
        .fill();

      headers.forEach(
        (header, index) => {
          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor('#374151')
            .text(
              String(
                header ?? '',
              ),
              40 +
                index *
                  columnWidth +
                4,
              y + 7,
              {
                width:
                  columnWidth - 8,
                height:
                  rowHeight - 4,
                lineBreak: false,
                ellipsis: true,
                align:
                  index >= 3
                    ? 'right'
                    : 'left',
              },
            );
        },
      );

      y += rowHeight;
    };

    drawHeader();

    // -------------------------------------------------------
    // Rows
    // -------------------------------------------------------

    rows.forEach(
      (row) => {
        // Check BEFORE drawing row
        if (
          y + rowHeight >
          bottomLimit
        ) {
          doc.addPage();

          y = topLimit;

          // Repeat header
          drawHeader();
        }

        row.forEach(
          (value, index) => {
            doc
              .font('Helvetica')
              .fontSize(7)
              .fillColor('#374151')
              .text(
                String(
                  value ?? '',
                ),
                40 +
                  index *
                    columnWidth +
                  4,
                y + 7,
                {
                  width:
                    columnWidth - 8,
                  height:
                    rowHeight - 4,
                  ellipsis: true,
                  lineBreak: false,
                  align:
                    index >= 3
                      ? 'right'
                      : 'left',
                },
              );
          },
        );

        doc
          .moveTo(
            40,
            y + rowHeight,
          )
          .lineTo(
            40 + pageWidth,
            y + rowHeight,
          )
          .lineWidth(0.5)
          .strokeColor('#d1d5db')
          .stroke();

        y += rowHeight;
      },
    );

    doc.y = y + 8;
  }

  // =========================================================
  // TOTALS BOX
  // =========================================================

  private addTotalsBox(
    doc: PDFKit.PDFDocument,
    rows: [string, string][],
  ): void {
    const boxWidth = 250;
    const x = 305;

    const height =
      rows.length * 21 + 12;

    const bottomLimit =
      doc.page.height -
      doc.page.margins.bottom -
      15;

    let y = doc.y;

    // -------------------------------------------------------
    // Move totals box to a new page if required
    // -------------------------------------------------------

    if (
      y + height >
      bottomLimit
    ) {
      doc.addPage();

      y =
        doc.page.margins.top;
    }

    // -------------------------------------------------------
    // Box
    // -------------------------------------------------------

    doc
      .rect(
        x,
        y,
        boxWidth,
        height,
      )
      .fillColor('#f8fafc')
      .fill();

    // -------------------------------------------------------
    // Rows
    // -------------------------------------------------------

    rows.forEach(
      ([label, value], index) => {
        const rowY =
          y +
          8 +
          index * 21;

        const isNet =
          label === 'NET SALES' ||
          label === 'NET PROFIT' ||
          label === 'NET CASH FLOW' ||
          label === 'GROSS PROFIT' ||
          label === 'TOTAL PROFIT' ||
          label === 'TOTAL SALES' ||
          label === 'TOTAL VALUE' ||
          label === 'TOTAL EXPENSES' ||
          label ===
            'TOTAL PURCHASE AMOUNT' ||
          label ===
            'TOTAL OUTSTANDING' ||
          label === 'NET POSITION';

        doc
          .font(
            isNet
              ? 'Helvetica-Bold'
              : 'Helvetica',
          )
          .fontSize(
            isNet ? 10 : 8.5,
          )
          .fillColor('#1f2937')
          .text(
            label,
            x + 10,
            rowY,
            {
              width: 110,
              lineBreak: false,
            },
          );

        doc
          .font(
            isNet
              ? 'Helvetica-Bold'
              : 'Helvetica',
          )
          .fontSize(
            isNet ? 10 : 8.5,
          )
          .fillColor('#1f2937')
          .text(
            value,
            x + 125,
            rowY,
            {
              width: 115,
              align: 'right',
              lineBreak: false,
            },
          );

        if (isNet) {
          doc
            .moveTo(
              x + 10,
              rowY - 4,
            )
            .lineTo(
              x +
                boxWidth -
                10,
              rowY - 4,
            )
            .lineWidth(0.8)
            .strokeColor(
              '#9ca3af',
            )
            .stroke();
        }
      },
    );

    doc.y =
      y +
      height +
      12;
  }

  // =========================================================
  // FOOTER
  // =========================================================

  private addFooter(
    doc: PDFKit.PDFDocument,
  ): void {
    const range =
      doc.bufferedPageRange();

    const totalPages =
      range.count;

    for (
      let i = range.start;
      i <
      range.start +
        range.count;
      i++
    ) {
      doc.switchToPage(i);

      const pageHeight =
        doc.page.height;

      const footerY =
        pageHeight -
        doc.page.margins.bottom -
        28;

      // -----------------------------------------------------
      // Footer Line
      // -----------------------------------------------------

      doc
        .moveTo(
          40,
          footerY - 6,
        )
        .lineTo(
          555,
          footerY - 6,
        )
        .lineWidth(0.5)
        .strokeColor('#d1d5db')
        .stroke();

      // -----------------------------------------------------
      // Company
      // -----------------------------------------------------

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#6b7280')
        .text(
          this.companyName,
          40,
          footerY,
          {
            width: 145,
            height: 9,
            lineBreak: false,
          },
        );

      // -----------------------------------------------------
      // System
      // -----------------------------------------------------

      doc.text(
        this.systemName,
        40,
        footerY + 10,
        {
          width: 145,
          height: 9,
          lineBreak: false,
        },
      );

      // -----------------------------------------------------
      // Generated By
      // -----------------------------------------------------

      doc.text(
        'Generated by: NodeKidos',
        190,
        footerY,
        {
          width: 180,
          height: 9,
          align: 'center',
          lineBreak: false,
        },
      );

      // -----------------------------------------------------
      // Page Number
      // -----------------------------------------------------

      doc.text(
        `Page ${
          i + 1
        } of ${totalPages}`,
        420,
        footerY,
        {
          width: 135,
          height: 9,
          align: 'right',
          lineBreak: false,
        },
      );
    }
  }

  // =========================================================
  // ENSURE SPACE
  // =========================================================

  private ensureSpace(
    doc: PDFKit.PDFDocument,
    requiredHeight: number,
  ): void {
    const bottomLimit =
      doc.page.height -
      doc.page.margins.bottom -
      15;

    if (
      doc.y +
        requiredHeight >
      bottomLimit
    ) {
      doc.addPage();

      doc.y =
        doc.page.margins.top;
    }
  }

  // =========================================================
  // FINALIZE
  // =========================================================

  private finalizeDocument(
    doc: PDFKit.PDFDocument,
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];

    return new Promise<Buffer>(
      (resolve, reject) => {
        doc.on(
          'data',
          (chunk) => {
            chunks.push(
              Buffer.from(chunk),
            );
          },
        );

        doc.on(
          'end',
          () => {
            resolve(
              Buffer.concat(chunks),
            );
          },
        );

        doc.on(
          'error',
          reject,
        );

        doc.end();
      },
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  private getRecords(
    report: any,
  ): any[] {
    if (!report) {
      return [];
    }

    if (
      Array.isArray(
        report.records,
      )
    ) {
      return report.records;
    }

    if (
      Array.isArray(
        report.data,
      )
    ) {
      return report.data;
    }

    if (
      Array.isArray(
        report.items,
      )
    ) {
      return report.items;
    }

    if (
      Array.isArray(
        report.results,
      )
    ) {
      return report.results;
    }

    return [];
  }

  // =========================================================
  // CURRENCY
  // =========================================================

  private formatCurrency(
    value: number,
  ): string {
    return `Rs. ${this.formatNumber(
      Number(value ?? 0),
    )}`;
  }

  // =========================================================
  // NUMBER
  // =========================================================

  private formatNumber(
    value: number,
  ): string {
    return Number(
      value || 0,
    ).toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    );
  }

  // =========================================================
  // DATE
  // =========================================================

  private formatDate(
    value: string | Date,
  ): string {
    const date =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '';
    }

    return date.toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );
  }

  // =========================================================
  // SHORT DATE
  // =========================================================

  private formatShortDate(
    value: string | Date,
  ): string {
    return this.formatDate(value);
  }

  // =========================================================
  // DATE TIME
  // =========================================================

  private formatDateTime(
    value: Date,
  ): string {
    return value.toLocaleString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  }

  // =========================================================
  // MONTH NAME
  // =========================================================

  private getMonthName(
    month: number,
  ): string {
    return new Date(
      2000,
      month - 1,
      1,
    ).toLocaleString(
      'en-US',
      {
        month: 'long',
      },
    );
  }

  // =========================================================
  // SUM RECORDS
  // =========================================================

  private sumRecords(
    records: any[],
    field: string,
  ): number {
    return records.reduce(
      (
        total,
        record,
      ) =>
        total +
        Number(
          record?.[field] || 0,
        ),
      0,
    );
  }

  // =========================================================
  // PERIOD TEXT
  // =========================================================

 private getPeriodText(
  period: any,
): string {
  if (!period) {
    return 'All Period';
  }

  if (
    typeof period === 'string'
  ) {
    return period;
  }

  const start =
    period.startDate;

  const end =
    period.endDate;

  if (start && end) {
    return `${this.formatDate(
      start,
    )} - ${this.formatDate(
      end,
    )}`;
  }

  if (start) {
    return `From ${this.formatDate(
      start,
    )}`;
  }

  if (end) {
    return `Up to ${this.formatDate(
      end,
    )}`;
  }

  return 'All Period';
}
}