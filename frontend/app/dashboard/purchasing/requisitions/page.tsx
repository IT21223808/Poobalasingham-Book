"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

type RequisitionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

interface RequisitionItem {
  id: number;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    productCode?: string;
    productName?: string;
  };
}

interface PurchaseRequisition {
  id: number;
  requisitionNumber: string;
  requestedBy?: string;
  requestedDate?: string;
  status: string;
  notes?: string;
  items: RequisitionItem[];
  createdAt: string;
}

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const REQUISITIONS_ENDPOINT =
  `${API_URL}/purchasing/requisitions`;

/* =========================================================
   PAGE
========================================================= */

export default function PurchaseRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<
    PurchaseRequisition[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadRequisitions = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;

        const response = await fetch(
          REQUISITIONS_ENDPOINT,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => null);

          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message ||
                  `Failed to load requisitions (${response.status})`
          );
        }

        const data = await response.json();

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setRequisitions(result);
      } catch (err) {
        console.error(
          "Purchase requisitions error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load purchase requisitions"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadRequisitions();
  }, [loadRequisitions]);

  /* =======================================================
     FILTER DATA
  ======================================================= */

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((item) => {
      const searchText =
        `${item.requisitionNumber} ${
          item.requestedBy || ""
        } ${item.notes || ""} ${
          item.items
            ?.map(
              (product) =>
                product.product?.productName || ""
            )
            .join(" ") || ""
        }`.toLowerCase();

      const matchesSearch =
        !search ||
        searchText.includes(search.toLowerCase());

      const normalizedStatus =
        item.status?.toUpperCase();

      const matchesStatus =
        status === "ALL" ||
        normalizedStatus === status;

      const itemDate = item.requestedDate
        ? new Date(item.requestedDate)
        : new Date(item.createdAt);

      const itemDateString =
        itemDate.toISOString().split("T")[0];

      const matchesFromDate =
        !fromDate ||
        itemDateString >= fromDate;

      const matchesToDate =
        !toDate ||
        itemDateString <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    requisitions,
    search,
    status,
    fromDate,
    toDate,
  ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequisitions.length /
        itemsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedRequisitions =
    filteredRequisitions.slice(
      (safeCurrentPage - 1) * itemsPerPage,
      safeCurrentPage * itemsPerPage
    );

  /* =======================================================
     RESET PAGE WHEN FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    status,
    fromDate,
    toDate,
  ]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const totalCount = requisitions.length;

  const pendingCount = requisitions.filter(
    (item) =>
      item.status?.toUpperCase() ===
      "PENDING"
  ).length;

  const approvedCount = requisitions.filter(
    (item) =>
      item.status?.toUpperCase() ===
      "APPROVED"
  ).length;

  const rejectedCount = requisitions.filter(
    (item) =>
      item.status?.toUpperCase() ===
      "REJECTED"
  ).length;

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (
    requisition: PurchaseRequisition
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${requisition.requisitionNumber}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${REQUISITIONS_ENDPOINT}/${requisition.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            "Failed to delete requisition"
        );
      }

      await loadRequisitions(true);
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete requisition"
      );
    }
  };

  /* =======================================================
     APPROVE
  ======================================================= */

  const handleApprove = async (
    requisition: PurchaseRequisition
  ) => {
    const confirmed = window.confirm(
      `Approve ${requisition.requisitionNumber}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${REQUISITIONS_ENDPOINT}/${requisition.id}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            "Failed to approve requisition"
        );
      }

      await loadRequisitions(true);
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to approve requisition"
      );
    }
  };

  /* =======================================================
     REJECT
  ======================================================= */

  const handleReject = async (
    requisition: PurchaseRequisition
  ) => {
    const confirmed = window.confirm(
      `Reject ${requisition.requisitionNumber}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${REQUISITIONS_ENDPOINT}/${requisition.id}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            "Failed to reject requisition"
        );
      }

      await loadRequisitions(true);
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to reject requisition"
      );
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading purchase requisitions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <XCircle
            size={40}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 font-semibold text-gray-900">
            Failed to load requisitions
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            onClick={() =>
              loadRequisitions()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
            HEADER + BREADCRUMB
        ================================================= */}

        <div className="space-y-4">

          {/* BREADCRUMB */}

          <div className="flex items-center gap-2 text-sm">

            <Link
              href="/dashboard/purchasing"
              className="font-medium text-gray-500 transition hover:text-blue-600"
            >
              Purchasing
            </Link>

            <ChevronRight
              size={15}
              className="text-gray-400"
            />

            <span className="font-medium text-gray-900">
              Purchase Requisitions
            </span>

          </div>

          {/* PAGE HEADER */}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <ClipboardList
                    size={22}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Purchase Requisitions
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage purchase requests and approval status.
                  </p>
                </div>

              </div>
            </div>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={() =>
                  loadRequisitions(true)
                }
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <Link
                href="/dashboard/purchasing/requisitions/create"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={17} />

                Create Requisition
              </Link>

            </div>

          </div>

        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Requisitions"
            value={totalCount}
            icon={ClipboardList}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Pending"
            value={pendingCount}
            icon={Clock3}
            iconClass="bg-yellow-50 text-yellow-600"
          />

          <SummaryCard
            title="Approved"
            value={approvedCount}
            icon={CheckCircle2}
            iconClass="bg-green-50 text-green-600"
          />

          <SummaryCard
            title="Rejected"
            value={rejectedCount}
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

            {/* Search */}

            <div className="lg:col-span-2">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search
              </label>

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search requisition number, product..."
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* Status */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>

            </div>

            {/* From Date */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                From Date
              </label>

              <div className="relative">

                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* To Date */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                To Date
              </label>

              <div className="relative">

                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(e.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-500">

              Showing{" "}

              <span className="font-medium text-gray-900">
                {filteredRequisitions.length}
              </span>{" "}

              result
              {filteredRequisitions.length !== 1
                ? "s"
                : ""}

            </p>

            <button
              onClick={clearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear Filters
            </button>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="border-b border-gray-100 px-6 py-4">

            <h2 className="font-semibold text-gray-900">
              Requisitions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Purchase requests submitted for approval.
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] text-left text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Requisition No.
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Date
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Requested By
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Products
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Qty
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {paginatedRequisitions.length === 0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="px-6 py-14 text-center"
                    >

                      <ClipboardList
                        size={40}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium text-gray-700">
                        No requisitions found
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Try changing your filters or create a new requisition.
                      </p>

                      <Link
                        href="/dashboard/purchasing/requisitions/create"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Plus size={16} />
                        Create Requisition
                      </Link>

                    </td>

                  </tr>

                ) : (

                  paginatedRequisitions.map(
                    (requisition) => {

                      const totalQuantity =
                        requisition.items?.reduce(
                          (total, item) =>
                            total +
                            Number(
                              item.quantity || 0
                            ),
                          0
                        ) || 0;

                      const productNames =
                        requisition.items
                          ?.map(
                            (item) =>
                              item.product
                                ?.productName
                          )
                          .filter(Boolean)
                          .join(", ") ||
                        "—";

                      const normalizedStatus =
                        requisition.status?.toUpperCase();

                      return (
                        <tr
                          key={requisition.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* Number */}

                          <td className="px-6 py-4">

                            <Link
                              href={`/dashboard/purchasing/requisitions/${requisition.id}`}
                              className="font-medium text-blue-600 hover:text-blue-700"
                            >
                              {requisition.requisitionNumber}
                            </Link>

                          </td>

                          {/* Date */}

                          <td className="px-6 py-4 text-gray-600">

                            {formatDate(
                              requisition.requestedDate ||
                                requisition.createdAt
                            )}

                          </td>

                          {/* Requested By */}

                          <td className="px-6 py-4 text-gray-700">

                            {requisition.requestedBy ||
                              "—"}

                          </td>

                          {/* Products */}

                          <td
                            className="max-w-[300px] truncate px-6 py-4 text-gray-600"
                            title={productNames}
                          >
                            {productNames}
                          </td>

                          {/* Quantity */}

                          <td className="px-6 py-4 font-medium text-gray-900">

                            {totalQuantity}

                          </td>

                          {/* Status */}

                          <td className="px-6 py-4">

                            <StatusBadge
                              status={
                                normalizedStatus
                              }
                            />

                          </td>

                          {/* Actions */}

                          <td className="px-6 py-4">

                            <div className="flex items-center justify-end gap-1">

                              {/* View */}

                              <Link
                                href={`/dashboard/purchasing/requisitions/${requisition.id}`}
                                title="View"
                                className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye size={17} />
                              </Link>

                              {/* Edit */}

                              {normalizedStatus ===
                                "PENDING" && (
                                <Link
                                  href={`/dashboard/purchasing/requisitions/${requisition.id}/edit`}
                                  title="Edit"
                                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                >
                                  <Pencil
                                    size={17}
                                  />
                                </Link>
                              )}

                              {/* Approve */}

                              {normalizedStatus ===
                                "PENDING" && (
                                <button
                                  onClick={() =>
                                    handleApprove(
                                      requisition
                                    )
                                  }
                                  title="Approve"
                                  className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                                >
                                  <Check size={17} />
                                </button>
                              )}

                              {/* Reject */}

                              {normalizedStatus ===
                                "PENDING" && (
                                <button
                                  onClick={() =>
                                    handleReject(
                                      requisition
                                    )
                                  }
                                  title="Reject"
                                  className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <X size={17} />
                                </button>
                              )}

                              {/* Delete */}

                              {normalizedStatus ===
                                "PENDING" && (
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      requisition
                                    )
                                  }
                                  title="Delete"
                                  className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2
                                    size={17}
                                  />
                                </button>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredRequisitions.length > 0 && (

            <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-gray-500">

                Page{" "}

                <span className="font-medium text-gray-900">
                  {safeCurrentPage}
                </span>{" "}

                of{" "}

                <span className="font-medium text-gray-900">
                  {totalPages}
                </span>

              </p>

              <div className="flex items-center gap-2">

                <button
                  disabled={
                    safeCurrentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(1, page - 1)
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  disabled={
                    safeCurrentPage === totalPages
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
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>

              </div>

            </div>

          )}

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>

        </div>

        <div
          className={`rounded-lg p-2.5 ${iconClass}`}
        >
          <Icon size={20} />
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    PENDING:
      "bg-yellow-50 text-yellow-700 border-yellow-200",

    APPROVED:
      "bg-green-50 text-green-700 border-green-200",

    REJECTED:
      "bg-red-50 text-red-700 border-red-200",

    CANCELLED:
      "bg-gray-100 text-gray-600 border-gray-200",
  };

  const labels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "border-gray-200 bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}