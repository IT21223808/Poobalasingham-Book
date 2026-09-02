import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { FinanceService } from './finance.service';

import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';

import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';

import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto';

import { FinanceQueryDto } from './dto/finance-query.dto';

@Controller('finance')
@UseGuards(AuthGuard('jwt'))
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
  ) {}

  // =========================================================
  // OVERVIEW
  // GET /api/finance/dashboard
  // =========================================================

  @Get('dashboard')
  getDashboard(
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.getDashboard(query);
  }

  // =========================================================
  // EXPENSE CATEGORIES
  // =========================================================

  @Get('expense-categories')
  findAllExpenseCategories(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.findAllExpenseCategories(
      search,
      status,
    );
  }

  @Get('expense-categories/:id')
  findOneExpenseCategory(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.findOneExpenseCategory(id);
  }

  @Post('expense-categories')
  createExpenseCategory(
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    return this.financeService.createExpenseCategory(dto);
  }

  @Patch('expense-categories/:id')
  updateExpenseCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return this.financeService.updateExpenseCategory(
      id,
      dto,
    );
  }

  @Delete('expense-categories/:id')
  deleteExpenseCategory(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.deleteExpenseCategory(id);
  }

  // =========================================================
  // CASH BOOK
  // =========================================================

  @Get('cash-book')
  getCashBook(
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.getCashBook(query);
  }

  // =========================================================
  // BANK BOOK
  // =========================================================

  @Get('bank-book')
  getBankBook(
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.getBankBook(query);
  }

  // =========================================================
  // INCOME
  // =========================================================

  @Get('income')
  findAllIncome(
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.findAllIncome(query);
  }

  @Post('income')
  createIncome(
    @Body() dto: CreateIncomeDto,
  ) {
    return this.financeService.createIncome(dto);
  }

  @Patch('income/:id')
  updateIncome(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinanceTransactionDto,
  ) {
    return this.financeService.updateTransaction(
      id,
      dto,
    );
  }

  @Delete('income/:id')
  deleteIncome(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.deleteTransaction(id);
  }

  // =========================================================
  // EXPENSES
  // =========================================================

  @Get('expenses')
  findAllExpenses(
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.findAllExpenses(query);
  }

  @Post('expenses')
  createExpense(
    @Body() dto: CreateExpenseDto,
  ) {
    return this.financeService.createExpense(dto);
  }

  @Patch('expenses/:id')
  updateExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinanceTransactionDto,
  ) {
    return this.financeService.updateTransaction(
      id,
      dto,
    );
  }

  @Delete('expenses/:id')
  deleteExpense(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.deleteTransaction(id);
  }

  // =========================================================
  // SUPPLIER PAYMENTS
  // =========================================================

  @Get('supplier-payments')
  findAllSupplierPayments(
    @Query('supplierId') supplierId?: string,
    @Query('purchaseInvoiceId') purchaseInvoiceId?: string,
    @Query('search') search?: string,
  ) {
    return this.financeService.findAllSupplierPayments({
      supplierId: supplierId
        ? parseInt(supplierId, 10)
        : undefined,

      purchaseInvoiceId: purchaseInvoiceId
        ? parseInt(purchaseInvoiceId, 10)
        : undefined,

      search,
    });
  }

  @Get('supplier-payments/:id')
  findOneSupplierPayment(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.findOneSupplierPayment(id);
  }

  @Post('supplier-payments')
  createSupplierPayment(
    @Body() dto: CreateSupplierPaymentDto,
  ) {
    return this.financeService.createSupplierPayment(dto);
  }

  // =========================================================
  // CUSTOMER PAYMENTS
  // =========================================================

  @Get('customer-payments')
  findAllCustomerPayments(
    @Query('customerId') customerId?: string,
    @Query('salesInvoiceId') salesInvoiceId?: string,
    @Query('search') search?: string,
  ) {
    return this.financeService.findAllCustomerPayments({
      customerId: customerId
        ? parseInt(customerId, 10)
        : undefined,

      salesInvoiceId,
      search,
    });
  }

  @Get('customer-payments/:id')
  findOneCustomerPayment(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.findOneCustomerPayment(id);
  }

  @Post('customer-payments')
  createCustomerPayment(
    @Body() dto: CreateCustomerPaymentDto,
  ) {
    return this.financeService.createCustomerPayment(dto);
  }

  // =========================================================
  // ACCOUNTS RECEIVABLE
  // =========================================================

  @Get('accounts-receivable')
  getAccountsReceivable(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('overdueOnly') overdueOnly?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getAccountsReceivable({
      customerId: customerId
        ? parseInt(customerId, 10)
        : undefined,

      status,
      search,

      overdueOnly:
        overdueOnly === 'true',

      startDate,
      endDate,
    });
  }

  // =========================================================
  // ACCOUNTS PAYABLE
  // =========================================================

  @Get('accounts-payable')
  getAccountsPayable(
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('overdueOnly') overdueOnly?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getAccountsPayable({
      supplierId: supplierId
        ? parseInt(supplierId, 10)
        : undefined,

      status,
      search,

      overdueOnly:
        overdueOnly === 'true',

      startDate,
      endDate,
    });
  }

  // =========================================================
  // PROFIT & LOSS
  // NORMAL FINANCE PAGE
  // GET /api/finance/profit-loss
  // =========================================================

  @Get('profit-loss')
  getProfitLoss(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getProfitLossReport(
      startDate,
      endDate,
    );
  }

  // =========================================================
  // BALANCE SHEET
  // NORMAL FINANCE PAGE
  // GET /api/finance/balance-sheet
  // =========================================================

  @Get('balance-sheet')
  getBalanceSheet(
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.financeService.getBalanceSheetReport(
      asOfDate,
    );
  }

  // =========================================================
  // CASH FLOW
  // NORMAL FINANCE PAGE
  // GET /api/finance/cash-flow
  // =========================================================

  @Get('cash-flow')
  getCashFlow(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getCashFlowReport(
      startDate,
      endDate,
    );
  }

  // =========================================================
  // CENTRAL TRANSACTIONS
  // =========================================================

  @Get('transactions')
  findAllTransactions(
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.findAllTransactions(query);
  }

  @Get('transactions/:id')
  findOneTransaction(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.findOneTransaction(id);
  }

  @Post('transactions')
  createTransaction(
    @Body() dto: CreateFinanceTransactionDto,
  ) {
    return this.financeService.createTransaction(dto);
  }

  @Patch('transactions/:id')
  updateTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinanceTransactionDto,
  ) {
    return this.financeService.updateTransaction(
      id,
      dto,
    );
  }

  @Delete('transactions/:id')
  deleteTransaction(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.financeService.deleteTransaction(id);
  }
}