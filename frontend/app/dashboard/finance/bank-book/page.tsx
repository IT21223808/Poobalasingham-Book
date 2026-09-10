"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Search,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import {
  BankBookEntry,
  financeService,
} from "@/services/finance.service";

export default function BankBookPage() {
  const [entries, setEntries] = useState<BankBookEntry[]>([]);

  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalBankIn: 0,
    totalBankOut: 0,
    closingBalance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Logged-in user's branch
  const [branchName, setBranchName] = useState("Loading...");
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);

  /**
   * Load logged-in user's branch.
   *
   * This is only for UI display.
   * Backend JWT remains the source of truth for branch filtering.
   */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      let user: any = null;

      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch {
          user = null;
        }
      }

      const locationName =
        user?.location?.name ||
        localStorage.getItem("userLocationName") ||
        "";

      if (locationName.trim()) {
        setBranchName(locationName.trim());
      } else {
        setBranchName("No Branch Assigned");
      }
    } catch (err) {
      console.error("Failed to load user branch:", err);
      setBranchName("No Branch Assigned");
    } finally {
      setIsLoadingBranch(false);
    }
  }, []);

  /**
   * Fetch Bank Book.
   *
   * IMPORTANT:
   * Do NOT send locationId from frontend.
   *
   * Backend should get branch from:
   * req.user.locationId
   *
   * This prevents a cashier from changing the branch manually.
   */
  const fetchBankBook = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await financeService.getBankBook({
        search: search.trim(),
        period:
          period !== "custom"
            ? period
            : undefined,
        startDate:
          period === "custom"
            ? startDate || undefined
            : undefined,
        endDate:
          period === "custom"
            ? endDate || undefined
            : undefined,
      });

      setEntries(res.data.entries || []);

      setSummary({
        openingBalance: Number(
          res.data.openingBalance || 0
        ),
        totalBankIn: Number(
          res.data.totalBankIn || 0
        ),
        totalBankOut: Number(
          res.data.totalBankOut || 0
        ),
        closingBalance: Number(
          res.data.closingBalance || 0
        ),
      });
    } catch (err: any) {
      console.error(
        "Error loading bank book:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load Bank Book data."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reload when period changes.
   */
  useEffect(() => {
    fetchBankBook();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return `Rs. ${(Number(amount) || 0).toLocaleString(
      "en-LK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Bank Book Ledger
            </h2>

            {/* Logged-in Branch */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5">
              <Building2 className="h-4 w-4 text-blue-600" />

              <span className="text-xs font-semibold text-blue-700">
                {isLoadingBranch
                  ? "Loading..."
                  : branchName}
              </span>
            </div>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Track all bank transfers, deposits, and
            cheques with running balance
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {[
              {
                label: "Today",
                value: "today",
              },
              {
                label: "This Week",
                value: "week",
              },
              {
                label: "This Month",
                value: "month",
              },
              {
                label: "This Year",
                value: "year",
              },
              {
                label: "All Time",
                value: "",
              },
              {
                label: "Custom",
                value: "custom",
              },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() =>
                  setPeriod(p.value)
                }
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

          {/* Refresh */}
          <button
            onClick={fetchBankBook}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Custom Date Filter */}
      {period === "custom" && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchBankBook}
            disabled={!startDate || !endDate || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Opening Balance */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Opening Balance
          </span>

          <h3 className="mt-2 text-lg font-bold text-gray-800">
            {formatCurrency(
              summary.openingBalance
            )}
          </h3>
        </div>

        {/* Bank In */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Bank In
            </span>

            <span className="rounded bg-emerald-50 p-1 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold text-emerald-600">
            {formatCurrency(
              summary.totalBankIn
            )}
          </h3>
        </div>

        {/* Bank Out */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Bank Out
            </span>

            <span className="rounded bg-rose-50 p-1 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold text-rose-600">
            {formatCurrency(
              summary.totalBankOut
            )}
          </h3>
        </div>

        {/* Closing Balance */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Closing Bank Balance
            </span>

            <span className="rounded bg-indigo-50 p-1 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold text-indigo-700">
            {formatCurrency(
              summary.closingBalance
            )}
          </h3>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

          <input
            type="text"
            placeholder="Search bank transactions by number, cheque ref, description, category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchBankBook();
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={fetchBankBook}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          Search
        </button>
      </div>

      {/* Bank Book Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3.5">
                  Date
                </th>

                <th className="px-5 py-3.5">
                  Txn No
                </th>

                <th className="px-5 py-3.5">
                  Category
                </th>

                <th className="px-5 py-3.5">
                  Description
                </th>

                <th className="px-5 py-3.5">
                  Cheque / Ref
                </th>

                <th className="px-5 py-3.5 text-right text-emerald-700">
                  Bank In (+)
                </th>

                <th className="px-5 py-3.5 text-right text-rose-700">
                  Bank Out (-)
                </th>

                <th className="px-5 py-3.5 text-right text-indigo-700">
                  Balance
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Loading bank transactions...
                  </td>
                </tr>
              ) : entries.length > 0 ? (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="transition hover:bg-gray-50/75"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {entry.date}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 font-semibold text-gray-900">
                      {entry.transactionNumber}
                    </td>

                    <td className="px-5 py-3 font-medium text-gray-800">
                      {entry.category}
                    </td>

                    <td className="max-w-sm truncate px-5 py-3 text-gray-600">
                      {entry.description}
                    </td>

                    <td className="px-5 py-3 text-gray-500">
                      {entry.reference || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-emerald-600">
                      {entry.bankIn > 0
                        ? formatCurrency(
                            entry.bankIn
                          )
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-rose-600">
                      {entry.bankOut > 0
                        ? formatCurrency(
                            entry.bankOut
                          )
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-indigo-800">
                      {formatCurrency(
                        entry.balance
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No bank transactions found for
                    the selected period.
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