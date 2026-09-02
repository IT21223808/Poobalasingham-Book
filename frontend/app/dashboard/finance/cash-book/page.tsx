"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import { CashBookEntry, financeService } from "@/services/finance.service";

export default function CashBookPage() {
  const [entries, setEntries] = useState<CashBookEntry[]>([]);
  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    closingBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchCashBook = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getCashBook({
        search,
        period: period !== "custom" ? period : undefined,
        startDate: period === "custom" ? startDate : undefined,
        endDate: period === "custom" ? endDate : undefined,
      });

      setEntries(res.data.entries || []);
      setSummary({
        openingBalance: res.data.openingBalance || 0,
        totalCashIn: res.data.totalCashIn || 0,
        totalCashOut: res.data.totalCashOut || 0,
        closingBalance: res.data.closingBalance || 0,
      });
    } catch (err: any) {
      console.error("Error loading cash book:", err);
      setError(err?.response?.data?.message || "Failed to load Cash Book data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashBook();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return `Rs. ${(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* Header and Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cash Book Ledger</h2>
          <p className="text-xs text-gray-500">Track all Cash In and Cash Out movements with running balance</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm border border-gray-200">
            {[
              { label: "Today", value: "today" },
              { label: "This Week", value: "week" },
              { label: "This Month", value: "month" },
              { label: "This Year", value: "year" },
              { label: "All Time", value: "" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  period === p.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchCashBook}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Opening Balance</span>
          <h3 className="mt-2 text-lg font-bold text-gray-800">{formatCurrency(summary.openingBalance)}</h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Cash In</span>
            <span className="rounded bg-emerald-50 p-1 text-emerald-600"><TrendingUp className="h-4 w-4" /></span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-emerald-600">{formatCurrency(summary.totalCashIn)}</h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Cash Out</span>
            <span className="rounded bg-rose-50 p-1 text-rose-600"><TrendingDown className="h-4 w-4" /></span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-rose-600">{formatCurrency(summary.totalCashOut)}</h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Closing Cash Balance</span>
            <span className="rounded bg-blue-50 p-1 text-blue-600"><Wallet className="h-4 w-4" /></span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-blue-700">{formatCurrency(summary.closingBalance)}</h3>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by transaction no, description, reference, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCashBook()}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchCashBook}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Cash Book Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Txn No</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5 text-right text-emerald-700">Cash In (+)</th>
                <th className="px-5 py-3.5 text-right text-rose-700">Cash Out (-)</th>
                <th className="px-5 py-3.5 text-right text-blue-700">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {entries && entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/75 transition">
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{entry.date}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {entry.transactionNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{entry.category}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-sm truncate">{entry.description}</td>
                    <td className="px-5 py-3 text-gray-500">{entry.reference || "—"}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {entry.cashIn > 0 ? formatCurrency(entry.cashIn) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                      {entry.cashOut > 0 ? formatCurrency(entry.cashOut) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-blue-800 whitespace-nowrap">
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No cash transactions found for the selected period.
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
