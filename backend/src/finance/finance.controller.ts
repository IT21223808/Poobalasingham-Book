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

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppPermission } from '../common/permissions/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('finance')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
@RequirePermissions(AppPermission.FINANCE)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
  ) {}

  // GET /api/finance/dashboard

  @Get('dashboard')
  getDashboard(
    @Query() query: FinanceQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getDashboard(
      query,
      user,
    );
  }

  // EXPENSE CATEGORIES

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

  // CASH BOOK

  @Get('cash-book')
  getCashBook(
    @Query() query: FinanceQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getCashBook(
      query,
      user,
    );
  }

  // BANK BOOK
  @Get('bank-book')
  getBankBook(
    @Query() query: FinanceQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.getBankBook(
      query,
      user,
    );
  }

  // =========================================================
  // INCOME
  // =========================================================

  @Get('income')
  findAllIncome(
    @Query() query: FinanceQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.findAllIncome(
      query,
      user,
    );
  }

  @Post('income')
  createIncome(
    @Body() dto: CreateIncomeDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.createIncome(
      dto,
      user,
    );
  }

  @Patch('income/:id')
  updateIncome(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinanceTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.updateTransaction(
      id,
      dto,
      user,
    );
  }

  @Delete('income/:id')
  deleteIncome(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.financeService.deleteTransaction(
      id,
      user,
    );
  }

  // EXPENSES

  @Get('expenses')
  findAllExpenses(
    @Query() query: FinanceQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.findAllExpenses(
      query,
      user,
    );
  }

  @Post('expenses')
  createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.createExpense(
      dto,
      user,
    );
  }

  @Patch('expenses/:id')
  updateExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinanceTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.updateTransaction(
      id,
      dto,
      user,
    );
  }

  @Delete('expenses/:id')
  deleteExpense(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.financeService.deleteTransaction(
      id,
      user,
    );
  }

  // SUPPLIER PAYMENTS
  @Get('supplier-payments/:id')
  findOneSupplierPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.financeService.findOneSupplierPayment(
      id,
      user,
    );
  }

 // SUPPLIER PAYMENTS

@Get('supplier-payments')
findAllSupplierPayments(
  @CurrentUser() user: any,
  @Query('supplierId') supplierId?: string,
  @Query('purchaseInvoiceId') purchaseInvoiceId?: string,
  @Query('search') search?: string,
) {
  return this.financeService.findAllSupplierPayments(
    {
      supplierId: supplierId
        ? parseInt(supplierId, 10)
        : undefined,
      purchaseInvoiceId: purchaseInvoiceId
        ? parseInt(purchaseInvoiceId, 10)
        : undefined,
      search,
    },
    user,
  );
}

  // CUSTOMER PAYMENTS
  @Get('customer-payments/:id')
  findOneCustomerPayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.financeService.findOneCustomerPayment(
      id,
      user,
    );
  }

 // CUSTOMER PAYMENTS

@Get('customer-payments')
findAllCustomerPayments(
  @CurrentUser() user: any,
  @Query('customerId') customerId?: string,
  @Query('salesInvoiceId') salesInvoiceId?: string,
  @Query('search') search?: string,
) {
  return this.financeService.findAllCustomerPayments(
    {
      customerId: customerId
        ? parseInt(customerId, 10)
        : undefined,
      salesInvoiceId,
      search,
    },
    user,
  );
}

  // =========================================================
  // ACCOUNTS RECEIVABLE
  // =========================================================

  @Get('accounts-receivable')
  getAccountsReceivable(
        @CurrentUser() user: any,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('overdueOnly') overdueOnly?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
   return this.financeService.getAccountsReceivable(
  {
    customerId: customerId
      ? parseInt(customerId, 10)
      : undefined,
    status,
    search,
    overdueOnly: overdueOnly === 'true',
    startDate,
    endDate,
  },
  user,
);
  }

  // ACCOUNTS PAYABLE

  @Get('accounts-payable')
  getAccountsPayable(
    @CurrentUser() user: any,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('overdueOnly') overdueOnly?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getAccountsPayable(
      {
        supplierId: supplierId
          ? parseInt(supplierId, 10)
          : undefined,

        status,
        search,

        overdueOnly:
          overdueOnly === 'true',

        startDate,
        endDate,
      },
      user,
    );
  }

  // PROFIT & LOSS

  @Get('profit-loss')
  getProfitLoss(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getProfitLossReport(
      startDate,
      endDate,
      user,
    );
  }

  // BALANCE SHEET

  @Get('balance-sheet')
  getBalanceSheet(
    @CurrentUser() user: any,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.financeService.getBalanceSheetReport(
      asOfDate,
      user,
    );
  }

  // CASH FLOW

  @Get('cash-flow')
  getCashFlow(
     @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getCashFlowReport(
      startDate,
      endDate,
      user,
    );
  }

  // CENTRAL TRANSACTIONS

  @Get('transactions')
  findAllTransactions(
        @CurrentUser() user: any,
    @Query() query: FinanceQueryDto,
  ) {
    return this.financeService.findAllTransactions(
      query,
      user,
    );
  }

  @Get('transactions/:id')
  findOneTransaction(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.financeService.findOneTransaction(
      id,
      user,
    );
  }

  @Post('transactions')
  createTransaction(
    @Body() dto: CreateFinanceTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.createTransaction(
      dto,
      user,
    );
  }

  @Patch('transactions/:id')
  updateTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinanceTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.financeService.updateTransaction(
      id,
      dto,
      user,
    );
  }

  @Delete('transactions/:id')
  deleteTransaction(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.financeService.deleteTransaction(
      id,
      user,
    );
  }
}