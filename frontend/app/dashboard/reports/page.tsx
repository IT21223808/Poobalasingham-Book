"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   TYPES
========================================================= */

type ReportKey =
  | "daily-sales"
  | "monthly-sales"
  | "annual-sales"
  | "category-wise-sales"
  | "product-wise-sales"
  | "profit-analysis"
  | "best-selling"
  | "slow-moving"
  | "dead-stock"
  | "inventory"
  | "suppliers"
  | "customers"
  | "purchases"
  | "expenses"
  | "profit-loss"
  | "balance-sheet"
  | "cash-flow";

interface ReportConfig {
  key: ReportKey;
  label: string;
  endpoint: string;
  csvEndpoint: string;
  pdfEndpoint: string;
}

/* =========================================================
   FINANCE TYPES
========================================================= */

interface FinanceBreakdownItem {
  category?: string;
  amount?: number;
  [key: string]: unknown;
}

interface ProfitLossReport {
  period?: {
    startDate?: string;
    endDate?: string;
  };
  income?: {
    total?: number;
    breakdown?: FinanceBreakdownItem[];
  };
  expenses?: {
    total?: number;
    breakdown?: FinanceBreakdownItem[];
  };
  netProfit?: number;
  profitMargin?: number;
}

interface BalanceSheetReport {
  asOfDate?: string;
  assets?: {
    currentAssets?: {
      cashOnHand?: number;
      bankAccounts?: number;
      accountsReceivable?: number;
      inventoryValuation?: number;
      [key: string]: unknown;
    };
    totalAssets?: number;
  };
  liabilities?: {
    currentLiabilities?: {
      accountsPayable?: number;
      [key: string]: unknown;
    };
    totalLiabilities?: number;
  };
  equity?: {
    retainedEarnings?: number;
    netWorkingCapital?: number;
    totalLiabilitiesAndEquity?: number;
    [key: string]: unknown;
  };
}

interface CashFlowReport {
  period?: {
    startDate?: string;
    endDate?: string;
  };
  openingBalance?: {
    cash?: number;
    bank?: number;
    total?: number;
  };
  inflows?: {
    cashIn?: number;
    bankIn?: number;
    total?: number;
  };
  outflows?: {
    cashOut?: number;
    bankOut?: number;
    total?: number;
  };
  netCashFlow?: number;
  closingBalance?: {
    cash?: number;
    bank?: number;
    total?: number;
  };
}

/* =========================================================
   REPORT CONFIGURATION
========================================================= */

const REPORT_CONFIGS: ReportConfig[] = [
  {
    key: "daily-sales",
    label: "Daily Sales",
    endpoint: "/reports/sales/daily",
    csvEndpoint: "/reports/sales/daily/export/csv",
    pdfEndpoint: "/reports/sales/daily/export/pdf",
  },
  {
    key: "monthly-sales",
    label: "Monthly Sales",
    endpoint: "/reports/sales/monthly",
    csvEndpoint: "/reports/sales/monthly/export/csv",
    pdfEndpoint: "/reports/sales/monthly/export/pdf",
  },
  {
    key: "annual-sales",
    label: "Annual Sales",
    endpoint: "/reports/sales/annual",
    csvEndpoint: "/reports/sales/annual/export/csv",
    pdfEndpoint: "/reports/sales/annual/export/pdf",
  },
  {
    key: "category-wise-sales",
    label: "Category-wise Sales",
    endpoint: "/reports/sales/category-wise",
    csvEndpoint: "/reports/sales/category-wise/export/csv",
    pdfEndpoint: "/reports/sales/category-wise/export/pdf",
  },
  {
    key: "product-wise-sales",
    label: "Product-wise Sales",
    endpoint: "/reports/sales/product-wise",
    csvEndpoint: "/reports/sales/product-wise/export/csv",
    pdfEndpoint: "/reports/sales/product-wise/export/pdf",
  },
  {
    key: "profit-analysis",
    label: "Profit Analysis",
    endpoint: "/reports/sales/profit-analysis",
    csvEndpoint: "/reports/sales/profit-analysis/export/csv",
    pdfEndpoint: "/reports/sales/profit-analysis/export/pdf",
  },
  {
    key: "best-selling",
    label: "Best-selling Products",
    endpoint: "/reports/sales/best-selling",
    csvEndpoint: "/reports/sales/best-selling/export/csv",
    pdfEndpoint: "/reports/sales/best-selling/export/pdf",
  },
  {
    key: "slow-moving",
    label: "Slow-moving Products",
    endpoint: "/reports/inventory/slow-moving",
    csvEndpoint: "/reports/inventory/slow-moving/export/csv",
    pdfEndpoint: "/reports/inventory/slow-moving/export/pdf",
  },
  {
    key: "dead-stock",
    label: "Dead Stock",
    endpoint: "/reports/inventory/dead-stock",
    csvEndpoint: "/reports/inventory/dead-stock/export/csv",
    pdfEndpoint: "/reports/inventory/dead-stock/export/pdf",
  },
  {
    key: "inventory",
    label: "Inventory Report",
    endpoint: "/reports/inventory/stock",
    csvEndpoint: "/reports/inventory/stock/export/csv",
    pdfEndpoint: "/reports/inventory/stock/export/pdf",
  },
  {
    key: "suppliers",
    label: "Supplier Report",
    endpoint: "/reports/suppliers",
    csvEndpoint: "/reports/suppliers/export/csv",
    pdfEndpoint: "/reports/suppliers/export/pdf",
  },
  {
    key: "customers",
    label: "Customer Report",
    endpoint: "/reports/customers",
    csvEndpoint: "/reports/customers/export/csv",
    pdfEndpoint: "/reports/customers/export/pdf",
  },
  {
    key: "purchases",
    label: "Purchase Report",
    endpoint: "/reports/purchases",
    csvEndpoint: "/reports/purchases/export/csv",
    pdfEndpoint: "/reports/purchases/export/pdf",
  },
  {
    key: "expenses",
    label: "Expense Report",
    endpoint: "/reports/expenses",
    csvEndpoint: "/reports/expenses/export/csv",
    pdfEndpoint: "/reports/expenses/export/pdf",
  },
  {
    key: "profit-loss",
    label: "Profit & Loss",
    endpoint: "/finance/profit-loss",
    csvEndpoint: "/reports/finance/profit-loss/export/csv",
    pdfEndpoint: "/reports/finance/profit-loss/export/pdf",
  },
  {
    key: "balance-sheet",
    label: "Balance Sheet",
    endpoint: "/finance/balance-sheet",
    csvEndpoint: "/reports/finance/balance-sheet/export/csv",
    pdfEndpoint: "/reports/finance/balance-sheet/export/pdf",
  },
  {
    key: "cash-flow",
    label: "Cash Flow",
    endpoint: "/finance/cash-flow",
    csvEndpoint: "/reports/finance/cash-flow/export/csv",
    pdfEndpoint: "/reports/finance/cash-flow/export/pdf",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token")
  );
}

