"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  Printer,
  Percent,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import { financeService } from "@/services/finance.service";

interface ProfitLossData {
  totalIncome: number;
  totalExpense: number;
  operatingProfit: number;
  netProfit: number;
  profitMargin: number;
}

export default function ProfitLossPage() {
  const [data, setData] = useState<ProfitLossData>({
    totalIncome: 0,
    totalExpense: 0,
    operatingProfit: 0,
    netProfit: 0,
    profitMargin: 0,
  });

  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return `Rs. ${(Number(amount) || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchProfitLoss = async () => {
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

      const totalIncome = Number(
        incomeRes.data?.summary?.totalIncome || 0
      );

      const totalExpense = Number(
        expenseRes.data?.summary?.totalExpense || 0
      );

      /*
       * Profit & Loss Calculation
       *
       * Net Profit = Total Income - Total Expenses
       *
       * Since COGS / Cost of Sales is not separately
       * provided by the current Finance API, we do not
       * calculate a separate gross profit here.
       */

      const operatingProfit = totalIncome - totalExpense;

      const netProfit = operatingProfit;

      const profitMargin =
        totalIncome > 0
          ? (netProfit / totalIncome) * 100
          : 0;

      setData({
        totalIncome,
        totalExpense,
        operatingProfit,
        netProfit,
        profitMargin,
      });
    } catch (err: any) {
      console.error("Error loading profit & loss:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load profit & loss report."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [period]);

  const periodLabel =
    period === ""
      ? "All Time"
      : period.charAt(0).toUpperCase() + period.slice(1);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Profit & Loss
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            View income, expenses, operating profit, and profit margin
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
            <option value="">All Time</option>
          </select>

          <button
            onClick={fetchProfitLoss}
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

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total Income */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Income
            </span>

            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-3 text-xl font-bold text-emerald-600">
            {formatCurrency(data.totalIncome)}
          </h3>
        </div>

        {/* Total Expenses */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Expenses
            </span>

            <span className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-3 text-xl font-bold text-rose-600">
            {formatCurrency(data.totalExpense)}
          </h3>
        </div>

        {/* Operating Profit */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Operating Profit
            </span>

            <span
              className={`rounded-lg p-2 ${
                data.operatingProfit >= 0
                  ? "bg-blue-50 text-blue-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <DollarSign className="h-4 w-4" />
            </span>
          </div>

          <h3
            className={`mt-3 text-xl font-bold ${
              data.operatingProfit >= 0
                ? "text-blue-600"
                : "text-rose-600"
            }`}
          >
            {formatCurrency(data.operatingProfit)}
          </h3>
        </div>

        {/* Profit Margin */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Profit Margin
            </span>

            <span
              className={`rounded-lg p-2 ${
                data.profitMargin >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <Percent className="h-4 w-4" />
            </span>
          </div>

          <h3
            className={`mt-3 text-xl font-bold ${
              data.profitMargin >= 0
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {data.profitMargin.toFixed(2)}%
          </h3>
        </div>
      </div>

      {/* Profit & Loss Statement */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />

            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Profit & Loss Statement
              </h3>

              <p className="text-[11px] text-gray-500">
                Period: {periodLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Loading profit & loss...
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">

              {/* Revenue */}
              <div className="border-b border-gray-200 pb-5">
                <h4 className="mb-4 text-sm font-bold text-gray-900">
                  Revenue
                </h4>

                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="text-gray-600">
                    Total Income
                  </span>

                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(data.totalIncome)}
                  </span>
                </div>
              </div>

              {/* Expenses */}
              <div className="border-b border-gray-200 py-5">
                <h4 className="mb-4 text-sm font-bold text-gray-900">
                  Operating Expenses
                </h4>

                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="text-gray-600">
                    Total Expenses
                  </span>

                  <span className="font-semibold text-rose-600">
                    ({formatCurrency(data.totalExpense)})
                  </span>
                </div>
              </div>

              {/* Calculation */}
              <div className="mt-5 rounded-xl bg-gray-50 p-5">

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Total Income
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(data.totalIncome)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Less: Total Expenses
                  </span>

                  <span className="font-semibold text-rose-600">
                    - {formatCurrency(data.totalExpense)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-sm font-bold text-gray-900">
                    Net Profit / (Loss)
                  </span>

                  <span
                    className={`text-lg font-bold ${
                      data.netProfit >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(data.netProfit)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Profit Margin
                  </span>

                  <span
                    className={`font-bold ${
                      data.profitMargin >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {data.profitMargin.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Formula */}
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-[11px] font-semibold text-blue-800">
                  Calculation
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  Net Profit = Total Income − Total Expenses
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  Profit Margin = (Net Profit ÷ Total Income) × 100
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
