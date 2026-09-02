import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { ReportsService } from './reports.service';
import { ReportCsvService } from './csv/report-csv.service';
import { ReportPdfService } from './pdf/report-pdf.service';

import {
  AnnualSalesReportDto,
  DailySalesReportDto,
  MonthlySalesReportDto,
} from './dto/sales-report.dto';

import { ReportQueryDto } from './dto/report-query.dto';
import { FinanceService } from '../finance/finance.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportCsvService: ReportCsvService,
    private readonly reportPdfService: ReportPdfService,
    private readonly financeService: FinanceService,
  ) {}

  // =========================================================
  // REPORT DATA
  // =========================================================

  // 1. DAILY SALES
  @Get('sales/daily')
  async getDailySalesReport(
    @Query() query: DailySalesReportDto,
  ) {
    return this.reportsService.getDailySalesReport(
      query.date,
    );
  }

  // 2. MONTHLY SALES
  @Get('sales/monthly')
  async getMonthlySalesReport(
    @Query() query: MonthlySalesReportDto,
  ) {
    return this.reportsService.getMonthlySalesReport(
      query.year,
      query.month,
    );
  }

  // 3. ANNUAL SALES
  @Get('sales/annual')
  async getAnnualSalesReport(
    @Query() query: AnnualSalesReportDto,
  ) {
    return this.reportsService.getAnnualSalesReport(
      query.year,
    );
  }

  // 4. CATEGORY-WISE SALES
  @Get('sales/category-wise')
  async getCategoryWiseSalesReport(
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getCategoryWiseSales(
      query,
    );
  }

  // 5. PRODUCT-WISE SALES
  @Get('sales/product-wise')
  async getProductWiseSalesReport(
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getProductWiseSales(
      query,
    );
  }

  // 6. PROFIT ANALYSIS
  @Get('sales/profit-analysis')
  async getProfitAnalysisReport(
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getProfitAnalysis(
      query,
    );
  }

  // 7. BEST-SELLING PRODUCTS
  @Get('sales/best-selling')
  async getBestSellingProductsReport(
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getBestSellingProducts(
      query,
    );
  }

  // 8. SLOW-MOVING PRODUCTS
  @Get('inventory/slow-moving')
  async getSlowMovingProductsReport(
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getSlowMovingProducts(
      query,
    );
  }

  // 9. DEAD STOCK
  @Get('inventory/dead-stock')
  async getDeadStockReport(
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getDeadStock(
      query,
    );
  }

  // =========================================================
  // CSV EXPORT
  // =========================================================

  // ---------------------------------------------------------
  // 1. DAILY SALES CSV
  // ---------------------------------------------------------

  @Get('sales/daily/export/csv')
  async exportDailySalesCsv(
    @Query() query: DailySalesReportDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportDailySalesCsv(
        query.date,
      );

    const fileDate =
      query.date ||
      new Date()
        .toISOString()
        .slice(0, 10);

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="daily-sales-${fileDate}.csv"`,
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 2. MONTHLY SALES CSV
  // ---------------------------------------------------------

  @Get('sales/monthly/export/csv')
  async exportMonthlySalesCsv(
    @Query() query: MonthlySalesReportDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportMonthlySalesCsv(
        query.year,
        query.month,
      );

    const year =
      query.year ??
      new Date().getFullYear();

    const month =
      query.month ??
      new Date().getMonth() + 1;

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="monthly-sales-${year}-${String(
        month,
      ).padStart(2, '0')}.csv"`,
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 3. ANNUAL SALES CSV
  // ---------------------------------------------------------

  @Get('sales/annual/export/csv')
  async exportAnnualSalesCsv(
    @Query() query: AnnualSalesReportDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportAnnualSalesCsv(
        query.year,
      );

    const year =
      query.year ??
      new Date().getFullYear();

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="annual-sales-${year}.csv"`,
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 4. CATEGORY-WISE SALES CSV
  // ---------------------------------------------------------

  @Get('sales/category-wise/export/csv')
  async exportCategoryWiseSalesCsv(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportCategoryWiseSalesCsv(
        query,
      );

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="category-wise-sales.csv"',
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 5. PRODUCT-WISE SALES CSV
  // ---------------------------------------------------------

  @Get('sales/product-wise/export/csv')
  async exportProductWiseSalesCsv(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportProductWiseSalesCsv(
        query,
      );

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product-wise-sales.csv"',
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 6. PROFIT ANALYSIS CSV
  // ---------------------------------------------------------

  @Get('sales/profit-analysis/export/csv')
  async exportProfitAnalysisCsv(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportProfitAnalysisCsv(
        query,
      );

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="profit-analysis.csv"',
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 7. BEST-SELLING PRODUCTS CSV
  // ---------------------------------------------------------

  @Get('sales/best-selling/export/csv')
  async exportBestSellingProductsCsv(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportBestSellingProductsCsv(
        query,
      );

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="best-selling-products.csv"',
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 8. SLOW-MOVING PRODUCTS CSV
  // ---------------------------------------------------------

  @Get('inventory/slow-moving/export/csv')
  async exportSlowMovingProductsCsv(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportSlowMovingProductsCsv(
        query,
      );

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="slow-moving-products.csv"',
    );

    return res.send(csv);
  }

  // ---------------------------------------------------------
  // 9. DEAD STOCK CSV
  // ---------------------------------------------------------

  @Get('inventory/dead-stock/export/csv')
  async exportDeadStockCsv(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportDeadStockCsv(
        query,
      );

    res.setHeader(
      'Content-Type',
      'text/csv; charset=utf-8',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="dead-stock.csv"',
    );

    return res.send(csv);
  }

  // =========================================================
// EXPENSE REPORT
// =========================================================

@Get('expenses')
async getExpenseReport(
  @Query() query: ReportQueryDto,
) {
  return this.reportsService.getExpenseReport(query);
}

@Get('expenses/export/csv')
async exportExpenseCsv(
  @Query() query: ReportQueryDto,
  @Res() res: Response,
) {
  const csv =
    await this.reportCsvService.exportExpenseCsv(query);

  res.setHeader(
    'Content-Type',
    'text/csv; charset=utf-8',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="expense-report.csv"',
  );

  return res.send(csv);
}

@Get('expenses/export/pdf')
async exportExpensePdf(
  @Query() query: ReportQueryDto,
  @Res() res: Response,
) {
  const report =
    await this.reportsService.getExpenseReport(query);

  const pdf =
    await this.reportPdfService.generateExpenseReportPdf(
      report,
    );

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="expense-report.pdf"',
  );

  return res.send(pdf);
}

  // PDF EXPORT
  // 1. DAILY SALES PDF

  @Get('sales/daily/export/pdf')
  async exportDailySalesPdf(
    @Query() query: DailySalesReportDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getDailySalesReport(
        query.date,
      );

    const pdf =
      await this.reportPdfService.generateDailySalesPdf(
        report,
      );

    const fileDate =
      query.date ||
      new Date()
        .toISOString()
        .slice(0, 10);

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="daily-sales-${fileDate}.pdf"`,
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 2. MONTHLY SALES PDF
  // ---------------------------------------------------------

  @Get('sales/monthly/export/pdf')
  async exportMonthlySalesPdf(
    @Query() query: MonthlySalesReportDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getMonthlySalesReport(
        query.year,
        query.month,
      );

    const pdf =
      await this.reportPdfService.generateMonthlySalesPdf(
        report,
      );

    const year =
      query.year ??
      new Date().getFullYear();

    const month =
      query.month ??
      new Date().getMonth() + 1;

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="monthly-sales-${year}-${String(
        month,
      ).padStart(2, '0')}.pdf"`,
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 3. ANNUAL SALES PDF
  // ---------------------------------------------------------

  @Get('sales/annual/export/pdf')
  async exportAnnualSalesPdf(
    @Query() query: AnnualSalesReportDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getAnnualSalesReport(
        query.year,
      );

    const pdf =
      await this.reportPdfService.generateAnnualSalesPdf(
        report,
      );

    const year =
      query.year ??
      new Date().getFullYear();

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="annual-sales-${year}.pdf"`,
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 4. CATEGORY-WISE SALES PDF
  // ---------------------------------------------------------

  @Get('sales/category-wise/export/pdf')
  async exportCategoryWiseSalesPdf(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getCategoryWiseSales(
        query,
      );

    const pdf =
      await this.reportPdfService.generateCategoryWiseSalesPdf(
        report,
      );

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="category-wise-sales.pdf"',
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 5. PRODUCT-WISE SALES PDF
  // ---------------------------------------------------------

  @Get('sales/product-wise/export/pdf')
  async exportProductWiseSalesPdf(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getProductWiseSales(
        query,
      );

    const pdf =
      await this.reportPdfService.generateProductWiseSalesPdf(
        report,
      );

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product-wise-sales.pdf"',
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 6. PROFIT ANALYSIS PDF
  // ---------------------------------------------------------

  @Get('sales/profit-analysis/export/pdf')
  async exportProfitAnalysisPdf(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getProfitAnalysis(
        query,
      );

    const pdf =
      await this.reportPdfService.generateProfitAnalysisPdf(
        report,
      );

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="profit-analysis.pdf"',
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 7. BEST-SELLING PRODUCTS PDF
  // ---------------------------------------------------------

  @Get('sales/best-selling/export/pdf')
  async exportBestSellingProductsPdf(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getBestSellingProducts(
        query,
      );

    const pdf =
      await this.reportPdfService.generateBestSellingProductsPdf(
        report,
      );

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="best-selling-products.pdf"',
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 8. SLOW-MOVING PRODUCTS PDF
  // ---------------------------------------------------------

  @Get('inventory/slow-moving/export/pdf')
  async exportSlowMovingProductsPdf(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getSlowMovingProducts(
        query,
      );

    const pdf =
      await this.reportPdfService.generateSlowMovingProductsPdf(
        report,
      );

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="slow-moving-products.pdf"',
    );

    return res.send(pdf);
  }

  // ---------------------------------------------------------
  // 9. DEAD STOCK PDF
  // ---------------------------------------------------------

  @Get('inventory/dead-stock/export/pdf')
  async exportDeadStockPdf(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getDeadStock(
        query,
      );

    const pdf =
      await this.reportPdfService.generateDeadStockPdf(
        report,
      );

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="dead-stock.pdf"',
    );

    return res.send(pdf);
  }

  // =========================================================
// INVENTORY REPORTS
// =========================================================

// 10. INVENTORY / STOCK
@Get('inventory/stock')
async getInventoryStockReport() {
  return this.reportsService.getInventoryStockReport();
}


// 11. STOCK MOVEMENT
@Get('inventory/stock-movement')
async getStockMovementReport(
  @Query() query: ReportQueryDto,
) {
  return this.reportsService.getStockMovementReport(
    query,
  );
}

// 12. STOCK VALUATION
@Get('inventory/stock-valuation')
async getStockValuationReport() {
  return this.reportsService.getStockValuationReport();
}

// 13. LOW STOCK
@Get('inventory/low-stock')
async getLowStockReport() {
  return this.reportsService.getLowStockReport();
}

// 14. OUT OF STOCK
@Get('inventory/out-of-stock')
async getOutOfStockReport() {
  return this.reportsService.getOutOfStockReport();
}

//  SUPPLIER REPORT
@Get('suppliers')
async getSupplierReport(
  @Query() query: ReportQueryDto,
) {
  return this.reportsService.getSupplierReport(
    query,
  );
}
// =========================================================
// SUPPLIER REPORT PDF
// =========================================================

@Get('suppliers/export/pdf')
async exportSupplierReportPdf(
  @Query() query: ReportQueryDto,
  @Res() res: Response,
) {
  const report =
    await this.reportsService.getSupplierReport(
      query,
    );

  const pdf =
    await this.reportPdfService
      .generateSupplierReportPdf(
        report,
      );

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="supplier-report.pdf"',
  );

  res.send(pdf);
}

// =========================================================
// 12. CUSTOMER REPORT
// =========================================================

@Get('customers')
async getCustomerReport(
  @Query() query: ReportQueryDto,
) {
  return this.reportsService.getCustomerReport(
    query,
  );
}

// =========================================================
// CUSTOMER REPORT - CSV
// =========================================================

@Get('customers/export/csv')
async exportCustomerReportCsv(
  @Query() query: ReportQueryDto,
  @Res() res: Response,
) {
  const csv =
    await this.reportCsvService.exportCustomerReportCsv(
      query,
    );

  res.setHeader(
    'Content-Type',
    'text/csv; charset=utf-8',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="customer-report.csv"',
  );

  return res.send(csv);
}

// =========================================================
// CUSTOMER REPORT - PDF
// =========================================================

@Get('customers/export/pdf')
async exportCustomerReportPdf(
  @Query() query: ReportQueryDto,
  @Res() res: Response,
) {
  const report =
    await this.reportsService.getCustomerReport(
      query,
    );

  const pdf =
    await this.reportPdfService.generateCustomerReportPdf(
      report,
    );

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="customer-report.pdf"',
  );

  return res.send(pdf);
}
// =========================================================
// STEP 13 - PURCHASE REPORT
// =========================================================

@Get('purchases')
async getPurchaseReport(
  @Query() query: ReportQueryDto,
) {
  return this.reportsService.getPurchaseReport(
    query,
  );
}

@Get('purchases/export/csv')
async exportPurchaseReportCsv(
  @Query() query: ReportQueryDto,
  @Res() res: Response,
) {
  const csv =
    await this.reportCsvService.exportPurchaseReportCsv(
      query,
    );

  res.setHeader(
    'Content-Type',
    'text/csv; charset=utf-8',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="purchase-report.csv"',
  );

  return res.send(csv);
}

@Get('purchases/export/pdf')
async exportPurchaseReportPdf(
  @Query() query: ReportQueryDto,
  @Res() res: Response,
) {
  const report =
    await this.reportsService.getPurchaseReport(
      query,
    );

  const pdf =
    await this.reportPdfService.generatePurchaseReportPdf(
      report,
    );

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="purchase-report.pdf"',
  );

  return res.send(pdf);
}

// =========================================================
// FINANCE REPORT EXPORTS
// =========================================================

// ---------------------------------------------------------
// 15. PROFIT & LOSS PDF
// ---------------------------------------------------------

@Get('finance/profit-loss/export/pdf')
async exportProfitLossPdf(
  @Query('startDate') startDate: string | undefined,
  @Query('endDate') endDate: string | undefined,
  @Res() res: Response,
) {
  const report =
    await this.financeService.getProfitLossReport(
      startDate,
      endDate,
    );

  const pdf =
    await this.reportPdfService.generateProfitLossPdf(
      report,
    );

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="profit-loss-report.pdf"',
  );

  return res.send(pdf);
}

// ---------------------------------------------------------
// 16. BALANCE SHEET PDF
// ---------------------------------------------------------

@Get('finance/balance-sheet/export/pdf')
async exportBalanceSheetPdf(
  @Query('asOfDate') asOfDate: string | undefined,
  @Res() res: Response,
) {
  const report =
    await this.financeService.getBalanceSheetReport(
      asOfDate,
    );

  const pdf =
    await this.reportPdfService.generateBalanceSheetPdf(
      report,
    );

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="balance-sheet-report.pdf"',
  );

  return res.send(pdf);
}

// ---------------------------------------------------------
// 17. CASH FLOW PDF
// ---------------------------------------------------------

@Get('finance/cash-flow/export/pdf')
async exportCashFlowPdf(
  @Query('startDate') startDate: string | undefined,
  @Query('endDate') endDate: string | undefined,
  @Res() res: Response,
) {
  const report =
    await this.financeService.getCashFlowReport(
      startDate,
      endDate,
    );

  const pdf =
    await this.reportPdfService.generateCashFlowPdf(
      report,
    );

  res.setHeader(
    'Content-Type',
    'application/pdf',
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="cash-flow-report.pdf"',
  );

  return res.send(pdf);
}
}