function getHeaders(): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultEndDate(): string {
  return formatDateInput(new Date());
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  return formatDateInput(date);
}

function formatHeader(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* =========================================================
   FINANCE REPORT CHECK
========================================================= */

function isFinanceReport(reportKey: ReportKey): boolean {
  return (
    reportKey === "profit-loss" ||
    reportKey === "balance-sheet" ||
    reportKey === "cash-flow"
  );
}

/* =========================================================
   DATE KEY
========================================================= */

function isDateKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("date") ||
    normalized.includes("createdat") ||
    normalized.includes("updatedat")
  );
}

/* =========================================================
   PERCENTAGE KEY
========================================================= */

function isPercentageKey(key: string): boolean {
  const normalized = key
    .toLowerCase()
    .replace(/[_-]+/g, "");

  return (
    normalized.includes("margin") ||
    normalized.includes("percentage") ||
    normalized.includes("percent")
  );
}

/* =========================================================
   MONEY KEY
========================================================= */

function isMoneyKey(key: string): boolean {
  const normalized = key
    .toLowerCase()
    .replace(/[_-]+/g, "");

  const moneyKeywords = [
    "amount",
    "revenue",
    "profit",
    "sales",
    "price",
    "cost",
    "balance",
    "expense",
    "payment",
    "value",
    "income",
    "cash",
    "bank",
    "turnover",
    "receivable",
    "payable",
    "grossprofit",
    "netprofit",
    "netrevenue",
    "totalrevenue",
    "totalsales",
    "totalprofit",
    "totalamount",
    "totalvalue",
  ];

  return moneyKeywords.some((keyword) =>
    normalized.includes(keyword),
  );
}

/* =========================================================
   MONEY FORMAT
========================================================= */

