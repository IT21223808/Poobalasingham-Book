import { Injectable } from '@nestjs/common';

import { ReportsService } from '../reports.service';
import { ReportQueryDto } from '../dto/report-query.dto';
import { FinanceService } from '../../finance/finance.service';

@Injectable()
export class ReportCsvService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly financeService: FinanceService,
  ) {}

  // =========================================================
  // 1. DAILY SALES CSV
  // =========================================================

  async exportDailySalesCsv(
    date?: string,
  ): Promise<string> {
    const report =
      await this.reportsService.getDailySalesReport(
        date,
      );

    const headers = [
      'Invoice_Number',
      'Sale_Date',
      'Customer',
      'Subtotal',
      'Discount',
      'Gross_Total',
      'Return_Amount',
      'Net_Amount',
      'Status',
    ];

    const records = this.toRows(
      (report as any)?.records,
    );

    const rows = records.map(
      (record: any) => ({
        Invoice_Number:
          record.invoiceNumber ?? '',

        Sale_Date:
          record.saleDate ?? '',

        Customer:
          record.customerName ?? '',

        Subtotal:
          record.subtotal ?? 0,

        Discount:
          record.discountAmount ?? 0,

        Gross_Total:
          record.grandTotal ?? 0,

        Return_Amount:
          record.returnAmount ?? 0,

        Net_Amount:
          record.netAmount ?? 0,

        Status:
          record.status ?? '',
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 2. MONTHLY SALES CSV
  // =========================================================

  async exportMonthlySalesCsv(
    year?: number,
    month?: number,
  ): Promise<string> {
    const report =
      await this.reportsService.getMonthlySalesReport(
        year,
        month,
      );

    const headers = [
      'Date',
      'Invoice_Count',
      'Gross_Sales',
      'Discount',
      'Return_Amount',
      'Net_Sales',
    ];

    const records = this.toRows(
      (report as any)?.dailyBreakdown,
    );

    const rows = records.map(
      (record: any) => ({
        Date:
          record.date ?? '',

        Invoice_Count:
          record.invoiceCount ?? 0,

        Gross_Sales:
          record.grossSales ?? 0,

        Discount:
          record.discountAmount ?? 0,

        Return_Amount:
          record.returnAmount ?? 0,

        Net_Sales:
          record.netSales ?? 0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 3. ANNUAL SALES CSV
  // =========================================================

  async exportAnnualSalesCsv(
    year?: number,
  ): Promise<string> {
    const report =
      await this.reportsService.getAnnualSalesReport(
        year,
      );

    const headers = [
      'Month',
      'Invoice_Count',
      'Gross_Sales',
      'Discount',
      'Return_Amount',
      'Net_Sales',
    ];

    const records = this.toRows(
      (report as any)?.monthlyBreakdown,
    );

    const rows = records.map(
      (record: any) => ({
        Month:
          record.month ?? '',

        Invoice_Count:
          record.invoiceCount ?? 0,

        Gross_Sales:
          record.grossSales ?? 0,

        Discount:
          record.discountAmount ?? 0,

        Return_Amount:
          record.returnAmount ?? 0,

        Net_Sales:
          record.netSales ?? 0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 4. CATEGORY-WISE SALES CSV
  // =========================================================

  async exportCategoryWiseSalesCsv(
    query: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getCategoryWiseSales(
        query,
      );

    const headers = [
      'Category',
      'Quantity_Sold',
      'Gross_Sales',
      'Discount',
      'Return_Amount',
      'Net_Sales',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        Category:
          record.category ??
          record.categoryName ??
          '',

        Quantity_Sold:
          record.quantitySold ??
          record.qtySold ??
          record.totalQuantity ??
          0,

        Gross_Sales:
          record.grossSales ??
          record.grossTotal ??
          0,

        Discount:
          record.discountAmount ??
          record.discount ??
          0,

        Return_Amount:
          record.returnAmount ?? 0,

        Net_Sales:
          record.netSales ??
          record.netAmount ??
          record.revenue ??
          0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 5. PRODUCT-WISE SALES CSV
  // =========================================================

  async exportProductWiseSalesCsv(
    query: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getProductWiseSales(
        query,
      );

    const headers = [
      'Product_Code',
      'Product_Name',
      'Quantity_Sold',
      'Gross_Sales',
      'Discount',
      'Return_Amount',
      'Net_Sales',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        Product_Code:
          record.productCode ??
          record.code ??
          '',

        Product_Name:
          record.productName ??
          record.name ??
          '',

        Quantity_Sold:
          record.quantitySold ??
          record.qtySold ??
          record.totalQuantity ??
          0,

        Gross_Sales:
          record.grossSales ??
          record.grossTotal ??
          record.revenue ??
          0,

        Discount:
          record.discountAmount ??
          record.discount ??
          0,

        Return_Amount:
          record.returnAmount ?? 0,

        Net_Sales:
          record.netSales ??
          record.netAmount ??
          record.revenue ??
          0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 6. PROFIT ANALYSIS CSV
  // =========================================================

  async exportProfitAnalysisCsv(
    query: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getProfitAnalysis(
        query,
      );

    const headers = [
      'Product',
      'Quantity_Sold',
      'Sales_Amount',
      'Cost_Amount',
      'Gross_Profit',
      'Profit_Margin',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        Product:
          record.productName ??
          record.product ??
          '',

        Quantity_Sold:
          record.quantitySold ??
          record.qtySold ??
          record.totalQuantity ??
          0,

        Sales_Amount:
          record.salesAmount ??
          record.sales ??
          record.netSales ??
          record.revenue ??
          0,

        Cost_Amount:
          record.costAmount ??
          record.cost ??
          0,

        Gross_Profit:
          record.grossProfit ??
          record.profit ??
          0,

        Profit_Margin:
          record.profitMargin ??
          record.margin ??
          0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 7. BEST-SELLING PRODUCTS CSV
  // =========================================================

  async exportBestSellingProductsCsv(
    query: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getBestSellingProducts(
        query,
      );

    const headers = [
      'Rank',
      'Product_Code',
      'Product_Name',
      'Category',
      'Quantity_Sold',
      'Sales_Amount',
      'Profit',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (
        record: any,
        index: number,
      ) => ({
        Rank:
          record.rank ??
          index + 1,

        Product_Code:
          record.productCode ??
          record.code ??
          '',

        Product_Name:
          record.productName ??
          record.name ??
          '',

        Category:
          record.categoryName ??
          record.category ??
          '',

        Quantity_Sold:
          record.qtySold ??
          record.quantitySold ??
          record.totalQuantity ??
          0,

        Sales_Amount:
          record.revenue ??
          record.salesAmount ??
          record.netSales ??
          record.totalSales ??
          0,

        Profit:
          record.profit ?? 0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 8. SLOW-MOVING PRODUCTS CSV
  // =========================================================

  async exportSlowMovingProductsCsv(
    query: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getSlowMovingProducts(
        query,
      );

    const headers = [
      'Product_Code',
      'Product_Name',
      'Current_Stock',
      'Quantity_Sold',
      'Last_Sale_Date',
      'Days_Since_Last_Sale',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        Product_Code:
          record.productCode ??
          record.code ??
          '',

        Product_Name:
          record.productName ??
          record.name ??
          '',

        Current_Stock:
          record.currentStock ??
          record.stockQuantity ??
          record.stock ??
          0,

        Quantity_Sold:
          record.quantitySold ??
          record.qtySold ??
          record.totalQuantity ??
          0,

        Last_Sale_Date:
          record.lastSaleDate ??
          '',

        Days_Since_Last_Sale:
          record.daysSinceLastSale ??
          record.daysSinceSale ??
          0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 9. DEAD STOCK CSV
  // =========================================================

  async exportDeadStockCsv(
    query: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getDeadStock(
        query,
      );

    const headers = [
      'Product_Code',
      'Product_Name',
      'Current_Stock',
      'Purchase_Price',
      'Stock_Value',
      'Last_Sale_Date',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        Product_Code:
          record.productCode ??
          record.code ??
          '',

        Product_Name:
          record.productName ??
          record.name ??
          '',

        Current_Stock:
          record.currentStock ??
          record.stockQuantity ??
          record.stock ??
          0,

        Purchase_Price:
          record.purchasePrice ??
          record.costPrice ??
          0,

        Stock_Value:
          record.stockValue ?? 0,

        Last_Sale_Date:
          record.lastSaleDate ??
          '',
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  
async exportExpenseCsv(
  query?: ReportQueryDto,
): Promise<string> {
  const report =
    await this.reportsService.getExpenseReport(query);

  const rows = this.toRows(report);

  if (!rows.length) {
    return [
      'Expense Report',
      '',
      'No expense records found',
    ].join('\n');
  }

  const headers = [
    'Transaction ID',
    'Transaction Number',
    'Expense Date',
    'Category',
    'Description',
    'Payment Method',
    'Reference',
    'Amount',
    'Supplier Code',
    'Supplier Name',
    'Purchase Invoice Number',
  ];

  const escapeCsv = (value: any): string => {
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    const text = String(value);

    if (
      text.includes(',') ||
      text.includes('"') ||
      text.includes('\n')
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const csvRows = rows.map((row: any) =>
    [
      row.transactionId,
      row.transactionNumber,
      row.expenseDate,
      row.category,
      row.description,
      row.paymentMethod,
      row.reference,
      row.amount,
      row.supplierCode,
      row.supplierName,
      row.purchaseInvoiceNumber,
    ]
      .map(escapeCsv)
      .join(','),
  );

  return [
    headers.map(escapeCsv).join(','),
    ...csvRows,
  ].join('\n');
}
  // =========================================================
  // 10. SUPPLIER REPORT CSV
  // =========================================================

  async exportSupplierReportCsv(
    query: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getSupplierReport(
        query,
      );

    const headers = [
      'Supplier_Code',
      'Supplier_Name',
      'Contact_Person',
      'Phone',
      'Email',
      'City',
      'Country',
      'Payment_Terms',
      'Credit_Limit',
      'Purchase_Orders',
      'Purchase_Amount',
      'Draft_Orders',
      'Pending_Orders',
      'Approved_Orders',
      'Partially_Received',
      'Received_Orders',
      'Status',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        Supplier_Code:
          record.supplierCode ?? '',

        Supplier_Name:
          record.supplierName ?? '',

        Contact_Person:
          record.contactPerson ?? '',

        Phone:
          record.phone ?? '',

        Email:
          record.email ?? '',

        City:
          record.city ?? '',

        Country:
          record.country ?? '',

        Payment_Terms:
          record.paymentTerms ?? '',

        Credit_Limit:
          record.creditLimit ?? 0,

        Purchase_Orders:
          record.totalPurchaseOrders ?? 0,

        Purchase_Amount:
          record.totalPurchaseAmount ?? 0,

        Draft_Orders:
          record.draftOrders ?? 0,

        Pending_Orders:
          record.pendingOrders ?? 0,

        Approved_Orders:
          record.approvedOrders ?? 0,

        Partially_Received:
          record.partiallyReceivedOrders ?? 0,

        Received_Orders:
          record.receivedOrders ?? 0,

        Status:
          record.status ?? '',
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 11. CUSTOMER REPORT CSV
  // =========================================================

  async exportCustomerReportCsv(
    query?: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getCustomerReport(
        query,
      );

    const headers = [
      'Customer_Code',
      'Customer_Name',
      'Phone',
      'Email',
      'Address',
      'City',
      'Total_Orders',
      'Total_Sales',
      'Total_Paid',
      'Outstanding',
      'Last_Purchase_Date',
      'Status',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (customer: any) => ({
        Customer_Code:
          customer.customerCode ?? '',

        Customer_Name:
          customer.customerName ?? '',

        Phone:
          customer.phone ?? '',

        Email:
          customer.email ?? '',

        Address:
          customer.address ?? '',

        City:
          customer.city ?? '',

        Total_Orders:
          customer.totalOrders ?? 0,

        Total_Sales:
          customer.totalSalesAmount ?? 0,

        Total_Paid:
          customer.totalPaidAmount ?? 0,

        Outstanding:
          customer.outstandingAmount ?? 0,

        Last_Purchase_Date:
          customer.lastPurchaseDate ?? '',

        Status:
          customer.status ?? '',
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 12. PURCHASE REPORT CSV
  // =========================================================

  async exportPurchaseReportCsv(
    query?: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getPurchaseReport(
        query,
      );

    const headers = [
      'PO_Number',
      'Supplier_Code',
      'Supplier_Name',
      'PO_Date',
      'Expected_Delivery_Date',
      'Status',
      'Total_Items',
      'Ordered_Quantity',
      'Received_Quantity',
      'Outstanding_Quantity',
      'Received_Percentage',
      'Receiving_Status',
      'Total_Amount',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        PO_Number:
          record.poNumber ?? '',

        Supplier_Code:
          record.supplierCode ?? '',

        Supplier_Name:
          record.supplierName ?? '',

        PO_Date:
          record.poDate ?? '',

        Expected_Delivery_Date:
          record.expectedDeliveryDate ??
          '',

        Status:
          record.status ?? '',

        Total_Items:
          record.totalItems ?? 0,

        Ordered_Quantity:
          record.totalQuantity ?? 0,

        Received_Quantity:
          record.receivedQuantity ?? 0,

        Outstanding_Quantity:
          record.outstandingQuantity ??
          0,

        Received_Percentage:
          record.receivedPercentage ?? 0,

        Receiving_Status:
          record.receivingStatus ?? '',

        Total_Amount:
          record.totalAmount ?? 0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 13. EXPENSE REPORT CSV
  // =========================================================

  async exportExpenseReportCsv(
    query?: ReportQueryDto,
  ): Promise<string> {
    const report =
      await this.reportsService.getExpenseReport(
        query,
      );

    const headers = [
      'Expense_Date',
      'Transaction_Number',
      'Category',
      'Description',
      'Payment_Method',
      'Reference',
      'Supplier_Code',
      'Supplier_Name',
      'Purchase_Invoice',
      'Amount',
    ];

    const records =
      this.toRows(report);

    const rows = records.map(
      (record: any) => ({
        Expense_Date:
          record.expenseDate ?? '',

        Transaction_Number:
          record.transactionNumber ?? '',

        Category:
          record.category ?? '',

        Description:
          record.description ?? '',

        Payment_Method:
          record.paymentMethod ?? '',

        Reference:
          record.reference ?? '',

        Supplier_Code:
          record.supplierCode ?? '',

        Supplier_Name:
          record.supplierName ?? '',

        Purchase_Invoice:
          record.purchaseInvoiceNumber ??
          '',

        Amount:
          record.amount ?? 0,
      }),
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 14. PROFIT & LOSS CSV
  // =========================================================

  async exportProfitLossCsv(
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    const report =
      await this.financeService.getProfitLossReport(
        startDate,
        endDate,
      );

    const data =
      (report as any)?.data ??
      report ??
      {};

    const headers = [
      'Particular',
      'Amount',
    ];

    const rows: Record<
      string,
      unknown
    >[] = [];

    const revenue = Number(
      data.revenue ??
        data.totalRevenue ??
        data.salesRevenue ??
        data.income ??
        0,
    );

    const costOfGoodsSold = Number(
      data.costOfGoodsSold ??
        data.cogs ??
        data.costOfSales ??
        data.totalCostOfGoodsSold ??
        0,
    );

    const grossProfit = Number(
      data.grossProfit ??
        data.grossProfitAmount ??
        revenue - costOfGoodsSold,
    );

    const expenses = Number(
      data.expenses ??
        data.totalExpenses ??
        data.operatingExpenses ??
        0,
    );

    const netProfit = Number(
      data.netProfit ??
        data.netProfitAmount ??
        data.profit ??
        grossProfit - expenses,
    );

    rows.push(
      {
        Particular: 'Revenue',
        Amount: revenue,
      },
      {
        Particular: 'Cost of Goods Sold',
        Amount: costOfGoodsSold,
      },
      {
        Particular: 'Gross Profit',
        Amount: grossProfit,
      },
      {
        Particular: 'Operating Expenses',
        Amount: expenses,
      },
      {
        Particular: 'Net Profit',
        Amount: netProfit,
      },
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 15. BALANCE SHEET CSV
  // =========================================================

  async exportBalanceSheetCsv(
    asOfDate?: string,
  ): Promise<string> {
    const report =
      await this.financeService.getBalanceSheetReport(
        asOfDate,
      );

    const data =
      (report as any)?.data ??
      report ??
      {};

    const headers = [
      'Section',
      'Particular',
      'Amount',
    ];

    const rows: Record<
      string,
      unknown
    >[] = [];

    const assets =
      data.assets ??
      data.totalAssets ??
      {};

    const liabilities =
      data.liabilities ??
      data.totalLiabilities ??
      {};

    const equity =
      data.equity ??
      data.totalEquity ??
      {};

    const totalAssets =
      typeof assets === 'number'
        ? Number(assets)
        : Number(
            data.totalAssets ??
              assets?.total ??
              assets?.amount ??
              0,
          );

    const totalLiabilities =
      typeof liabilities === 'number'
        ? Number(liabilities)
        : Number(
            data.totalLiabilities ??
              liabilities?.total ??
              liabilities?.amount ??
              0,
          );

    const totalEquity =
      typeof equity === 'number'
        ? Number(equity)
        : Number(
            data.totalEquity ??
              equity?.total ??
              equity?.amount ??
              0,
          );

    this.addFinancialSectionRows(
      rows,
      'Assets',
      assets,
      'Total Assets',
      totalAssets,
    );

    this.addFinancialSectionRows(
      rows,
      'Liabilities',
      liabilities,
      'Total Liabilities',
      totalLiabilities,
    );

    this.addFinancialSectionRows(
      rows,
      'Equity',
      equity,
      'Total Equity',
      totalEquity,
    );

    rows.push({
      Section: 'Summary',
      Particular: 'Net Position',
      Amount:
        totalAssets -
        totalLiabilities,
    });

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // 16. CASH FLOW CSV
  // =========================================================

  async exportCashFlowCsv(
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    const report =
      await this.financeService.getCashFlowReport(
        startDate,
        endDate,
      );

    const data =
      (report as any)?.data ??
      report ??
      {};

    const headers = [
      'Particular',
      'Amount',
    ];

    const rows: Record<
      string,
      unknown
    >[] = [];

    const openingBalance = Number(
      data.openingBalance ??
        data.openingCashBalance ??
        data.startingBalance ??
        0,
    );

    const closingBalance = Number(
      data.closingBalance ??
        data.closingCashBalance ??
        data.endingBalance ??
        0,
    );

    const totalInflows = Number(
      data.totalInflows ??
        data.totalInflow ??
        data.cashInflows ??
        data.totalIncome ??
        0,
    );

    const totalOutflows = Number(
      data.totalOutflows ??
        data.totalOutflow ??
        data.cashOutflows ??
        data.totalExpenses ??
        0,
    );

    const netCashFlow = Number(
      data.netCashFlow ??
        data.netCashFlowAmount ??
        totalInflows -
          totalOutflows,
    );

    rows.push(
      {
        Particular:
          'Opening Cash Balance',
        Amount:
          openingBalance,
      },
      {
        Particular:
          'Total Cash Inflows',
        Amount:
          totalInflows,
      },
      {
        Particular:
          'Total Cash Outflows',
        Amount:
          totalOutflows,
      },
      {
        Particular:
          'Net Cash Flow',
        Amount:
          netCashFlow,
      },
      {
        Particular:
          'Closing Cash Balance',
        Amount:
          closingBalance,
      },
    );

    return this.generateCsv(
      headers,
      rows,
    );
  }

  // =========================================================
  // SAFE REPORT → ARRAY CONVERTER
  // =========================================================

  private toRows(
    report: any,
  ): any[] {
    if (Array.isArray(report)) {
      return report;
    }

    if (!report) {
      return [];
    }

    if (Array.isArray(report.data)) {
      return report.data;
    }

    if (Array.isArray(report.records)) {
      return report.records;
    }

    if (Array.isArray(report.items)) {
      return report.items;
    }

    if (Array.isArray(report.results)) {
      return report.results;
    }

    return [];
  }

  // =========================================================
  // FINANCIAL SECTION ROW HELPER
  // =========================================================

  private addFinancialSectionRows(
    rows: Record<string, unknown>[],
    section: string,
    source: any,
    fallbackLabel: string,
    fallbackAmount: number,
  ): void {
    if (
      source &&
      typeof source === 'object' &&
      !Array.isArray(source)
    ) {
      const items =
        source.items ??
        source.accounts ??
        source.breakdown ??
        source.details ??
        [];

      if (Array.isArray(items)) {
        items.forEach(
          (item: any) => {
            rows.push({
              Section: section,

              Particular:
                item.name ??
                item.accountName ??
                item.label ??
                item.particular ??
                '—',

              Amount:
                Number(
                  item.amount ??
                    item.balance ??
                    item.value ??
                    0,
                ),
            });
          },
        );
      }
    }

    if (
      !rows.some(
        (row) =>
          row.Section === section,
      )
    ) {
      rows.push({
        Section: section,
        Particular: fallbackLabel,
        Amount: fallbackAmount,
      });
    }
  }

  // =========================================================
  // COMMON CSV GENERATOR
  // =========================================================

  private generateCsv(
    headers: string[],
    rows: Record<
      string,
      unknown
    >[],
  ): string {
    const escapeCsvValue = (
      value: unknown,
    ): string => {
      if (
        value === null ||
        value === undefined
      ) {
        return '';
      }

      const stringValue =
        String(value);

      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n') ||
        stringValue.includes('\r')
      ) {
        return `"${stringValue.replace(
          /"/g,
          '""',
        )}"`;
      }

      return stringValue;
    };

    const headerLine =
      headers
        .map(escapeCsvValue)
        .join(',');

    const dataLines =
      rows.map(
        (row) =>
          headers
            .map(
              (header) =>
                escapeCsvValue(
                  row[header],
                ),
            )
            .join(','),
      );

    return (
      '\uFEFF' +
      [
        headerLine,
        ...dataLines,
      ].join('\r\n')
    );
  }
}