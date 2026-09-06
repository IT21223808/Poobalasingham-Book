"use client";

import {
  TrendingUp,
  CalendarDays,
  BarChart3,
  Percent,
} from "lucide-react";

interface ProfitSummaryProps {
  todayProfit: number;
  monthlyProfit: number;
  grossProfit: number;
  profitMargin: number;
}

export default function ProfitSummary({
  todayProfit,
  monthlyProfit,
  grossProfit,
  profitMargin,
}: ProfitSummaryProps) {
  const formatCurrency = (
    value: number,
  ) => {
    return `Rs. ${Number(
      value || 0,
    ).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Profit Summary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Business profitability overview
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
        {/* Today Profit */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <CalendarDays size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Today Profit
            </span>
          </div>

          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(todayProfit)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Today's gross profit
          </p>
        </div>

        {/* Monthly Profit */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <CalendarDays size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Monthly Profit
            </span>
          </div>

          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(monthlyProfit)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Current month's profit
          </p>
        </div>

        {/* Gross Profit */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <BarChart3 size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Gross Profit
            </span>
          </div>

          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(grossProfit)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Total completed sales
          </p>
        </div>

        {/* Profit Margin */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <Percent size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Profit Margin
            </span>
          </div>

          <p className="text-2xl font-bold text-amber-600">
            {profitMargin.toFixed(2)}%
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Monthly profit margin
          </p>
        </div>
      </div>
    </div>
  );
}