function formatMoney(value: unknown): string {
  const amount = Number(value || 0);

  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* =========================================================
   PERCENTAGE FORMAT
========================================================= */

function formatPercentage(value: unknown): string {
  const percentage = Number(value || 0);

  return `${percentage.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDisplayDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
}

/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
  error: any,
  fallback: string,
): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error.message)) {
    return error.message
      .map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.message) {
          return String(item.message);
        }

        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .join(", ");
  }

  if (
    error.message &&
    typeof error.message === "object"
  ) {
    try {
      return (
        error.message.message ||
        error.message.error ||
        JSON.stringify(error.message)
      );
    } catch {
      return fallback;
    }
  }

  if (error.message) {
    return String(error.message);
  }

  if (error.error) {
    if (typeof error.error === "string") {
      return error.error;
    }

    try {
      return JSON.stringify(error.error);
    } catch {
      return fallback;
    }
  }

  try {
    const stringified = JSON.stringify(error);

    if (
      stringified &&
      stringified !== "{}"
    ) {
      return stringified;
    }
  } catch {
    // Ignore stringify errors
  }

  return fallback;
}

/* =========================================================
   FORMAT CELL VALUE
========================================================= */

function formatCellValue(
  value: unknown,
  key: string,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (isDateKey(key)) {
    const date = new Date(String(value));

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB");
    }
  }

  if (
    typeof value === "number" &&
    isPercentageKey(key)
  ) {
    return formatPercentage(value);
  }

  if (
    typeof value === "number" &&
    isMoneyKey(key)
  ) {
    return formatMoney(value);
  }

  if (typeof value === "number") {
    return value.toLocaleString("en-LK");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/* =========================================================
   ROOT DATA
========================================================= */

function getRootData(data: any): any {
  if (!data) {
    return {};
  }

  if (
    data.data &&
    !Array.isArray(data.data)
  ) {
    return data.data;
  }

  return data;
}

/* =========================================================
   EXTRACT RECORDS
========================================================= */

function extractRecords(
  data: any,
): Record<string, any>[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.records)) {
    return data.records;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (
    data.data &&
    typeof data.data === "object"
  ) {
    if (
      Array.isArray(
        data.data.records,
      )
    ) {
      return data.data.records;
    }

    if (
      Array.isArray(
        data.data.items,
      )
    ) {
      return data.data.items;
    }

    if (
      Array.isArray(
        data.data.results,
      )
    ) {
      return data.data.results;
    }
  }

  return [];
}

/* =========================================================
   EXTRACT COLUMNS
========================================================= */

function extractColumns(
  records: Record<string, any>[],
): string[] {
  if (!records.length) {
    return [];
  }

  const columnSet =
    new Set<string>();

  records.forEach((record) => {
    Object.keys(record).forEach(
      (key) => {
        columnSet.add(key);
      },
    );
  });

  return Array.from(columnSet);
}

/* =========================================================
   EXTRACT SUMMARY
========================================================= */

function extractSummary(
  data: any,
): Record<string, unknown> {
  if (!data) {
    return {};
  }

  if (
    data.summary &&
    typeof data.summary === "object"
  ) {
    return data.summary;
  }

  if (
    data.data?.summary &&
    typeof data.data.summary === "object"
  ) {
    return data.data.summary;
  }

  return {};
}

/* =========================================================
   BUILD QUERY
========================================================= */

function buildQuery(
  reportKey: ReportKey,
  startDate: string,
  endDate: string,
): string {
  const params =
    new URLSearchParams();

  if (
    reportKey === "daily-sales"
  ) {
    params.set(
      "date",
      endDate,
    );
  } else if (
    reportKey === "monthly-sales"
  ) {
    const date = new Date(
      `${endDate}T00:00:00`,
    );

    params.set(
      "year",
      String(
        date.getFullYear(),
      ),
    );

    params.set(
      "month",
      String(
        date.getMonth() + 1,
      ),
    );
  } else if (
    reportKey === "annual-sales"
  ) {
    const date = new Date(
      `${endDate}T00:00:00`,
    );

    params.set(
      "year",
      String(
        date.getFullYear(),
      ),
    );
  } else if (
    reportKey === "balance-sheet"
  ) {
    params.set(
      "asOfDate",
      endDate,
    );
  } else if (
    reportKey === "inventory"
  ) {
    // Inventory report does not require date parameters.
  } else {
    params.set(
      "startDate",
      startDate,
    );

    params.set(
      "endDate",
      endDate,
    );
  }

  return params.toString();
}

/* =========================================================
   FINANCE CARD
========================================================= */

function FinanceCard({
  title,
  value,
  icon,
  description,
  valueClassName = "text-slate-900",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${valueClassName}`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FINANCE SECTION
========================================================= */

function FinanceSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   FINANCE ROW
========================================================= */

function FinanceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 px-5 py-3",
        strong
          ? "bg-slate-50"
          : "",
      ].join(" ")}
    >
      <span
        className={[
          "text-sm",
          strong
            ? "font-bold text-slate-900"
            : "text-slate-600",
        ].join(" ")}
      >
        {label}
      </span>

      <span
        className={[
          "whitespace-nowrap text-sm",
          strong
            ? "font-bold text-slate-900"
            : "font-medium text-slate-800",
        ].join(" ")}
      >
        {formatMoney(value)}
      </span>
    </div>
  );
}

/* =========================================================
   PROFIT & LOSS
========================================================= */

