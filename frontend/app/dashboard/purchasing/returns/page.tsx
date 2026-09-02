"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  RotateCcw,
  Clock3,
  CheckCircle2,
  XCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import {
  purchasingService,
  PurchaseReturn,
} from "@/services/purchasing.service";

const PAGE_SIZE = 10;

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD RETURNS
  // =========================================================

  const loadReturns = useCallback(async () => {
    try {
      setError("");

      const data = await purchasingService.getReturns();

      setReturns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load purchase returns:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load purchase returns";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReturns();
  };

  // =========================================================
  // STATUS COUNTS
  // =========================================================

  const stats = useMemo(() => {
    const total = returns.length;

    const pending = returns.filter(
      (item) => item.status === "PENDING"
    ).length;

    const completed = returns.filter(
      (item) => item.status === "COMPLETED"
    ).length;

    const cancelled = returns.filter(
      (item) => item.status === "CANCELLED"
    ).length;

    return {
      total,
      pending,
      completed,
      cancelled,
    };
  }, [returns]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return returns.filter((item) => {
      const matchesSearch =
        !query ||
        item.returnNumber?.toLowerCase().includes(query) ||
        String(item.purchaseOrderId)
          .toLowerCase()
          .includes(query) ||
        String(item.invoiceId ?? "")
          .toLowerCase()
          .includes(query) ||
        item.reason?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [returns, search, statusFilter]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReturns.length / PAGE_SIZE)
  );

  const paginatedReturns = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return filteredReturns.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredReturns, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
            <Clock3 className="h-3.5 w-3.5" />
            Pending
          </span>
        );

      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </span>
        );

      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {status || "Unknown"}
          </span>
        );
    }
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading purchase returns...
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-6 p-6">

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="flex items-center gap-2 text-sm text-gray-500">

        <Link
          href="/dashboard/purchasing"
          className="transition-colors hover:text-orange-600"
        >
          Purchasing
        </Link>

        <ChevronRight className="h-4 w-4 text-gray-400" />

        <span className="font-medium text-gray-900">
          Purchase Returns
        </span>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-2.5">
              <RotateCcw className="h-6 w-6 text-orange-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Purchase Returns
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage returned products from purchase orders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <Link
            href="/dashboard/purchasing/returns/create"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            Create Return
          </Link>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">
              Failed to load purchase returns
            </p>

            <p className="mt-1 break-words">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={loadReturns}
            className="text-sm font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* TOTAL */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Returns
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>

            <div className="rounded-lg bg-orange-100 p-3">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* PENDING */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pending
              </p>

              <p className="mt-2 text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-100 p-3">
              <Clock3 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* COMPLETED */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
            </div>

            <div className="rounded-lg bg-green-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* CANCELLED */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Cancelled
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {stats.cancelled}
              </p>
            </div>

            <div className="rounded-lg bg-red-100 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search return number, PO, invoice or reason..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Return Number
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Purchase Order
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Invoice
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Items
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reason
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Created
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedReturns.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="rounded-full bg-gray-100 p-4">
                        <RotateCcw className="h-8 w-8 text-gray-400" />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-gray-900">
                        No purchase returns found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {search ||
                        statusFilter !== "ALL"
                          ? "Try changing your search or filter."
                          : "Create your first purchase return."}
                      </p>

                      {!search &&
                        statusFilter === "ALL" && (
                          <Link
                            href="/dashboard/purchasing/returns/create"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                          >
                            <Plus className="h-4 w-4" />
                            Create Return
                          </Link>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50"
                  >
                    {/* RETURN NUMBER */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/dashboard/purchasing/returns/${item.id}`}
                        className="font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {item.returnNumber}
                      </Link>
                    </td>

                    {/* PO */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      PO-
                      {String(
                        item.purchaseOrderId
                      ).padStart(5, "0")}
                    </td>

                    {/* INVOICE */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {item.invoiceId
                        ? `INV-${String(
                            item.invoiceId
                          ).padStart(5, "0")}`
                        : "-"}
                    </td>

                    {/* ITEMS */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        <Package className="h-3.5 w-3.5" />

                        {item.items?.length ?? 0}{" "}

                        {item.items?.length === 1
                          ? "item"
                          : "items"}
                      </span>
                    </td>

                    {/* REASON */}

                    <td className="max-w-[220px] px-6 py-4 text-sm text-gray-600">
                      <span
                        className="block truncate"
                        title={item.reason || ""}
                      >
                        {item.reason || "-"}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(
                        item.status
                      )}
                    </td>

                    {/* DATE */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(
                        item.createdAt
                      )}
                    </td>

                    {/* ACTIONS */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center justify-end gap-2">

                        {/* VIEW */}

                        <Link
                          href={`/dashboard/purchasing/returns/${item.id}`}
                          title="View return"
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {/* EDIT */}

                        {item.status !== "CANCELLED" &&
                          item.status !== "COMPLETED" && (
                            <Link
                              href={`/dashboard/purchasing/returns/${item.id}/edit`}
                              title="Edit return"
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-orange-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {filteredReturns.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {(currentPage - 1) *
                  PAGE_SIZE +
                  1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-700">
                {Math.min(
                  currentPage *
                    PAGE_SIZE,
                  filteredReturns.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {filteredReturns.length}
              </span>{" "}
              returns
            </p>

            <div className="flex items-center gap-2">

              {/* PREVIOUS */}

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {/* PAGE NUMBERS */}

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .filter((page) => {
                    if (totalPages <= 5) {
                      return true;
                    }

                    if (page === 1) {
                      return true;
                    }

                    if (
                      page === totalPages
                    ) {
                      return true;
                    }

                    return (
                      Math.abs(
                        page -
                          currentPage
                      ) <= 1
                    );
                  })
                  .map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium ${
                        currentPage === page
                          ? "bg-orange-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              {/* NEXT */}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
