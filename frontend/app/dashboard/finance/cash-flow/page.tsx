"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import { financeService } from "@/services/finance.service";

interface CashFlowData {
  cashInflow: number;
  cashOutflow: number;
  bankInflow: number;
  bankOutflow: number;
  totalInflow: number;
  totalOutflow: number;
  cashNet: number;
  bankNet: number;
  netCashFlow: number;
}

export default function CashFlowPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("month");

  const [data, setData] = useState<CashFlowData>({
    cashInflow: 0,
    cashOutflow: 0,
    bankInflow: 0,
    bankOutflow: 0,
    totalInflow: 0,
    totalOutflow: 0,
    cashNet: 0,
    bankNet: 0,
    netCashFlow: 0,
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

      const params = {
        period,
      };

      const [incomeRes, expenseRes] = await Promise.all([
        financeService.getIncome(params),
        financeService.getExpenses(params),
      ]);

      const income = incomeRes.data?.summary || {};
      const expense = expenseRes.data?.summary || {};

      const cashInflow = Number(income.totalCash || 0);
      const cashOutflow = Number(expense.totalCash || 0);

      const bankInflow = Number(income.totalBank || 0);
      const bankOutflow = Number(expense.totalBank || 0);

      const totalInflow = cashInflow + bankInflow;
      const totalOutflow = cashOutflow + bankOutflow;

      const cashNet = cashInflow - cashOutflow;
      const bankNet = bankInflow - bankOutflow;

      const netCashFlow = totalInflow - totalOutflow;

      setData({
        cashInflow,
        cashOutflow,
        bankInflow,
        bankOutflow,
        totalInflow,
        totalOutflow,
        cashNet,
        bankNet,
        netCashFlow,
      });
    } catch (err: any) {
      console.error("Cash flow error:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load Cash Flow statement."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const periodLabel =
    period === "all"
      ? "All Time"
      : period === "today"
      ? "Today"
      : period === "week"
      ? "This Week"
      : period === "month"
      ? "This Month"
      : period === "year"
      ? "This Year"
      : period;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Cash Flow
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Track cash inflows, outflows and net cash movement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm outline-none focus:border-blue-500"
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
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* =========================================================
          ERROR
      ========================================================= */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* =========================================================
          SUMMARY CARDS
      ========================================================= */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Inflow */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Total Inflow
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-600">
                {formatCurrency(data.totalInflow)}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Total Outflow
              </p>

              <p className="mt-2 text-xl font-bold text-rose-600">
                {formatCurrency(data.totalOutflow)}
              </p>
            </div>

            <div className="rounded-lg bg-rose-50 p-2.5 text-rose-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Net Cash Flow
              </p>

              <p
                className={`mt-2 text-xl font-bold ${
                  data.netCashFlow >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {formatCurrency(data.netCashFlow)}
              </p>
            </div>

            <div
              className={`rounded-lg p-2.5 ${
                data.netCashFlow >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {data.netCashFlow >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          CASH FLOW STATEMENT
      ========================================================= */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Cash Flow Statement
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Cash movement for {periodLabel}
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
              {periodLabel}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>

                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Cash
                </th>

                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Bank
                </th>

                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {/* =================================================
                  INFLOWS
              ================================================= */}
              <tr className="bg-emerald-50/60">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-emerald-700"
                >
                  Cash Inflows
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="px-6 py-4 text-sm text-gray-700">
                  Cash Inflow
                </td>

                <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">
                  + {formatCurrency(data.cashInflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm text-gray-400">
                  —
                </td>

                <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                  + {formatCurrency(data.cashInflow)}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="px-6 py-4 text-sm text-gray-700">
                  Bank Inflow
                </td>

                <td className="px-6 py-4 text-right text-sm text-gray-400">
                  —
                </td>

                <td className="px-6 py-4 text-right text-sm font-medium text-emerald-600">
                  + {formatCurrency(data.bankInflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                  + {formatCurrency(data.bankInflow)}
                </td>
              </tr>

              <tr className="border-b border-gray-200 bg-gray-50/70">
                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                  Total Inflows
                </td>

                <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                  + {formatCurrency(data.cashInflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                  + {formatCurrency(data.bankInflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                  + {formatCurrency(data.totalInflow)}
                </td>
              </tr>

              {/* =================================================
                  OUTFLOWS
              ================================================= */}
              <tr className="bg-rose-50/60">
                <td
                  colSpan={4}
                  className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-rose-700"
                >
                  Cash Outflows
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="px-6 py-4 text-sm text-gray-700">
                  Cash Outflow
                </td>

                <td className="px-6 py-4 text-right text-sm font-medium text-rose-600">
                  - {formatCurrency(data.cashOutflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm text-gray-400">
                  —
                </td>

                <td className="px-6 py-4 text-right text-sm font-semibold text-rose-600">
                  - {formatCurrency(data.cashOutflow)}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="px-6 py-4 text-sm text-gray-700">
                  Bank Outflow
                </td>

                <td className="px-6 py-4 text-right text-sm text-gray-400">
                  —
                </td>

                <td className="px-6 py-4 text-right text-sm font-medium text-rose-600">
                  - {formatCurrency(data.bankOutflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm font-semibold text-rose-600">
                  - {formatCurrency(data.bankOutflow)}
                </td>
              </tr>

              <tr className="border-b border-gray-200 bg-gray-50/70">
                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                  Total Outflows
                </td>

                <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">
                  - {formatCurrency(data.cashOutflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">
                  - {formatCurrency(data.bankOutflow)}
                </td>

                <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">
                  - {formatCurrency(data.totalOutflow)}
                </td>
              </tr>

              {/* =================================================
                  NET MOVEMENT
              ================================================= */}
              <tr className="bg-gray-900">
                <td className="px-6 py-5 text-sm font-bold text-white">
                  Net Cash Flow
                </td>

                <td
                  className={`px-6 py-5 text-right text-sm font-bold ${
                    data.cashNet >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {data.cashNet >= 0 ? "+" : "-"}{" "}
                  {formatCurrency(Math.abs(data.cashNet))}
                </td>

                <td
                  className={`px-6 py-5 text-right text-sm font-bold ${
                    data.bankNet >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {data.bankNet >= 0 ? "+" : "-"}{" "}
                  {formatCurrency(Math.abs(data.bankNet))}
                </td>

                <td
                  className={`px-6 py-5 text-right text-base font-bold ${
                    data.netCashFlow >= 0
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }`}
                >
                  {data.netCashFlow >= 0 ? "+" : "-"}{" "}
                  {formatCurrency(Math.abs(data.netCashFlow))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          ACCOUNT MOVEMENT SUMMARY
      ========================================================= */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cash Account */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-900">
              Cash Account
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              Cash movement summary
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-xs text-gray-600">
                Cash Inflow
              </span>

              <span className="text-sm font-semibold text-emerald-600">
                + {formatCurrency(data.cashInflow)}
              </span>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-xs text-gray-600">
                Cash Outflow
              </span>

              <span className="text-sm font-semibold text-rose-600">
                - {formatCurrency(data.cashOutflow)}
              </span>
            </div>

            <div className="flex items-center justify-between bg-gray-50 px-5 py-4">
              <span className="text-sm font-bold text-gray-800">
                Net Cash Movement
              </span>

              <span
                className={`text-sm font-bold ${
                  data.cashNet >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {data.cashNet >= 0 ? "+" : "-"}{" "}
                {formatCurrency(Math.abs(data.cashNet))}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Account */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <h3 className="text-sm font-bold text-gray-900">
              Bank Account
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              Bank movement summary
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-xs text-gray-600">
                Bank Inflow
              </span>

              <span className="text-sm font-semibold text-emerald-600">
                + {formatCurrency(data.bankInflow)}
              </span>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-xs text-gray-600">
                Bank Outflow
              </span>

              <span className="text-sm font-semibold text-rose-600">
                - {formatCurrency(data.bankOutflow)}
              </span>
            </div>

            <div className="flex items-center justify-between bg-gray-50 px-5 py-4">
              <span className="text-sm font-bold text-gray-800">
                Net Bank Movement
              </span>

              <span
                className={`text-sm font-bold ${
                  data.bankNet >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {data.bankNet >= 0 ? "+" : "-"}{" "}
                {formatCurrency(Math.abs(data.bankNet))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          FOOTER NOTE
      ========================================================= */}
      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs leading-5 text-blue-800">
          <span className="font-semibold">Cash Flow:</span>{" "}
          Total Inflows minus Total Outflows represents the
          net cash movement for the selected period.
        </p>
      </div>
    </div>
  );
}