"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
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

      {/* =====================================================
          HEADER
      ===================================================== */}
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

      {/* =====================================================
          ERROR
      ===================================================== */}
      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
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
                <CalendarDays className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Profit & Loss Statement
                </h3>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Period: {periodLabel}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Report Period
              </p>

              <p className="mt-0.5 text-xs font-semibold text-gray-700">
                {periodLabel}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-500" />

              <p className="mt-3 text-xs text-gray-400">
                Loading profit & loss...
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

                    <th className="w-[20%] border-b border-gray-200 px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </th>

                    <th className="w-[25%] border-b border-gray-200 px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* =================================================
                      REVENUE SECTION
                  ================================================= */}
                  <tr className="bg-blue-50/50">
                    <td
                      colSpan={3}
                      className="border-b border-gray-200 px-5 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />

                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                          Revenue
                        </span>
                      </div>
                    </td>
                  </tr>

                  <tr className="transition hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          Total Income
                        </p>

                        <p className="mt-0.5 text-[11px] text-gray-400">
                          Total income generated during the selected period
                        </p>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(data.totalIncome)}
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        Income
                      </span>
                    </td>
                  </tr>

                  {/* =================================================
                      EXPENSE SECTION
                  ================================================= */}
                  <tr className="bg-rose-50/40">
                    <td
                      colSpan={3}
                      className="border-b border-gray-200 px-5 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-rose-600" />

                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                          Operating Expenses
                        </span>
                      </div>
                    </td>
                  </tr>

                  <tr className="transition hover:bg-gray-50">
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          Total Expenses
                        </p>

                        <p className="mt-0.5 text-[11px] text-gray-400">
                          Total operating expenses during the selected period
                        </p>
                      </div>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="text-sm font-bold text-rose-600">
                        ({formatCurrency(data.totalExpense)})
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                        Expense
                      </span>
                    </td>
                  </tr>

                  {/* =================================================
                      OPERATING PROFIT
                  ================================================= */}
                  <tr className="bg-blue-50/50">
                    <td
                      colSpan={3}
                      className="border-b border-gray-200 px-5 py-3"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                        Operating Result
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="border-b border-gray-100 px-5 py-4">
                      <p className="text-xs font-semibold text-gray-800">
                        Operating Profit
                      </p>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span
                        className={`text-sm font-bold ${
                          data.operatingProfit >= 0
                            ? "text-blue-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(data.operatingProfit)}
                      </span>
                    </td>

                    <td className="border-b border-gray-100 px-5 py-4 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          data.operatingProfit >= 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {data.operatingProfit >= 0
                          ? "Profit"
                          : "Loss"}
                      </span>
                    </td>
                  </tr>

                  {/* =================================================
                      NET PROFIT
                  ================================================= */}
                  <tr
                    className={
                      data.netProfit >= 0
                        ? "bg-emerald-50/60"
                        : "bg-rose-50/60"
                    }
                  >
                    <td className="px-5 py-5">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Net Profit / (Loss)
                        </p>

                        <p className="mt-0.5 text-[11px] text-gray-500">
                          Income less total operating expenses
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-5 text-right">
                      <span
                        className={`text-lg font-bold ${
                          data.netProfit >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(data.netProfit)}
                      </span>
                    </td>

                    <td className="px-5 py-5 text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${
                          data.netProfit >= 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {data.netProfit >= 0
                          ? "NET PROFIT"
                          : "NET LOSS"}
                      </span>
                    </td>
                  </tr>
                </tbody>

                {/* =================================================
                    FOOTER
                ================================================= */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-gray-500" />

                        <span className="text-xs font-bold text-gray-800">
                          Profit Margin
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span
                        className={`text-base font-bold ${
                          data.profitMargin >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {data.profitMargin.toFixed(2)}%
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-[10px] text-gray-400">
                        Net Profit ÷ Total Income × 100
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* =====================================================
              CALCULATION NOTE
          ===================================================== */}
          {!loading && (
            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-[11px] font-semibold text-blue-800">
                Calculation
              </p>

              <div className="mt-2 space-y-1">
                <p className="text-xs text-blue-700">
                  Net Profit = Total Income − Total Expenses
                </p>

                <p className="text-xs text-blue-700">
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