function ProfitLossView({
  data,
}: {
  data: ProfitLossReport;
}) {
  const totalIncome =
    Number(
      data.income?.total || 0,
    );

  const totalExpenses =
    Number(
      data.expenses?.total || 0,
    );

  const netProfit =
    Number(
      data.netProfit || 0,
    );

  const profitMargin =
    Number(
      data.profitMargin || 0,
    );

  const incomeBreakdown =
    Array.isArray(
      data.income?.breakdown,
    )
      ? data.income?.breakdown || []
      : [];

  const expenseBreakdown =
    Array.isArray(
      data.expenses?.breakdown,
    )
      ? data.expenses?.breakdown || []
      : [];

  return (
    <div className="space-y-5">
      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceCard
          title="Total Income"
          value={formatMoney(
            totalIncome,
          )}
          icon={
            <ArrowUpCircle className="h-5 w-5" />
          }
          description="Income for selected period"
          valueClassName="text-emerald-600"
        />

        <FinanceCard
          title="Total Expenses"
          value={formatMoney(
            totalExpenses,
          )}
          icon={
            <ArrowDownCircle className="h-5 w-5" />
          }
          description="Expenses for selected period"
          valueClassName="text-red-600"
        />

        <FinanceCard
          title="Net Profit"
          value={formatMoney(
            netProfit,
          )}
          icon={
            <Wallet className="h-5 w-5" />
          }
          description="Income minus expenses"
          valueClassName={
            netProfit >= 0
              ? "text-blue-600"
              : "text-red-600"
          }
        />

        <FinanceCard
          title="Profit Margin"
          value={formatPercentage(
            profitMargin,
          )}
          icon={
            <BarChart3 className="h-5 w-5" />
          }
          description="Net profit margin"
          valueClassName="text-slate-900"
        />
      </div>

      {/* BREAKDOWNS */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <FinanceSection title="Income Breakdown">
          {incomeBreakdown.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No income breakdown available.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {incomeBreakdown.map(
                (
                  item,
                  index,
                ) => (
                  <FinanceRow
                    key={`income-${index}`}
                    label={
                      String(
                        item.category ||
                          item.label ||
                          item.name ||
                          "Income",
                      )
                    }
                    value={Number(
                      item.amount || 0,
                    )}
                  />
                ),
              )}

              <FinanceRow
                label="Total Income"
                value={totalIncome}
                strong
              />
            </div>
          )}
        </FinanceSection>

        <FinanceSection title="Expense Breakdown">
          {expenseBreakdown.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No expense breakdown available.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenseBreakdown.map(
                (
                  item,
                  index,
                ) => (
                  <FinanceRow
                    key={`expense-${index}`}
                    label={
                      String(
                        item.category ||
                          item.label ||
                          item.name ||
                          "Expense",
                      )
                    }
                    value={Number(
                      item.amount || 0,
                    )}
                  />
                ),
              )}

              <FinanceRow
                label="Total Expenses"
                value={totalExpenses}
                strong
              />
            </div>
          )}
        </FinanceSection>
      </div>

      {/* NET RESULT */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Net Result
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total income minus total expenses
            </p>
          </div>

          <p
            className={[
              "text-2xl font-bold",
              netProfit >= 0
                ? "text-emerald-600"
                : "text-red-600",
            ].join(" ")}
          >
            {formatMoney(netProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BALANCE SHEET
========================================================= */

function BalanceSheetView({
  data,
}: {
  data: BalanceSheetReport;
}) {
  const currentAssets =
    data.assets?.currentAssets || {};

  const currentLiabilities =
    data.liabilities
      ?.currentLiabilities || {};

  const equity =
    data.equity || {};

  const totalAssets =
    Number(
      data.assets?.totalAssets || 0,
    );

  const totalLiabilities =
    Number(
      data.liabilities
        ?.totalLiabilities || 0,
    );

  const totalLiabilitiesAndEquity =
    Number(
      equity.totalLiabilitiesAndEquity ||
        0,
    );

  return (
    <div className="space-y-5">
      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FinanceCard
          title="Total Assets"
          value={formatMoney(
            totalAssets,
          )}
          icon={
            <Wallet className="h-5 w-5" />
          }
          description="Total business assets"
          valueClassName="text-blue-600"
        />

        <FinanceCard
          title="Total Liabilities"
          value={formatMoney(
            totalLiabilities,
          )}
          icon={
            <ArrowDownCircle className="h-5 w-5" />
          }
          description="Total business liabilities"
          valueClassName="text-red-600"
        />

        <FinanceCard
          title="Liabilities + Equity"
          value={formatMoney(
            totalLiabilitiesAndEquity,
          )}
          icon={
            <BarChart3 className="h-5 w-5" />
          }
          description="Balance sheet total"
          valueClassName="text-slate-900"
        />
      </div>

      {/* BALANCE SHEET */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <FinanceSection title="Current Assets">
          <div className="divide-y divide-slate-100">
            <FinanceRow
              label="Cash on Hand"
              value={Number(
                currentAssets.cashOnHand ||
                  0,
              )}
            />

            <FinanceRow
              label="Bank Accounts"
              value={Number(
                currentAssets.bankAccounts ||
                  0,
              )}
            />

            <FinanceRow
              label="Accounts Receivable"
              value={Number(
                currentAssets.accountsReceivable ||
                  0,
              )}
            />

            <FinanceRow
              label="Inventory Valuation"
              value={Number(
                currentAssets.inventoryValuation ||
                  0,
              )}
            />

            <FinanceRow
              label="Total Assets"
              value={totalAssets}
              strong
            />
          </div>
        </FinanceSection>

        <FinanceSection title="Current Liabilities">
          <div className="divide-y divide-slate-100">
            <FinanceRow
              label="Accounts Payable"
              value={Number(
                currentLiabilities.accountsPayable ||
                  0,
              )}
            />

            <FinanceRow
              label="Total Liabilities"
              value={totalLiabilities}
              strong
            />
          </div>
        </FinanceSection>
      </div>

      <FinanceSection title="Equity">
        <div className="divide-y divide-slate-100">
          <FinanceRow
            label="Retained Earnings"
            value={Number(
              equity.retainedEarnings ||
                0,
            )}
          />

          <FinanceRow
            label="Net Working Capital"
            value={Number(
              equity.netWorkingCapital ||
                0,
            )}
          />

          <FinanceRow
            label="Total Liabilities + Equity"
            value={
              totalLiabilitiesAndEquity
            }
            strong
          />
        </div>
      </FinanceSection>

      {/* BALANCE CHECK */}

      <div
        className={[
          "rounded-xl border px-5 py-4",
          Math.abs(
            totalAssets -
              totalLiabilitiesAndEquity,
          ) < 0.01
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50",
        ].join(" ")}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Balance Sheet Check
            </p>

            <p className="text-xs text-slate-500">
              Assets should equal Liabilities + Equity
            </p>
          </div>

          <p
            className={[
              "text-sm font-bold",
              Math.abs(
                totalAssets -
                  totalLiabilitiesAndEquity,
              ) < 0.01
                ? "text-emerald-700"
                : "text-amber-700",
            ].join(" ")}
          >
            Difference:{" "}
            {formatMoney(
              totalAssets -
                totalLiabilitiesAndEquity,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CASH FLOW
========================================================= */

function CashFlowView({
  data,
}: {
  data: CashFlowReport;
}) {
  const opening =
    data.openingBalance || {};

  const inflows =
    data.inflows || {};

  const outflows =
    data.outflows || {};

  const closing =
    data.closingBalance || {};

  const netCashFlow =
    Number(
      data.netCashFlow || 0,
    );

  return (
    <div className="space-y-5">
      {/* KPI CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <FinanceCard
          title="Opening Balance"
          value={formatMoney(
            opening.total,
          )}
          icon={
            <Wallet className="h-5 w-5" />
          }
          description="Beginning balance"
        />

        <FinanceCard
          title="Total Inflows"
          value={formatMoney(
            inflows.total,
          )}
          icon={
            <ArrowUpCircle className="h-5 w-5" />
          }
          description="Cash + bank inflows"
          valueClassName="text-emerald-600"
        />

        <FinanceCard
          title="Total Outflows"
          value={formatMoney(
            outflows.total,
          )}
          icon={
            <ArrowDownCircle className="h-5 w-5" />
          }
          description="Cash + bank outflows"
          valueClassName="text-red-600"
        />

        <FinanceCard
          title="Net Cash Flow"
          value={formatMoney(
            netCashFlow,
          )}
          icon={
            <BarChart3 className="h-5 w-5" />
          }
          description="Inflows minus outflows"
          valueClassName={
            netCashFlow >= 0
              ? "text-emerald-600"
              : "text-red-600"
          }
        />

        <FinanceCard
          title="Closing Balance"
          value={formatMoney(
            closing.total,
          )}
          icon={
            <Wallet className="h-5 w-5" />
          }
          description="Ending balance"
          valueClassName="text-blue-600"
        />
      </div>

      {/* CASH / BANK TABLE */}

      <FinanceSection title="Cash & Bank Movement">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Account
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Opening
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Inflows
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Outflows
                </th>

                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Closing
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                  Cash
                </td>

                <td className="px-5 py-4 text-right text-sm text-slate-700">
                  {formatMoney(
                    opening.cash,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-medium text-emerald-600">
                  {formatMoney(
                    inflows.cashIn,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-medium text-red-600">
                  {formatMoney(
                    outflows.cashOut,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                  {formatMoney(
                    closing.cash,
                  )}
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                  Bank
                </td>

                <td className="px-5 py-4 text-right text-sm text-slate-700">
                  {formatMoney(
                    opening.bank,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-medium text-emerald-600">
                  {formatMoney(
                    inflows.bankIn,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-medium text-red-600">
                  {formatMoney(
                    outflows.bankOut,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                  {formatMoney(
                    closing.bank,
                  )}
                </td>
              </tr>

              <tr className="bg-slate-50">
                <td className="px-5 py-4 text-sm font-bold text-slate-900">
                  Total
                </td>

                <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                  {formatMoney(
                    opening.total,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">
                  {formatMoney(
                    inflows.total,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-bold text-red-700">
                  {formatMoney(
                    outflows.total,
                  )}
                </td>

                <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                  {formatMoney(
                    closing.total,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </FinanceSection>

      {/* CASH FLOW SUMMARY */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cash Flow Summary
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Net movement during the selected period
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm font-semibold text-slate-700">
              Net Cash Flow
            </span>

            <span
              className={[
                "text-xl font-bold",
                netCashFlow >= 0
                  ? "text-emerald-600"
                  : "text-red-600",
              ].join(" ")}
            >
              {formatMoney(
                netCashFlow,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ReportsPage() {
  const [activeReport, setActiveReport] =
    useState<ReportKey>(
      "daily-sales",
    );

  const [startDate, setStartDate] =
    useState(
      getDefaultStartDate(),
    );

  const [endDate, setEndDate] =
    useState(
      getDefaultEndDate(),
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [reportData, setReportData] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [exporting, setExporting] =
    useState<
      "csv" | "pdf" | null
    >(null);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const currentConfig =
    useMemo(
      () =>
        REPORT_CONFIGS.find(
          (report) =>
            report.key ===
            activeReport,
        )!,
      [activeReport],
    );

  const financeMode =
    isFinanceReport(
      activeReport,
    );

  /* =========================================================
     FETCH REPORT
  ========================================================= */

  const fetchReport =
    useCallback(
      async () => {
        setLoading(true);
        setError(null);

        try {
          const query =
            buildQuery(
              activeReport,
              startDate,
              endDate,
            );

          const url =
            `${API_URL}${currentConfig.endpoint}` +
            (query
              ? `?${query}`
              : "");

          console.log(
            `[Reports] Loading: ${currentConfig.label}`,
          );

          console.log(
            `[Reports] URL: ${url}`,
          );

          const token =
            getToken();

          console.log(
            "[Reports] Has token:",
            !!token,
          );

          const response =
            await fetch(
              url,
              {
                method: "GET",
                headers:
                  getHeaders(),
                cache: "no-store",
              },
            );

          const contentType =
            response.headers.get(
              "content-type",
            ) || "";

          let result: any = null;

          if (
            contentType.includes(
              "application/json",
            )
          ) {
            result =
              await response.json();
          } else {
            const text =
              await response.text();

            try {
              result =
                JSON.parse(text);
            } catch {
              result = {
                message: text,
              };
            }
          }

          console.log(
            `[Reports] ${currentConfig.label} response:`,
            result,
          );

          if (!response.ok) {
            const message =
              getErrorMessage(
                result,
                `Failed to load ${currentConfig.label}`,
              );

            throw new Error(
              message,
            );
          }

          setReportData(
            result,
          );
        } catch (err: any) {
          console.error(
            `[Reports] ${currentConfig.label} error:`,
            err,
          );

          setReportData(null);

          setError(
            getErrorMessage(
              err,
              `Unable to load ${currentConfig.label}`,
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [
        activeReport,
        currentConfig.endpoint,
        currentConfig.label,
        endDate,
        startDate,
      ],
    );

  /* =========================================================
     LOAD REPORT
  ========================================================= */

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* =========================================================
     ROOT REPORT DATA
  ========================================================= */

  const rootData = useMemo(
    () =>
      getRootData(
        reportData,
      ),
    [reportData],
  );

  /* =========================================================
     RECORDS
  ========================================================= */

  const allRecords =
    useMemo(
      () =>
        extractRecords(
          reportData,
        ),
      [reportData],
    );

  const records =
    useMemo(() => {
      if (!searchTerm.trim()) {
        return allRecords;
      }

      const term =
        searchTerm
          .trim()
          .toLowerCase();

      return allRecords.filter(
        (record) =>
          Object.values(record)
            .map((value) =>
              String(
                value ?? "",
              ).toLowerCase(),
            )
            .join(" ")
            .includes(term),
      );
    }, [
      allRecords,
      searchTerm,
    ]);

  const columns =
    useMemo(
      () =>
        extractColumns(
          records,
        ),
      [records],
    );

  const summary =
    useMemo(
      () =>
        extractSummary(
          reportData,
        ),
      [reportData],
    );

  const summaryEntries =
    useMemo(
      () =>
        Object.entries(
          summary,
        ).filter(
          ([, value]) =>
            value !== null &&
            value !== undefined &&
            typeof value !==
              "object",
        ),
      [summary],
    );

  /* =========================================================
     FINANCE RECORD COUNT
  ========================================================= */

  const financeRecordCount =
    useMemo(() => {
      if (
        activeReport ===
        "profit-loss"
      ) {
        const incomeCount =
          Array.isArray(
            rootData?.income
              ?.breakdown,
          )
            ? rootData.income
                .breakdown.length
            : 0;

        const expenseCount =
          Array.isArray(
            rootData?.expenses
              ?.breakdown,
          )
            ? rootData.expenses
                .breakdown.length
            : 0;

        return (
          incomeCount +
          expenseCount
        );
      }

      if (
        activeReport ===
        "balance-sheet"
      ) {
        return 1;
      }

      if (
        activeReport ===
        "cash-flow"
      ) {
        return 2;
      }

      return 0;
    }, [
      activeReport,
      rootData,
    ]);

  /* =========================================================
     EXPORT
  ========================================================= */

  const handleExport =
    async (
      format:
        | "csv"
        | "pdf",
    ) => {
      setExporting(format);
      setError(null);

      try {
        const endpoint =
          format === "csv"
            ? currentConfig.csvEndpoint
            : currentConfig.pdfEndpoint;

        const query =
          buildQuery(
            activeReport,
            startDate,
            endDate,
          );

        const url =
          `${API_URL}${endpoint}` +
          (query
            ? `?${query}`
            : "");

        const token =
          getToken();

        const response =
          await fetch(
            url,
            {
              method: "GET",
              headers: {
                ...(token
                  ? {
                      Authorization: `Bearer ${token}`,
                    }
                  : {}),
                Accept:
                  format ===
                  "csv"
                    ? "text/csv"
                    : "application/pdf",
              },
            },
          );

        if (!response.ok) {
          let message =
            `Failed to export ${format.toUpperCase()}`;

          try {
            const data =
              await response.json();

            message =
              data?.message ||
              message;
          } catch {
            // Ignore non-json error response.
          }

          throw new Error(
            message,
          );
        }

        const blob =
          await response.blob();

        const objectUrl =
          window.URL.createObjectURL(
            blob,
          );

        const anchor =
          document.createElement(
            "a",
          );

        anchor.href =
          objectUrl;

        const safeName =
          currentConfig.label
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              "-",
            )
            .replace(
              /^-|-$/g,
              "",
            );

        anchor.download =
          `${safeName}-${endDate}.${format}`;

        document.body.appendChild(
          anchor,
        );

        anchor.click();

        anchor.remove();

        window.URL.revokeObjectURL(
          objectUrl,
        );
      } catch (err: any) {
        console.error(
          "Export error:",
          err,
        );

        setError(
          err?.message ||
            `Unable to export ${format.toUpperCase()}`,
        );
      } finally {
        setExporting(null);
      }
    };

  /* =========================================================
     REPORT TAB
  ========================================================= */

  const renderReportTab = (
    report: ReportConfig,
  ) => {
    const active =
      activeReport ===
      report.key;

    return (
      <button
        key={report.key}
        type="button"
        onClick={() => {
          setActiveReport(
            report.key,
          );
          setSearchTerm("");
          setError(null);
        }}
        className={[
          "whitespace-nowrap rounded-lg",
          "px-4 py-2.5 text-sm font-medium",
          "transition-all duration-150",
          "border",
          active
            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
        ].join(" ")}
      >
        {report.label}
      </button>
    );
  };

  /* =========================================================
     FINANCE CONTENT
  ========================================================= */

  const renderFinanceContent =
    () => {
      if (
        activeReport ===
        "profit-loss"
      ) {
        return (
          <ProfitLossView
            data={
              rootData as ProfitLossReport
            }
          />
        );
      }

      if (
        activeReport ===
        "balance-sheet"
      ) {
        return (
          <BalanceSheetView
            data={
              rootData as BalanceSheetReport
            }
          />
        );
      }

      if (
        activeReport ===
        "cash-flow"
      ) {
        return (
          <CashFlowView
            data={
              rootData as CashFlowReport
            }
          />
        );
      }

      return null;
    };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* PAGE HEADER */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <BarChart3 className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Reports
                  </h1>

                  <p className="mt-0.5 text-sm text-slate-500">
                    View and export business reports
                  </p>
                </div>
              </div>
            </div>

            {/* EXPORT BUTTONS */}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleExport(
                    "csv",
                  )
                }
                disabled={
                  loading ||
                  exporting !== null
                }
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ===
                "csv" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}

                Export CSV
              </button>

              <button
                type="button"
                onClick={() =>
                  handleExport(
                    "pdf",
                  )
                }
                disabled={
                  loading ||
                  exporting !== null
                }
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting ===
                "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}

                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT TABS */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {REPORT_CONFIGS.map(
              renderReportTab,
            )}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}

      <div className="px-6 pt-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            {/* DATE FILTERS */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setStartDate(
                        event.target
                          .value,
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    value={
                      endDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setEndDate(
                        event.target
                          .value,
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={
                  fetchReport
                }
                disabled={
                  loading
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                Refresh
              </button>
            </div>

            {/* SEARCH */}

            <div className="w-full xl:max-w-sm">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search Report
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={
                    searchTerm
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchTerm(
                      event.target
                        .value,
                    )
                  }
                  placeholder={
                    financeMode
                      ? `Search ${currentConfig.label.toLowerCase()}...`
                      : `Search ${currentConfig.label.toLowerCase()}...`
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div className="px-6 pb-8 pt-5">
        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* REPORT TITLE */}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {
                currentConfig.label
              }
            </h2>

            <p className="text-sm text-slate-500">
              {financeMode
                ? `${financeRecordCount.toLocaleString()} financial section${
                    financeRecordCount ===
                    1
                      ? ""
                      : "s"
                  }`
                : `${records.length.toLocaleString()} record${
                    records.length ===
                    1
                      ? ""
                      : "s"
                  }${
                    searchTerm
                      ? " matching your search"
                      : ""
                  }`}
            </p>
          </div>

          {rootData?.period && (
            <div className="text-sm text-slate-500">
              {rootData.period
                .startDate &&
                rootData.period
                  .endDate && (
                  <>
                    {formatDisplayDate(
                      rootData
                        .period
                        .startDate,
                    )}
                    {" — "}
                    {formatDisplayDate(
                      rootData
                        .period
                        .endDate,
                    )}
                  </>
                )}
            </div>
          )}

          {activeReport ===
            "balance-sheet" &&
            rootData?.asOfDate && (
              <div className="text-sm text-slate-500">
                As of{" "}
                <span className="font-semibold text-slate-700">
                  {formatDisplayDate(
                    rootData.asOfDate,
                  )}
                </span>
              </div>
            )}
        </div>

        {/* =====================================================
            FINANCE REPORTS
        ===================================================== */}

        {financeMode ? (
          loading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

                <p className="text-sm font-medium">
                  Loading financial report...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <BarChart3 className="h-7 w-7 text-red-400" />
                </div>

                <h3 className="text-base font-semibold text-slate-800">
                  Unable to load report
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Please check the selected date range and try again.
                </p>
              </div>
            </div>
          ) : (
            renderFinanceContent()
          )
        ) : (
          <>
            {/* SUMMARY CARDS */}

            {summaryEntries.length >
              0 && (
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryEntries
                  .slice(0, 4)
                  .map(
                    ([
                      key,
                      value,
                    ]) => (
                      <div
                        key={
                          key
                        }
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatHeader(
                            key,
                          )}
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-900">
                          {formatCellValue(
                            value,
                            key,
                          )}
                        </p>
                      </div>
                    ),
                  )}
              </div>
            )}

            {/* TABLE */}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

                    <p className="text-sm font-medium">
                      Loading report...
                    </p>
                  </div>
                </div>
              ) : records.length ===
                0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <BarChart3 className="h-7 w-7 text-slate-400" />
                  </div>

                  <h3 className="text-base font-semibold text-slate-800">
                    No records found
                  </h3>

                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    There is no data
                    available for
                    the selected
                    report and date
                    range.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        {columns.map(
                          (
                            column,
                          ) => (
                            <th
                              key={
                                column
                              }
                              className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600"
                            >
                              {formatHeader(
                                column,
                              )}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {records.map(
                        (
                          record,
                          rowIndex,
                        ) => (
                          <tr
                            key={`${activeReport}-${rowIndex}`}
                            className="transition hover:bg-slate-50"
                          >
                            {columns.map(
                              (
                                column,
                              ) => (
                                <td
                                  key={`${rowIndex}-${column}`}
                                  className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                                >
                                  {formatCellValue(
                                    record[
                                      column
                                    ],
                                    column,
                                  )}
                                </td>
                              ),
                            )}
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TABLE FOOTER */}

            {!loading &&
              records.length >
                0 && (
                <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {records.length.toLocaleString()}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {allRecords.length.toLocaleString()}
                    </span>{" "}
                    records
                  </span>

                  <span>
                    Report:{" "}
                    <span className="font-semibold text-slate-700">
                      {
                        currentConfig.label
                      }
                    </span>
                  </span>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}