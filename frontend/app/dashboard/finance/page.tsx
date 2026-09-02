"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Landmark,
  Scale,
  BarChart3,
  Activity,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import { DashboardData, financeService } from "@/services/finance.service";

export default function FinanceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("month");

  const fetchDashboard = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError(null);

      const res = await financeService.getDashboard({
        period: selectedPeriod,
      });

      setData(res.data);
    } catch (err: any) {
      console.error("Error fetching finance dashboard:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load finance dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const cards = data?.cards || {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashBalance: 0,
    bankBalance: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const financeModules = [
    {
      title: "Cash Book",
      description: "Manage cash receipts and payments",
      href: "/dashboard/finance/cash-book",
      icon: Wallet,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Bank Book",
      description: "Manage bank transactions and balances",
      href: "/dashboard/finance/bank-book",
      icon: Landmark,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Income & Expenses",
      description: "Record and manage income and expenses",
      href: "/dashboard/finance/income-expenses",
      icon: Receipt,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Accounts Receivable",
      description: "Track customer outstanding balances",
      href: "/dashboard/finance/accounts-receivable",
      icon: ArrowDownLeft,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      title: "Accounts Payable",
      description: "Track supplier outstanding balances",
      href: "/dashboard/finance/accounts-payable",
      icon: ArrowUpRight,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Profit & Loss",
      description: "View income, expenses and net profit",
      href: "/dashboard/finance/profit-loss",
      icon: TrendingUp,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Balance Sheet",
      description: "View assets, liabilities and equity",
      href: "/dashboard/finance/balance-sheet",
      icon: Scale,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
    },
    {
      title: "Cash Flow",
      description: "Analyse cash inflows and outflows",
      href: "/dashboard/finance/cash-flow",
      icon: Activity,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      <FinanceNav />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Finance & Accounting
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Financial overview and accounting management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchDashboard(period)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading ? "animate-spin" : ""
                }`}
              />

              Refresh
            </button>

            <Link
              href="/dashboard/finance/income-expenses"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              Record Income / Expense
            </Link>
          </div>
        </div>
      </div>

      {/* Timeframe */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Timeframe:
        </span>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          {[
            { label: "Today", value: "today" },
            { label: "This Week", value: "week" },
            { label: "This Month", value: "month" },
            { label: "This Year", value: "year" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                period === item.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Income */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Income
            </span>

            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            {formatCurrency(cards.totalIncome)}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            In selected timeframe
          </p>
        </div>

        {/* Expenses */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Expenses
            </span>

            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            {formatCurrency(cards.totalExpenses)}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            In selected timeframe
          </p>
        </div>

        {/* Net Profit */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Net Profit
            </span>

            <div
              className={`rounded-lg p-2 ${
                cards.netProfit >= 0
                  ? "bg-blue-50 text-blue-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <h3
            className={`mt-3 text-xl font-bold ${
              cards.netProfit >= 0
                ? "text-blue-700"
                : "text-rose-700"
            }`}
          >
            {formatCurrency(cards.netProfit)}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            Income minus Expenses
          </p>
        </div>

        {/* Liquid Funds */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Liquid Funds
            </span>

            <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            {formatCurrency(
              cards.cashBalance + cards.bankBalance
            )}
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            Cash + Bank combined
          </p>
        </div>

        {/* Cash */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Cash Balance
            </span>

            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            {formatCurrency(cards.cashBalance)}
          </h3>

          <Link
            href="/dashboard/finance/cash-book"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            View Cash Book →
          </Link>
        </div>

        {/* Bank */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Bank Balance
            </span>

            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            {formatCurrency(cards.bankBalance)}
          </h3>

          <Link
            href="/dashboard/finance/bank-book"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            View Bank Book →
          </Link>
        </div>

        {/* AR */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Accounts Receivable
            </span>

            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            {formatCurrency(cards.accountsReceivable)}
          </h3>

          <Link
            href="/dashboard/finance/accounts-receivable"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            View Customer Receivables →
          </Link>
        </div>

        {/* AP */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Accounts Payable
            </span>

            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-3 text-xl font-bold text-gray-900">
            {formatCurrency(cards.accountsPayable)}
          </h3>

          <Link
            href="/dashboard/finance/accounts-payable"
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            View Supplier Payables →
          </Link>
        </div>
      </div>

      {/* 8 Finance Modules */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            Finance & Accounting
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Main financial management modules
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {financeModules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.title}
                href={module.href}
                className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg p-2.5 ${module.iconBg} ${module.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                      {module.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {module.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Income vs Expenses */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Income vs Expense Trend
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Monthly breakdown for the last 6 months
              </p>
            </div>

            <div className="hidden items-center gap-4 text-xs sm:flex">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-gray-600">
                  Income
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-rose-500" />
                <span className="text-gray-600">
                  Expense
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {data?.monthlyChart &&
            data.monthlyChart.length > 0 ? (
              data.monthlyChart.map((month) => {
                const maxVal = Math.max(
                  ...data.monthlyChart.map((item) =>
                    Math.max(
                      item.income,
                      item.expense,
                      100
                    )
                  )
                );

                const incomePercent = Math.min(
                  100,
                  (month.income / maxVal) * 100
                );

                const expensePercent = Math.min(
                  100,
                  (month.expense / maxVal) * 100
                );

                return (
                  <div
                    key={month.month}
                    className="space-y-2"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="w-16 text-xs font-semibold text-gray-700">
                        {month.month}
                      </span>

                      <div className="flex gap-4 text-xs">
                        <span className="text-emerald-600">
                          +{formatCurrency(month.income)}
                        </span>

                        <span className="text-rose-600">
                          -{formatCurrency(month.expense)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${incomePercent}%`,
                          }}
                        />
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-rose-500 transition-all duration-500"
                          style={{
                            width: `${expensePercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-gray-500">
                No monthly transactions recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Top Expenses
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Highest spending categories
              </p>
            </div>

            <Link
              href="/dashboard/finance/income-expenses"
              className="text-xs text-blue-600 hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {data?.topExpenseCategories &&
            data.topExpenseCategories.length > 0 ? (
              data.topExpenseCategories.map(
                (category, index) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/75 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {index + 1}
                      </span>

                      <span className="truncate text-xs font-semibold text-gray-800">
                        {category.category}
                      </span>
                    </div>

                    <span className="ml-2 shrink-0 text-xs font-bold text-rose-600">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="py-8 text-center text-xs text-gray-500">
                No categorized expenses for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Recent Transactions
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Latest income and expense entries
            </p>
          </div>

          <Link
            href="/dashboard/finance/income-expenses"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3.5 font-semibold uppercase tracking-wider">
                  Txn Number
                </th>

                <th className="px-6 py-3.5 font-semibold uppercase tracking-wider">
                  Date
                </th>

                <th className="px-6 py-3.5 font-semibold uppercase tracking-wider">
                  Type
                </th>

                <th className="px-6 py-3.5 font-semibold uppercase tracking-wider">
                  Method
                </th>

                <th className="px-6 py-3.5 font-semibold uppercase tracking-wider">
                  Category
                </th>

                <th className="px-6 py-3.5 font-semibold uppercase tracking-wider">
                  Description
                </th>

                <th className="px-6 py-3.5 text-right font-semibold uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {data?.recentTransactions &&
              data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((transaction) => {
                  const isIncome =
                    transaction.type === "INCOME";

                  return (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-gray-50/75"
                    >
                      <td className="px-6 py-3 font-semibold text-gray-900">
                        {transaction.transactionNumber}
                      </td>

                      <td className="px-6 py-3 text-gray-600">
                        {transaction.transactionDate}
                      </td>

                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            isIncome
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isIncome ? "+" : "-"}{" "}
                          {transaction.type}
                        </span>
                      </td>

                      <td className="px-6 py-3">
                        <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                          {transaction.paymentMethod}
                        </span>
                      </td>

                      <td className="px-6 py-3 font-medium text-gray-800">
                        {transaction.category}
                      </td>

                      <td className="max-w-xs truncate px-6 py-3 text-gray-600">
                        {transaction.description}
                      </td>

                      <td
                        className={`px-6 py-3 text-right font-bold ${
                          isIncome
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"}{" "}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No transactions recorded yet.
                    <br />
                    <span className="mt-1 inline-block text-xs">
                      Start by recording an Income or Expense.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
