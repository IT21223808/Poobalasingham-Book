import api from './api';

// =========================================================
// TYPES
// =========================================================

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'CASH' | 'BANK';

export interface FinanceTransaction {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  category: string;
  description: string;
  amount: number;
  reference?: string | null;

  customerId?: number | null;
  supplierId?: number | null;
  purchaseInvoiceId?: number | null;

  customer?: {
    id: number;
    customerName: string;
  };

  supplier?: {
    id: number;
    supplierName: string;
  };

  purchaseInvoice?: {
    id: number;
    invoiceNumber: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface SupplierPayment {
  id: number;
  paymentNumber: string;
  supplierId: number;
  purchaseInvoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;

  supplier?: {
    id: number;
    supplierName: string;
    supplierCode?: string;
  };

  purchaseInvoice?: {
    id: number;
    invoiceNumber: string;
    grandTotal?: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface CustomerPayment {
  id: number;
  paymentNumber: string;
  customerId: number;
  salesInvoiceId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;

  customer?: {
    id: number;
    customerName: string;
    customerCode?: string;
  };

  salesInvoice?: {
    id: string;
    invoiceNumber: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface CashBookEntry {
  id: number;
  transactionNumber: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  reference?: string | null;
  cashIn: number;
  cashOut: number;
  balance: number;
}

export interface BankBookEntry {
  id: number;
  transactionNumber: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  reference?: string | null;
  bankIn: number;
  bankOut: number;
  balance: number;
}

export interface AccountsPayableItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;

  supplierId: number;
  supplierName: string;
  supplierCode?: string;

  invoiceAmount: number;
  paidAmount: number;
  outstanding: number;

  status: string;
  isOverdue: boolean;

  payments?: SupplierPayment[];
}

export interface AccountsReceivableItem {
  id: string | number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;

  customerId?: number | null;
  customerName: string;

  invoiceAmount: number;
  paidAmount: number;
  outstanding: number;

  status: string;
  isOverdue: boolean;

  payments?: CustomerPayment[];
}

export interface DashboardData {
  period: string;
  startDate?: string;
  endDate?: string;

  cards: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    cashBalance: number;
    bankBalance: number;
    accountsReceivable: number;
    accountsPayable: number;
  };

  recentTransactions: FinanceTransaction[];

  monthlyChart: {
    month: string;
    income: number;
    expense: number;
    profit: number;
  }[];

  topExpenseCategories: {
    category: string;
    amount: number;
  }[];
}

export interface ProfitLossData {
  period: {
    startDate: string;
    endDate: string;
  };

  income: {
    total: number;

    breakdown: {
      category: string;
      amount: number;
    }[];
  };

  expenses: {
    total: number;

    breakdown: {
      category: string;
      amount: number;
    }[];
  };

  netProfit: number;
  profitMargin: number;
}

export interface CashFlowData {
  period: {
    startDate: string;
    endDate: string;
  };

  openingBalance: {
    cash: number;
    bank: number;
    total: number;
  };

  inflows: {
    cashIn: number;
    bankIn: number;
    total: number;
  };

  outflows: {
    cashOut: number;
    bankOut: number;
    total: number;
  };

  netCashFlow: number;

  closingBalance: {
    cash: number;
    bank: number;
    total: number;
  };
}

export interface BalanceSheetData {
  asOfDate: string;

  assets: {
    currentAssets: {
      cashOnHand: number;
      bankAccounts: number;
      accountsReceivable: number;
      inventoryValuation: number;
    };

    totalAssets: number;
  };

  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
    };

    totalLiabilities: number;
  };

  equity: {
    retainedEarnings: number;
    netWorkingCapital: number;
    totalLiabilitiesAndEquity: number;
  };
}

// =========================================================
// FINANCE SERVICE
// =========================================================

export const financeService = {
  // =========================================================
  // OVERVIEW
  // GET /api/finance/dashboard
  // =========================================================

  getDashboard: (
    params?: {
      period?: string;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    api.get<DashboardData>(
      '/finance/dashboard',
      { params },
    ),

  // =========================================================
  // EXPENSE CATEGORIES
  // =========================================================

  getExpenseCategories: (
    params?: {
      search?: string;
      status?: string;
    },
  ) =>
    api.get<ExpenseCategory[]>(
      '/finance/expense-categories',
      { params },
    ),

  getExpenseCategory: (id: number) =>
    api.get<ExpenseCategory>(
      `/finance/expense-categories/${id}`,
    ),

  createExpenseCategory: (
    data: {
      name: string;
      description?: string;
      isActive?: boolean;
    },
  ) =>
    api.post<ExpenseCategory>(
      '/finance/expense-categories',
      data,
    ),

  updateExpenseCategory: (
    id: number,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
    },
  ) =>
    api.patch<ExpenseCategory>(
      `/finance/expense-categories/${id}`,
      data,
    ),

  deleteExpenseCategory: (id: number) =>
    api.delete<{
      success: boolean;
      message: string;
    }>(
      `/finance/expense-categories/${id}`,
    ),

  // =========================================================
  // TRANSACTIONS
  // =========================================================

  getTransactions: (params?: any) =>
    api.get<{
      transactions: FinanceTransaction[];
      summary: any;
    }>(
      '/finance/transactions',
      { params },
    ),

  getTransaction: (id: number) =>
    api.get<FinanceTransaction>(
      `/finance/transactions/${id}`,
    ),

  createTransaction: (data: any) =>
    api.post<FinanceTransaction>(
      '/finance/transactions',
      data,
    ),

  updateTransaction: (
    id: number,
    data: any,
  ) =>
    api.patch<FinanceTransaction>(
      `/finance/transactions/${id}`,
      data,
    ),

  deleteTransaction: (id: number) =>
    api.delete(
      `/finance/transactions/${id}`,
    ),

  // =========================================================
  // CASH BOOK
  // =========================================================

  getCashBook: (params?: any) =>
    api.get<{
      openingBalance: number;
      totalCashIn: number;
      totalCashOut: number;
      closingBalance: number;
      count: number;
      entries: CashBookEntry[];
    }>(
      '/finance/cash-book',
      { params },
    ),

  // =========================================================
  // BANK BOOK
  // =========================================================

  getBankBook: (params?: any) =>
    api.get<{
      openingBalance: number;
      totalBankIn: number;
      totalBankOut: number;
      closingBalance: number;
      count: number;
      entries: BankBookEntry[];
    }>(
      '/finance/bank-book',
      { params },
    ),

  // =========================================================
  // INCOME
  // =========================================================

  getIncome: (params?: any) =>
    api.get<{
      transactions: FinanceTransaction[];
      summary: any;
    }>(
      '/finance/income',
      { params },
    ),

  createIncome: (
    data: {
      date?: string;
      description: string;
      amount: number;
      paymentMethod: PaymentMethod;
      reference?: string;
      customerId?: number;
    },
  ) =>
    api.post<FinanceTransaction>(
      '/finance/income',
      data,
    ),

  updateIncome: (
    id: number,
    data: any,
  ) =>
    api.patch<FinanceTransaction>(
      `/finance/income/${id}`,
      data,
    ),

  deleteIncome: (id: number) =>
    api.delete(
      `/finance/income/${id}`,
    ),

  // =========================================================
  // EXPENSES
  // =========================================================

  getExpenses: (params?: any) =>
    api.get<{
      transactions: FinanceTransaction[];
      summary: any;
    }>(
      '/finance/expenses',
      { params },
    ),

  createExpense: (
    data: {
      date?: string;
      expenseCategory: string;
      description: string;
      amount: number;
      paymentMethod: PaymentMethod;
      reference?: string;
      supplierId?: number;
      purchaseInvoiceId?: number;
    },
  ) =>
    api.post<FinanceTransaction>(
      '/finance/expenses',
      data,
    ),

  updateExpense: (
    id: number,
    data: any,
  ) =>
    api.patch<FinanceTransaction>(
      `/finance/expenses/${id}`,
      data,
    ),

  deleteExpense: (id: number) =>
    api.delete(
      `/finance/expenses/${id}`,
    ),

  // =========================================================
  // SUPPLIER PAYMENTS
  // =========================================================

  getSupplierPayments: (
    params?: {
      supplierId?: number;
      purchaseInvoiceId?: number;
      search?: string;
    },
  ) =>
    api.get<SupplierPayment[]>(
      '/finance/supplier-payments',
      { params },
    ),

  getSupplierPayment: (id: number) =>
    api.get<SupplierPayment>(
      `/finance/supplier-payments/${id}`,
    ),

  createSupplierPayment: (
    data: {
      supplierId: number;
      purchaseInvoiceId: number;
      paymentDate?: string;
      amount: number;
      paymentMethod: PaymentMethod;
      reference?: string;
      notes?: string;
    },
  ) =>
    api.post<SupplierPayment>(
      '/finance/supplier-payments',
      data,
    ),

  // =========================================================
  // CUSTOMER PAYMENTS
  // =========================================================

  getCustomerPayments: (
    params?: {
      customerId?: number;
      salesInvoiceId?: string;
      search?: string;
    },
  ) =>
    api.get<CustomerPayment[]>(
      '/finance/customer-payments',
      { params },
    ),

  getCustomerPayment: (id: number) =>
    api.get<CustomerPayment>(
      `/finance/customer-payments/${id}`,
    ),

  createCustomerPayment: (
    data: {
      customerId: number;
      salesInvoiceId?: string;
      paymentDate?: string;
      amount: number;
      paymentMethod: PaymentMethod;
      reference?: string;
      notes?: string;
    },
  ) =>
    api.post<CustomerPayment>(
      '/finance/customer-payments',
      data,
    ),

  // =========================================================
  // ACCOUNTS RECEIVABLE
  // =========================================================

  getAccountsReceivable: (
    params?: {
      customerId?: number;
      status?: string;
      search?: string;
      overdueOnly?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    api.get<{
      summary: {
        totalReceivable: number;
        totalReceived: number;
        totalOutstanding: number;
        totalOverdueAmount: number;
        overdueCount: number;
        invoiceCount: number;
      };

      records: AccountsReceivableItem[];
    }>(
      '/finance/accounts-receivable',
      { params },
    ),

  // =========================================================
  // ACCOUNTS PAYABLE
  // =========================================================

  getAccountsPayable: (
    params?: {
      supplierId?: number;
      status?: string;
      search?: string;
      overdueOnly?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    api.get<{
      summary: {
        totalInvoiceAmount: number;
        totalPaidAmount: number;
        totalOutstanding: number;
        totalOverdueAmount: number;
        overdueCount: number;
        invoiceCount: number;
      };

      records: AccountsPayableItem[];
    }>(
      '/finance/accounts-payable',
      { params },
    ),

  // =========================================================
  // PROFIT & LOSS
  // NORMAL FINANCE PAGE
  // GET /api/finance/profit-loss
  // =========================================================

  getProfitLoss: (
    params?: {
      startDate?: string;
      endDate?: string;
    },
  ) =>
    api.get<ProfitLossData>(
      '/finance/profit-loss',
      { params },
    ),

  // =========================================================
  // BALANCE SHEET
  // NORMAL FINANCE PAGE
  // GET /api/finance/balance-sheet
  // =========================================================

  getBalanceSheet: (
    params?: {
      asOfDate?: string;
    },
  ) =>
    api.get<BalanceSheetData>(
      '/finance/balance-sheet',
      { params },
    ),

  // =========================================================
  // CASH FLOW
  // NORMAL FINANCE PAGE
  // GET /api/finance/cash-flow
  // =========================================================

  getCashFlow: (
    params?: {
      startDate?: string;
      endDate?: string;
    },
  ) =>
    api.get<CashFlowData>(
      '/finance/cash-flow',
      { params },
    ),
};