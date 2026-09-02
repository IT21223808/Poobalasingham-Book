"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Wallet,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import { financeService } from "@/services/finance.service";

interface BalanceSheetData {
  cash: number;
  bank: number;
  receivable: number;
  payable: number;

  currentAssets: number;
  totalAssets: number;

  totalLiabilities: number;
  equity: number;

  liabilitiesAndEquity: number;
  difference: number;
}

export default function BalanceSheetPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState("all");

  const [data, setData] = useState<BalanceSheetData>({
    cash: 0,
    bank: 0,
    receivable: 0,
    payable: 0,
    currentAssets: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    equity: 0,
    liabilitiesAndEquity: 0,
    difference: 0,
  });

  const formatCurrency = (amount: number) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [incomeRes, expenseRes] = await Promise.all([
        financeService.getIncome({
          period,
        }),
        financeService.getExpenses({
          period,
        }),
      ]);

      const income = incomeRes.data?.summary || {};
      const expense = expenseRes.data?.summary || {};

      /*
       * ASSET CALCULATION
       *
       * Cash Balance
       * = Total Cash Income - Total Cash Expenses
       *
       * Bank Balance
       * = Total Bank Income - Total Bank Expenses
       *
       * Current Assets
       * = Cash + Bank + Accounts Receivable
       *
       * Total Assets
       * = Current Assets
       */

      const cash =
        Number(income.totalCash || 0) -
        Number(expense.totalCash || 0);

      const bank =
        Number(income.totalBank || 0) -
        Number(expense.totalBank || 0);

      /*
       * AR/AP are kept as zero until the corresponding
       * finance APIs are connected.
       */
      const receivable = 0;
      const payable = 0;

      const currentAssets =
        cash +
        bank +
        receivable;

      const totalAssets = currentAssets;

      /*
       * Liabilities
       *
       * Total Liabilities = Accounts Payable
       */
      const totalLiabilities = payable;

      /*
       * Accounting Equation:
       *
       * Assets = Liabilities + Equity
       *
       * Therefore:
       *
       * Equity = Assets - Liabilities
       */
      const equity =
        totalAssets -
        totalLiabilities;

      const liabilitiesAndEquity =
        totalLiabilities +
        equity;

      const difference =
        totalAssets -
        liabilitiesAndEquity;

      setData({
        cash,
        bank,
        receivable,
        payable,
        currentAssets,
        totalAssets,
        totalLiabilities,
        equity,
        liabilitiesAndEquity,
        difference,
      });
    } catch (err: any) {
      console.error("Balance sheet error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load Balance Sheet."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const isBalanced =
    Math.abs(data.difference) < 0.01;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Balance Sheet
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            Overview of assets, liabilities and equity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Total Assets */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Total Assets
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatCurrency(data.totalAssets)}
            </p>
          </div>

          <Scale className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Assets */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h3 className="font-bold text-gray-900">
              Assets
            </h3>
          </div>

          <div className="space-y-1 p-5 text-xs">
            <div className="flex justify-between border-b py-3">
              <span className="flex items-center gap-2 text-gray-600">
                <Wallet className="h-4 w-4 text-amber-600" />
                Cash
              </span>

              <span className="font-semibold">
                {formatCurrency(data.cash)}
              </span>
            </div>

            <div className="flex justify-between border-b py-3">
              <span className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Bank
              </span>

              <span className="font-semibold">
                {formatCurrency(data.bank)}
              </span>
            </div>

            <div className="flex justify-between border-b py-3">
              <span className="text-gray-600">
                Accounts Receivable
              </span>

              <span className="font-semibold">
                {formatCurrency(data.receivable)}
              </span>
            </div>

            <div className="mt-3 flex justify-between border-t pt-3 font-bold">
              <span>Total Assets</span>

              <span className="text-blue-600">
                {formatCurrency(data.totalAssets)}
              </span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h3 className="font-bold text-gray-900">
              Liabilities
            </h3>
          </div>

          <div className="space-y-1 p-5 text-xs">
            <div className="flex justify-between border-b py-3">
              <span className="flex items-center gap-2 text-gray-600">
                <ArrowUpRight className="h-4 w-4 text-rose-600" />
                Accounts Payable
              </span>

              <span className="font-semibold">
                {formatCurrency(data.payable)}
              </span>
            </div>

            <div className="mt-3 flex justify-between border-t pt-3 font-bold">
              <span>Total Liabilities</span>

              <span className="text-rose-600">
                {formatCurrency(data.totalLiabilities)}
              </span>
            </div>
          </div>
        </div>

        {/* Equity */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <h3 className="font-bold text-gray-900">
              Equity
            </h3>
          </div>

          <div className="space-y-1 p-5 text-xs">
            <div className="flex justify-between border-b py-3">
              <span className="flex items-center gap-2 text-gray-600">
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                Owner Equity
              </span>

              <span className="font-semibold">
                {formatCurrency(data.equity)}
              </span>
            </div>

            <div className="mt-3 flex justify-between border-t pt-3 font-bold">
              <span>Total Equity</span>

              <span className="text-emerald-600">
                {formatCurrency(data.equity)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Equation */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            Accounting Equation
          </h3>

          {isBalanced ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Balanced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
              <XCircle className="h-3.5 w-3.5" />
              Not Balanced
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">
              Total Assets
            </p>

            <p className="mt-2 text-lg font-bold text-blue-600">
              {formatCurrency(data.totalAssets)}
            </p>
          </div>

          <div className="rounded-lg bg-rose-50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">
              Total Liabilities
            </p>

            <p className="mt-2 text-lg font-bold text-rose-600">
              {formatCurrency(data.totalLiabilities)}
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">
              Total Equity
            </p>

            <p className="mt-2 text-lg font-bold text-emerald-600">
              {formatCurrency(data.equity)}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 border-t pt-5 text-sm">
          <div className="flex justify-between font-bold">
            <span>Total Assets</span>

            <span>
              {formatCurrency(data.totalAssets)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-3 font-bold">
            <span>Liabilities + Equity</span>

            <span>
              {formatCurrency(data.liabilitiesAndEquity)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-3 text-xs">
            <span className="text-gray-500">
              Difference
            </span>

            <span
              className={
                isBalanced
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-rose-600"
              }
            >
              {formatCurrency(data.difference)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}