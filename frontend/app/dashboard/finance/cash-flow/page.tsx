"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building2,
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

      /*
       * CASH FLOW CALCULATION
       *
       * Cash Inflow  = Income received through Cash
       * Cash Outflow = Expenses paid through Cash
       *
       * Bank Inflow  = Income received through Bank
       * Bank Outflow = Expenses paid through Bank
       *
       * Total Inflow  = Cash Inflow + Bank Inflow
       * Total Outflow = Cash Outflow + Bank Outflow
       *
       * Net Cash Flow = Total Inflow - Total Outflow
       */

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

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Cash Flow
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            Track cash inflows, outflows and net cash movement
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

      {/* Main Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Inflow */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Inflow
            </span>

            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>

          <p className="mt-3 text-xl font-bold text-emerald-600">
            {formatCurrency(data.totalInflow)}
          </p>
        </div>

        {/* Total Outflow */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Outflow
            </span>

            <span className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          <p className="mt-3 text-xl font-bold text-rose-600">
            {formatCurrency(data.totalOutflow)}
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Net Cash Flow
            </span>

            <span
              className={`rounded-lg p-2 ${
                data.netCashFlow >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {data.netCashFlow >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </span>
          </div>

          <p
            className={`mt-3 text-xl font-bold ${
              data.netCashFlow >= 0
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {formatCurrency(data.netCashFlow)}
          </p>
        </div>
      </div>

      {/* Cash & Bank */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cash */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900">
              Cash Account
            </h3>

            <Wallet className="h-5 w-5 text-amber-600" />
          </div>

          <div className="p-5">
            <div className="flex justify-between border-b py-4 text-xs">
              <span className="text-gray-600">
                Cash Inflow
              </span>

              <span className="font-bold text-emerald-600">
                + {formatCurrency(data.cashInflow)}
              </span>
            </div>

            <div className="flex justify-between border-b py-4 text-xs">
              <span className="text-gray-600">
                Cash Outflow
              </span>

              <span className="font-bold text-rose-600">
                - {formatCurrency(data.cashOutflow)}
              </span>
            </div>

            <div className="flex justify-between pt-4 text-sm font-bold">
              <span>Net Cash Movement</span>

              <span
                className={
                  data.cashNet >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }
              >
                {formatCurrency(data.cashNet)}
              </span>
            </div>
          </div>
        </div>

        {/* Bank */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900">
              Bank Account
            </h3>

            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>

          <div className="p-5">
            <div className="flex justify-between border-b py-4 text-xs">
              <span className="text-gray-600">
                Bank Inflow
              </span>

              <span className="font-bold text-emerald-600">
                + {formatCurrency(data.bankInflow)}
              </span>
            </div>

            <div className="flex justify-between border-b py-4 text-xs">
              <span className="text-gray-600">
                Bank Outflow
              </span>

              <span className="font-bold text-rose-600">
                - {formatCurrency(data.bankOutflow)}
              </span>
            </div>

            <div className="flex justify-between pt-4 text-sm font-bold">
              <span>Net Bank Movement</span>

              <span
                className={
                  data.bankNet >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }
              >
                {formatCurrency(data.bankNet)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Summary */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-bold text-gray-900">
          Cash Flow Summary
        </h3>

        <div className="mx-auto max-w-3xl space-y-4 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">
              Cash Inflow
            </span>

            <span className="font-semibold text-emerald-600">
              + {formatCurrency(data.cashInflow)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">
              Bank Inflow
            </span>

            <span className="font-semibold text-emerald-600">
              + {formatCurrency(data.bankInflow)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-4">
            <span className="font-semibold text-gray-700">
              Total Inflows
            </span>

            <span className="font-bold text-emerald-600">
              + {formatCurrency(data.totalInflow)}
            </span>
          </div>

          <div className="my-2 border-t border-gray-100" />

          <div className="flex justify-between">
            <span className="text-gray-500">
              Cash Outflow
            </span>

            <span className="font-semibold text-rose-600">
              - {formatCurrency(data.cashOutflow)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">
              Bank Outflow
            </span>

            <span className="font-semibold text-rose-600">
              - {formatCurrency(data.bankOutflow)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-4">
            <span className="font-semibold text-gray-700">
              Total Outflows
            </span>

            <span className="font-bold text-rose-600">
              - {formatCurrency(data.totalOutflow)}
            </span>
          </div>

          <div className="mt-4 flex justify-between rounded-lg bg-gray-50 p-4 text-sm font-bold">
            <span>Net Cash Flow</span>

            <span
              className={
                data.netCashFlow >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }
            >
              {formatCurrency(data.netCashFlow)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}