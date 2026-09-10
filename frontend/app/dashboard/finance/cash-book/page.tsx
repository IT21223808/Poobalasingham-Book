"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Search,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import {
  CashBookEntry,
  financeService,
} from "@/services/finance.service";

export default function CashBookPage() {

  // DATA
  const [entries, setEntries] = useState<CashBookEntry[]>([]);

  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    closingBalance: 0,
  });

  // ==================================================
  // USER / BRANCH
  // ==================================================

  const [branchName, setBranchName] =
    useState("Loading...");

  const [isLoadingBranch, setIsLoadingBranch] =
    useState(true);

  // ==================================================
  // UI STATE
  // ==================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [period, setPeriod] =
    useState("month");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // ==================================================
  // LOAD LOGGED-IN USER BRANCH
  // ==================================================

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("user");

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
        localStorage.getItem(
          "userLocationName",
        ) ||
        "";

      if (locationName.trim()) {
        setBranchName(locationName.trim());
      } else {
        setBranchName("No Branch Assigned");
      }
    } catch (err) {
      console.error(
        "Failed to load user branch:",
        err,
      );

      setBranchName("No Branch Assigned");
    } finally {
      setIsLoadingBranch(false);
    }
  }, []);

  // ==================================================
  // FETCH CASH BOOK
  // ==================================================

  const fetchCashBook = async () => {
    try {
      setLoading(true);
      setError(null);

      /*
       * IMPORTANT:
       *
       * We intentionally DO NOT send locationId here.
       *
       * Backend must get the authenticated user's
       * locationId from JWT:
       *
       * Main Cashier
       *   -> Main Branch data
       *
       * Jaffna Cashier
       *   -> Jaffna Branch data
       *
       * This prevents a user from changing branch
       * through frontend/localStorage.
       */

      const res =
        await financeService.getCashBook({
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

      const data = res?.data;

      setEntries(
        Array.isArray(data?.entries)
          ? data.entries
          : [],
      );

      setSummary({
        openingBalance:
          Number(data?.openingBalance) || 0,

        totalCashIn:
          Number(data?.totalCashIn) || 0,

        totalCashOut:
          Number(data?.totalCashOut) || 0,

        closingBalance:
          Number(data?.closingBalance) || 0,
      });
    } catch (err: any) {
      console.error(
        "Error loading cash book:",
        err,
      );

      const rawMessage =
        err?.response?.data?.message;

      const message = Array.isArray(
        rawMessage,
      )
        ? rawMessage.join(", ")
        : typeof rawMessage === "string"
          ? rawMessage
          : "Failed to load Cash Book data.";

      setError(message);

      setEntries([]);

      setSummary({
        openingBalance: 0,
        totalCashIn: 0,
        totalCashOut: 0,
        closingBalance: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD WHEN PERIOD CHANGES
  // ==================================================

  useEffect(() => {
    fetchCashBook();
  }, [period]);

  // ==================================================
  // CURRENCY FORMAT
  // ==================================================

  const formatCurrency = (
    amount: number,
  ) => {
    return `Rs. ${(Number(amount) || 0).toLocaleString(
      "en-LK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  };

  // ==================================================
  // PERIODS
  // ==================================================

  const periods = [
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
  ];

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">

      <FinanceNav />

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">

            <h2 className="text-xl font-bold text-gray-900">
              Cash Book Ledger
            </h2>

            {/* BRANCH BADGE */}

            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
              <Building2 className="h-3.5 w-3.5" />

              {isLoadingBranch
                ? "Loading..."
                : branchName}
            </span>

          </div>

          <p className="mt-1 text-xs text-gray-500">
            Track all Cash In and Cash Out
            movements with running balance
          </p>
        </div>

        {/* ==================================================
            CONTROLS
        ================================================== */}

        <div className="flex flex-wrap items-center gap-3">

          {/* PERIOD */}

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">

            {periods.map((p) => (
              <button
                key={p.value || "all-time"}
                type="button"
                onClick={() =>
                  setPeriod(p.value)
                }
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  period === p.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {p.label}
              </button>
            ))}

          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={fetchCashBook}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

        </div>
      </div>

      {/* ==================================================
          CUSTOM DATE FILTER
      ================================================== */}

      {period === "custom" && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(
                  e.target.value,
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(
                  e.target.value,
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchCashBook}
            disabled={
              loading ||
              !startDate ||
              !endDate
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>

        </div>
      )}

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">

          <AlertCircle className="h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Unable to load Cash Book
            </p>

            <p className="mt-0.5 text-xs">
              {error}
            </p>
          </div>

        </div>
      )}

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* OPENING */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Opening Balance
          </span>

          <h3 className="mt-2 text-lg font-bold text-gray-800">
            {formatCurrency(
              summary.openingBalance,
            )}
          </h3>

        </div>

        {/* CASH IN */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Cash In
            </span>

            <span className="rounded bg-emerald-50 p-1 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>

          </div>

          <h3 className="mt-2 text-lg font-bold text-emerald-600">
            {formatCurrency(
              summary.totalCashIn,
            )}
          </h3>

        </div>

        {/* CASH OUT */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Cash Out
            </span>

            <span className="rounded bg-rose-50 p-1 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>

          </div>

          <h3 className="mt-2 text-lg font-bold text-rose-600">
            {formatCurrency(
              summary.totalCashOut,
            )}
          </h3>

        </div>

        {/* CLOSING */}

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

          <div className="flex items-center justify-between">

            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Closing Cash Balance
            </span>

            <span className="rounded bg-blue-50 p-1 text-blue-600">
              <Wallet className="h-4 w-4" />
            </span>

          </div>

          <h3 className="mt-2 text-lg font-bold text-blue-700">
            {formatCurrency(
              summary.closingBalance,
            )}
          </h3>

        </div>

      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="mb-4 flex flex-wrap items-center gap-3">

        <div className="relative min-w-[240px] flex-1">

          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

          <input
            type="text"
            placeholder="Search by transaction no, description, reference, category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchCashBook();
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />

        </div>

        <button
          type="button"
          onClick={fetchCashBook}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>

      </div>

      {/* ==================================================
          CASH BOOK TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs">

            <thead className="border-b border-gray-200 bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">

              <tr>

                <th className="whitespace-nowrap px-5 py-3.5">
                  Date
                </th>

                <th className="whitespace-nowrap px-5 py-3.5">
                  Txn No
                </th>

                <th className="whitespace-nowrap px-5 py-3.5">
                  Category
                </th>

                <th className="px-5 py-3.5">
                  Description
                </th>

                <th className="whitespace-nowrap px-5 py-3.5">
                  Reference
                </th>

                <th className="whitespace-nowrap px-5 py-3.5 text-right text-emerald-700">
                  Cash In (+)
                </th>

                <th className="whitespace-nowrap px-5 py-3.5 text-right text-rose-700">
                  Cash Out (-)
                </th>

                <th className="whitespace-nowrap px-5 py-3.5 text-right text-blue-700">
                  Balance
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">

              {/* ==================================================
                  LOADING
              ================================================== */}

              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">

                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />

                      <span className="text-xs font-medium text-gray-500">
                        Loading Cash Book...
                      </span>

                    </div>
                  </td>
                </tr>
              ) : entries.length > 0 ? (

                /* ==================================================
                   DATA
                ================================================== */

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

                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                      {entry.reference || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-emerald-600">
                      {entry.cashIn > 0
                        ? formatCurrency(
                            entry.cashIn,
                          )
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-rose-600">
                      {entry.cashOut > 0
                        ? formatCurrency(
                            entry.cashOut,
                          )
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-blue-800">
                      {formatCurrency(
                        entry.balance,
                      )}
                    </td>

                  </tr>

                ))

              ) : (

                /* ==================================================
                   EMPTY
                ================================================== */

                <tr>

                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <Wallet className="mb-3 h-8 w-8 text-gray-300" />

                      <p className="text-sm font-semibold text-gray-500">
                        No cash transactions found
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        No cash transactions were found
                        for the selected period.
                      </p>

                    </div>

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