import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
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

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import {
  AppPermission,
} from '../common/permissions/permissions';

import {
  RequirePermissions,
} from '../common/decorators/permissions.decorator';

import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@RequirePermissions(AppPermission.REPORTS)
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

  // =========================================================
  // 1. DAILY SALES
  // =========================================================

  @Get('sales/daily')
  async getDailySalesReport(
    @Query() query: DailySalesReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getDailySalesReport(
      query.date,
      user,
    );
  }

  // =========================================================
  // 2. MONTHLY SALES
  // =========================================================

  @Get('sales/monthly')
  async getMonthlySalesReport(
    @Query() query: MonthlySalesReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getMonthlySalesReport(
      query.year,
      query.month,
      user,
    );
  }

  // =========================================================
  // 3. ANNUAL SALES
  // =========================================================

  @Get('sales/annual')
  async getAnnualSalesReport(
    @Query() query: AnnualSalesReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getAnnualSalesReport(
      query.year,
      user,
    );
  }

  // =========================================================
  // 4. CATEGORY-WISE SALES
  // =========================================================

  @Get('sales/category-wise')
  async getCategoryWiseSalesReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getCategoryWiseSales(
      query,
      user,
    );
  }

  // =========================================================
  // 5. PRODUCT-WISE SALES
  // =========================================================

  @Get('sales/product-wise')
  async getProductWiseSalesReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getProductWiseSales(
      query,
      user,
    );
  }

  // =========================================================
  // 6. PROFIT ANALYSIS
  // =========================================================

  @Get('sales/profit-analysis')
  async getProfitAnalysisReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getProfitAnalysis(
      query,
      user,
    );
  }

  // =========================================================
  // 7. BEST-SELLING PRODUCTS
  // =========================================================

  @Get('sales/best-selling')
  async getBestSellingProductsReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getBestSellingProducts(
      query,
      user,
    );
  }

  // =========================================================
  // 8. SLOW-MOVING PRODUCTS
  // =========================================================

  @Get('inventory/slow-moving')
  async getSlowMovingProductsReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getSlowMovingProducts(
      query,
      user,
    );
  }

  // =========================================================
  // 9. DEAD STOCK
  // =========================================================

  @Get('inventory/dead-stock')
  async getDeadStockReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getDeadStock(
      query,
      user,
    );
  }

  // =========================================================
  // EXPENSE REPORT
  // =========================================================

  @Get('expenses')
  async getExpenseReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getExpenseReport(
      query,
      user,
    );
  }

  // =========================================================
  // EXPENSE REPORT - CSV
  // =========================================================

  @Get('expenses/export/csv')
  async exportExpenseCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportExpenseCsv(
        query,
        user,
      );

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

  // =========================================================
  // EXPENSE REPORT - PDF
  // =========================================================

  @Get('expenses/export/pdf')
  async exportExpensePdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getExpenseReport(
        query,
        user,
      );

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

  // =========================================================
  // CSV EXPORTS
  // =========================================================

  // =========================================================
  // 1. DAILY SALES CSV
  // =========================================================

  @Get('sales/daily/export/csv')
  async exportDailySalesCsv(
    @Query() query: DailySalesReportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportDailySalesCsv(
        query.date,
        user,
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

  // =========================================================
  // 2. MONTHLY SALES CSV
  // =========================================================

  @Get('sales/monthly/export/csv')
  async exportMonthlySalesCsv(
    @Query() query: MonthlySalesReportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportMonthlySalesCsv(
        query.year,
        query.month,
        user,
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

  // =========================================================
  // 3. ANNUAL SALES CSV
  // =========================================================

  @Get('sales/annual/export/csv')
  async exportAnnualSalesCsv(
    @Query() query: AnnualSalesReportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportAnnualSalesCsv(
        query.year,
        user,
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

  // =========================================================
  // 4. CATEGORY-WISE SALES CSV
  // =========================================================

  @Get('sales/category-wise/export/csv')
  async exportCategoryWiseSalesCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportCategoryWiseSalesCsv(
        query,
        user,
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

  // =========================================================
  // 5. PRODUCT-WISE SALES CSV
  // =========================================================

  @Get('sales/product-wise/export/csv')
  async exportProductWiseSalesCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportProductWiseSalesCsv(
        query,
        user,
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

  // =========================================================
  // 6. PROFIT ANALYSIS CSV
  // =========================================================

  @Get('sales/profit-analysis/export/csv')
  async exportProfitAnalysisCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportProfitAnalysisCsv(
        query,
        user,
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

  // =========================================================
  // 7. BEST-SELLING PRODUCTS CSV
  // =========================================================

  @Get('sales/best-selling/export/csv')
  async exportBestSellingProductsCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportBestSellingProductsCsv(
        query,
        user,
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

  // =========================================================
  // 8. SLOW-MOVING PRODUCTS CSV
  // =========================================================

  @Get('inventory/slow-moving/export/csv')
  async exportSlowMovingProductsCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportSlowMovingProductsCsv(
        query,
        user,
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

  // =========================================================
  // 9. DEAD STOCK CSV
  // =========================================================

  @Get('inventory/dead-stock/export/csv')
  async exportDeadStockCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportDeadStockCsv(
        query,
        user,
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
  // PDF EXPORTS
  // =========================================================

  // =========================================================
  // 1. DAILY SALES PDF
  // =========================================================

  @Get('sales/daily/export/pdf')
  async exportDailySalesPdf(
    @Query() query: DailySalesReportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getDailySalesReport(
        query.date,
        user,
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

  // =========================================================
  // 2. MONTHLY SALES PDF
  // =========================================================

  @Get('sales/monthly/export/pdf')
  async exportMonthlySalesPdf(
    @Query() query: MonthlySalesReportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getMonthlySalesReport(
        query.year,
        query.month,
        user,
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

  // =========================================================
  // 3. ANNUAL SALES PDF
  // =========================================================

  @Get('sales/annual/export/pdf')
  async exportAnnualSalesPdf(
    @Query() query: AnnualSalesReportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getAnnualSalesReport(
        query.year,
        user,
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

  // =========================================================
  // 4. CATEGORY-WISE SALES PDF
  // =========================================================

  @Get('sales/category-wise/export/pdf')
  async exportCategoryWiseSalesPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getCategoryWiseSales(
        query,
        user,
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

  // =========================================================
  // 5. PRODUCT-WISE SALES PDF
  // =========================================================

  @Get('sales/product-wise/export/pdf')
  async exportProductWiseSalesPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getProductWiseSales(
        query,
        user,
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

  // =========================================================
  // 6. PROFIT ANALYSIS PDF
  // =========================================================

  @Get('sales/profit-analysis/export/pdf')
  async exportProfitAnalysisPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getProfitAnalysis(
        query,
        user,
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

  // =========================================================
  // 7. BEST-SELLING PRODUCTS PDF
  // =========================================================

  @Get('sales/best-selling/export/pdf')
  async exportBestSellingProductsPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getBestSellingProducts(
        query,
        user,
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

  // =========================================================
  // 8. SLOW-MOVING PRODUCTS PDF
  // =========================================================

  @Get('inventory/slow-moving/export/pdf')
  async exportSlowMovingProductsPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getSlowMovingProducts(
        query,
        user,
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

  // =========================================================
  // 9. DEAD STOCK PDF
  // =========================================================

  @Get('inventory/dead-stock/export/pdf')
  async exportDeadStockPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getDeadStock(
        query,
        user,
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

  // =========================================================
  // 10. INVENTORY / STOCK
  // =========================================================

  @Get('inventory/stock')
  async getInventoryStockReport(
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getInventoryStockReport(
      user,
    );
  }

  // =========================================================
  // 11. STOCK MOVEMENT
  // =========================================================

  @Get('inventory/stock-movement')
  async getStockMovementReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getStockMovementReport(
      query,
      user,
    );
  }

  // =========================================================
  // 12. STOCK VALUATION
  // =========================================================

  @Get('inventory/stock-valuation')
  async getStockValuationReport(
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getStockValuationReport(
      user,
    );
  }

  // =========================================================
  // 13. LOW STOCK
  // =========================================================

  @Get('inventory/low-stock')
  async getLowStockReport(
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getLowStockReport(
      user,
    );
  }

  // =========================================================
  // 14. OUT OF STOCK
  // =========================================================

  @Get('inventory/out-of-stock')
  async getOutOfStockReport(
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getOutOfStockReport(
      user,
    );
  }

  // =========================================================
  // SUPPLIER REPORT
  // =========================================================

  @Get('suppliers')
  async getSupplierReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getSupplierReport(
      query,
      user,
    );
  }

  // =========================================================
  // SUPPLIER REPORT - PDF
  // =========================================================

  @Get('suppliers/export/pdf')
  async exportSupplierReportPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getSupplierReport(
        query,
        user,
      );

    const pdf =
      await this.reportPdfService.generateSupplierReportPdf(
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

    return res.send(pdf);
  }

  // =========================================================
  // CUSTOMER REPORT
  // =========================================================

  @Get('customers')
  async getCustomerReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getCustomerReport(
      query,
      user,
    );
  }

  // =========================================================
  // CUSTOMER REPORT - CSV
  // =========================================================

  @Get('customers/export/csv')
  async exportCustomerReportCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportCustomerReportCsv(
        query,
        user,
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

 // ---------------------------------------------------------
// CUSTOMER REPORT PDF
// ---------------------------------------------------------

@Get('customers/export/pdf')
async exportCustomerReportPdf(
  @Query() query: ReportQueryDto,
  @CurrentUser() user: any,
  @Res() res: Response,
) {
  const report =
    await this.reportsService.getCustomerReport(
      query,
      user,
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
  // PURCHASE REPORT
  // =========================================================

  @Get('purchases')
  async getPurchaseReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getPurchaseReport(
      query,
      user,
    );
  }

  // =========================================================
  // PURCHASE REPORT - CSV
  // =========================================================

  @Get('purchases/export/csv')
  async exportPurchaseReportCsv(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const csv =
      await this.reportCsvService.exportPurchaseReportCsv(
        query,
        user,
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

  // =========================================================
  // PURCHASE REPORT - PDF
  // =========================================================

  @Get('purchases/export/pdf')
  async exportPurchaseReportPdf(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.reportsService.getPurchaseReport(
        query,
        user,
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

  // =========================================================
  // 15. PROFIT & LOSS PDF
  // =========================================================

  @Get('finance/profit-loss/export/pdf')
  async exportProfitLossPdf(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.financeService.getProfitLossReport(
        startDate,
        endDate,
        user,
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

  // =========================================================
  // 16. BALANCE SHEET PDF
  // =========================================================

  @Get('finance/balance-sheet/export/pdf')
  async exportBalanceSheetPdf(
    @Query('asOfDate') asOfDate: string | undefined,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.financeService.getBalanceSheetReport(
        asOfDate,
        user,
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

  // =========================================================
  // 17. CASH FLOW PDF
  // =========================================================

  @Get('finance/cash-flow/export/pdf')
  async exportCashFlowPdf(
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const report =
      await this.financeService.getCashFlowReport(
        startDate,
        endDate,
        user,
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