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

      const cash =
        Number(income.totalCash || 0) -
        Number(expense.totalCash || 0);

      const bank =
        Number(income.totalBank || 0) -
        Number(expense.totalBank || 0);

      const receivable = 0;
      const payable = 0;

      const currentAssets =
        cash +
        bank +
        receivable;

      const totalAssets = currentAssets;

      const totalLiabilities = payable;

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

  const periodLabel =
    period === "all"
      ? "All Time"
      : period.charAt(0).toUpperCase() +
        period.slice(1);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* =====================================================
          HEADER
      ===================================================== */}
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

      {/* =====================================================
          ERROR
      ===================================================== */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* =====================================================
          REPORT HEADER
      ===================================================== */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Scale className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Balance Sheet Statement
                </h3>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Financial position — {periodLabel}
                </p>
              </div>
            </div>

            {/* Balance Status */}
            {!loading && (
              <div
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  isBalanced
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50"
                }`}
              >
                {isBalanced ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )}

                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isBalanced
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {isBalanced
                      ? "Balanced"
                      : "Not Balanced"}
                  </p>

                  <p className="text-[10px] text-gray-500">
                    Assets = Liabilities + Equity
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            BALANCE SHEET TABLE
        ===================================================== */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-500" />

              <p className="mt-3 text-xs text-gray-400">
                Loading balance sheet...
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="w-[55%] border-b border-gray-200 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Description
                    </th>

                    <th className="w-[25%] border-b border-gray-200 px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </th>

                    <th className="w-[20%] border-b border-gray-200 px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Classification
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* =================================================
                      ASSETS
                  ================================================= */}
                  <tr className="bg-blue-50/50">
                    <td
                      colSpan={3}
                      className="border-b border-gray-200 px-5 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-blue-600" />

                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                          Assets
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Cash */}
                  <tr className="transition hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-amber-50 p-2">
                          <Wallet className="h-4 w-4 text-amber-600" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            Cash
                          </p>

                          <p className="text-[10px] text-gray-400">
                            Cash available in business
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(data.cash)}
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                        Current Asset
                      </span>
                    </td>
                  </tr>

                  {/* Bank */}
                  <tr className="transition hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-indigo-50 p-2">
                          <Building2 className="h-4 w-4 text-indigo-600" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            Bank
                          </p>

                          <p className="text-[10px] text-gray-400">
                            Bank balances
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(data.bank)}
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                        Current Asset
                      </span>
                    </td>
                  </tr>

                  {/* Receivable */}
                  <tr className="transition hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-blue-50 p-2">
                          <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            Accounts Receivable
                          </p>

                          <p className="text-[10px] text-gray-400">
                            Amount receivable from customers
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(data.receivable)}
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        Current Asset
                      </span>
                    </td>
                  </tr>

                  {/* Current Assets */}
                  <tr className="bg-blue-50/30">
                    <td className="border-b border-gray-200 px-5 py-4">
                      <span className="text-xs font-bold text-gray-900">
                        Total Current Assets
                      </span>
                    </td>

                    <td className="border-b border-gray-200 px-5 py-4 text-right">
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(data.currentAssets)}
                      </span>
                    </td>

                    <td className="border-b border-gray-200 px-5 py-4 text-right">
                      <span className="text-[10px] font-medium text-gray-400">
                        Cash + Bank + AR
                      </span>
                    </td>
                  </tr>

                  {/* Total Assets */}
                  <tr className="bg-blue-100/50">
                    <td className="px-5 py-5">
                      <span className="text-sm font-bold text-gray-900">
                        TOTAL ASSETS
                      </span>
                    </td>

                    <td className="px-5 py-5 text-right">
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(data.totalAssets)}
                      </span>
                    </td>

                    <td className="px-5 py-5 text-right">
                      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold text-blue-700">
                        ASSETS
                      </span>
                    </td>
                  </tr>

                  {/* =================================================
                      LIABILITIES
                  ================================================= */}
                  <tr className="bg-rose-50/50">
                    <td
                      colSpan={3}
                      className="border-b border-gray-200 px-5 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4 text-rose-600" />

                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                          Liabilities
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Payable */}
                  <tr className="transition hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-rose-50 p-2">
                          <ArrowUpRight className="h-4 w-4 text-rose-600" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            Accounts Payable
                          </p>

                          <p className="text-[10px] text-gray-400">
                            Amount payable to suppliers
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(data.payable)}
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                        Current Liability
                      </span>
                    </td>
                  </tr>

                  {/* Total Liabilities */}
                  <tr className="bg-rose-50/30">
                    <td className="border-b border-gray-200 px-5 py-4">
                      <span className="text-xs font-bold text-gray-900">
                        TOTAL LIABILITIES
                      </span>
                    </td>

                    <td className="border-b border-gray-200 px-5 py-4 text-right">
                      <span className="text-sm font-bold text-rose-600">
                        {formatCurrency(data.totalLiabilities)}
                      </span>
                    </td>

                    <td className="border-b border-gray-200 px-5 py-4 text-right">
                      <span className="text-[10px] font-medium text-gray-400">
                        Total Payables
                      </span>
                    </td>
                  </tr>

                  {/* =================================================
                      EQUITY
                  ================================================= */}
                  <tr className="bg-emerald-50/50">
                    <td
                      colSpan={3}
                      className="border-b border-gray-200 px-5 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="h-4 w-4 text-emerald-600" />

                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                          Equity
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Owner Equity */}
                  <tr className="transition hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-emerald-50 p-2">
                          <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            Owner Equity
                          </p>

                          <p className="text-[10px] text-gray-400">
                            Assets less liabilities
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(data.equity)}
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        Equity
                      </span>
                    </td>
                  </tr>

                  {/* Total Equity */}
                  <tr className="bg-emerald-50/30">
                    <td className="border-b border-gray-200 px-5 py-4">
                      <span className="text-xs font-bold text-gray-900">
                        TOTAL EQUITY
                      </span>
                    </td>

                    <td className="border-b border-gray-200 px-5 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(data.equity)}
                      </span>
                    </td>

                    <td className="border-b border-gray-200 px-5 py-4 text-right">
                      <span className="text-[10px] font-medium text-gray-400">
                        Owner Equity
                      </span>
                    </td>
                  </tr>

                  {/* =================================================
                      LIABILITIES + EQUITY
                  ================================================= */}
                  <tr className="bg-gray-100">
                    <td className="px-5 py-5">
                      <span className="text-sm font-bold text-gray-900">
                        TOTAL LIABILITIES + EQUITY
                      </span>
                    </td>

                    <td className="px-5 py-5 text-right">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(
                          data.liabilitiesAndEquity
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-5 text-right">
                      <span className="inline-flex rounded-full bg-gray-200 px-3 py-1 text-[10px] font-bold text-gray-700">
                        L + E
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* =====================================================
              ACCOUNTING EQUATION SUMMARY
          ===================================================== */}
          {!loading && (
            <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Accounting Equation
                </h3>
              </div>

              <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
                {/* Assets */}
                <div className="p-5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Total Assets
                  </p>

                  <p className="mt-2 text-lg font-bold text-blue-600">
                    {formatCurrency(data.totalAssets)}
                  </p>
                </div>

                {/* Liabilities */}
                <div className="p-5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Total Liabilities
                  </p>

                  <p className="mt-2 text-lg font-bold text-rose-600">
                    {formatCurrency(data.totalLiabilities)}
                  </p>
                </div>

                {/* Equity */}
                <div className="p-5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Total Equity
                  </p>

                  <p className="mt-2 text-lg font-bold text-emerald-600">
                    {formatCurrency(data.equity)}
                  </p>
                </div>
              </div>

              {/* Equation */}
              <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">
                      Assets
                    </span>

                    {" = "}

                    <span className="font-semibold text-gray-900">
                      Liabilities
                    </span>

                    {" + "}

                    <span className="font-semibold text-gray-900">
                      Equity
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                      isBalanced
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {isBalanced ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        BALANCED
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        NOT BALANCED
                      </>
                    )}
                  </div>
                </div>

                {/* Difference */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-xs text-gray-500">
                    Difference
                  </span>

                  <span
                    className={`text-sm font-bold ${
                      isBalanced
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(data.difference)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              NOTE
          ===================================================== */}
          {!loading && (
            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-[11px] font-semibold text-blue-800">
                Accounting Note
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                The balance sheet follows the accounting equation:
                Assets = Liabilities + Equity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}