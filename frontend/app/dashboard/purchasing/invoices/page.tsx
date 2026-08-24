"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Clock3,
  CheckCircle2,
  FileText,
  CalendarDays,
  CreditCard,
  Loader2,
} from "lucide-react";
import {useCallback,useEffect,useMemo,useState,} from "react";

// =========================================================
// TYPES
// =========================================================

interface Supplier {
  id: number | string;
  supplierCode?: string;
  supplierName: string;
}

interface Product {
  id: string;
  productCode?: string;
  productName: string;
}

interface PurchaseInvoiceItem {
  id: number;
  purchaseInvoiceId: number;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  discount?: string | number;
  tax?: string | number;
  subtotal: string | number;
  product?: Product;
}

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;

  supplierId?: number | string | null;

  supplier?: Supplier | null;

  purchaseOrderId?: number | null;

  purchaseOrder?: {
    id: number;
    poNumber: string;
  } | null;

  grnId?: number | null;

  grn?: {
    id: number;
    grnNumber: string;
  } | null;

  invoiceDate: string;

  dueDate?: string | null;

  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  grandTotal: string | number;

  paymentStatus: string;

  items: PurchaseInvoiceItem[];

  createdAt: string;
  updatedAt?: string;
}

// =========================================================
// API
// =========================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const INVOICES_API =
  `${API_URL}/purchasing/invoices`;

// =========================================================
// MAIN PAGE
// =========================================================

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] =
    useState<PurchaseInvoice[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // =======================================================
  // FILTERS
  // =======================================================

  const [search, setSearch] =
    useState("");

  const [supplierSearch, setSupplierSearch] =
    useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("ALL");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  // =======================================================
  // PAGINATION
  // =======================================================

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 10;

  // =======================================================
  // TOKEN
  // =======================================================

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("accessToken");
  };

  // =========================================================
  // LOAD INVOICES
  // =========================================================

  const loadInvoices = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const token = getToken();

        const response = await fetch(
          INVOICES_API,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },
            cache: "no-store",
          }
        );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message ||
                  `Failed to load purchase invoices (${response.status})`
          );
        }

        const result =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];

        setInvoices(result);
      } catch (err) {
        console.error(
          "Load purchase invoices error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load purchase invoices"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const normalizedStatus =
        invoice.paymentStatus?.toUpperCase();

      // -----------------------------------------------------
      // Invoice search
      // -----------------------------------------------------

      const matchesSearch =
        !search ||
        invoice.invoiceNumber
          ?.toLowerCase()
          .includes(search.toLowerCase());

      // -----------------------------------------------------
      // Supplier search
      // -----------------------------------------------------

      const supplierName =
        invoice.supplier?.supplierName || "";

      const matchesSupplier =
        !supplierSearch ||
        supplierName
          .toLowerCase()
          .includes(
            supplierSearch.toLowerCase()
          );

      // -----------------------------------------------------
      // Payment status
      // -----------------------------------------------------

      const matchesStatus =
        paymentStatus === "ALL" ||
        normalizedStatus ===
          paymentStatus;

      // -----------------------------------------------------
      // Date
      // -----------------------------------------------------

      const invoiceDateValue =
        invoice.invoiceDate ||
        invoice.createdAt;

      const parsedDate =
        new Date(invoiceDateValue);

      const invoiceDate =
        Number.isNaN(
          parsedDate.getTime()
        )
          ? ""
          : parsedDate
              .toISOString()
              .split("T")[0];

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesStatus &&
        (!fromDate ||
          invoiceDate >= fromDate) &&
        (!toDate ||
          invoiceDate <= toDate)
      );
    });
  }, [
    invoices,
    search,
    supplierSearch,
    paymentStatus,
    fromDate,
    toDate,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredInvoices.length /
        itemsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedInvoices =
    filteredInvoices.slice(
      (safeCurrentPage - 1) *
        itemsPerPage,
      safeCurrentPage *
        itemsPerPage
    );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    supplierSearch,
    paymentStatus,
    fromDate,
    toDate,
  ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalInvoices =
    invoices.length;

  const draftInvoices =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus?.toUpperCase() ===
        "DRAFT"
    ).length;

  const unpaidInvoices =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus?.toUpperCase() ===
        "UNPAID"
    ).length;

  const partiallyPaidInvoices =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus?.toUpperCase() ===
        "PARTIALLY_PAID"
    ).length;

  const paidInvoices =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus?.toUpperCase() ===
        "PAID"
    ).length;

  const outstandingAmount =
    invoices
      .filter((invoice) =>
        [
          "UNPAID",
          "PARTIALLY_PAID",
        ].includes(
          invoice.paymentStatus?.toUpperCase()
        )
      )
      .reduce(
        (total, invoice) =>
          total +
          Number(
            invoice.grandTotal || 0
          ),
        0
      );

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setSupplierSearch("");
    setPaymentStatus("ALL");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  // =========================================================
  // CANCEL INVOICE
  // =========================================================

  const handleCancel = async (
    invoice: PurchaseInvoice
  ) => {
    const normalizedStatus =
      invoice.paymentStatus?.toUpperCase();

    if (
      normalizedStatus ===
      "CANCELLED"
    ) {
      alert(
        "This invoice is already cancelled."
      );
      return;
    }

    if (
      normalizedStatus === "PAID"
    ) {
      alert(
        "Paid invoices cannot be cancelled."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to cancel ${invoice.invoiceNumber}?\n\nThe invoice will be marked as CANCELLED.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      const response =
        await fetch(
          `${INVOICES_API}/${invoice.id}/cancel`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Failed to cancel purchase invoice"
        );
      }

      await loadInvoices(true);
    } catch (err) {
      console.error(
        "Cancel invoice error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to cancel purchase invoice"
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <Loader2
              size={38}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading purchase invoices...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <XCircle
            size={40}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 font-semibold text-gray-900">
            Failed to load purchase invoices
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadInvoices()
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

  // =========================================================
  // MAIN RENDER
  // =========================================================

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Breadcrumb */}

            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard/purchasing"
                className="text-gray-500 hover:text-blue-600"
              >
                Purchasing
              </Link>

              <span className="text-gray-300">
                /
              </span>

              <span className="font-medium text-gray-900">
                Purchase Invoices
              </span>
            </div>

            {/* Title */}

            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <Receipt
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Purchase Invoices
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage supplier purchase invoices and payments.
                </p>
              </div>
            </div>
          </div>

          {/* Header buttons */}

          <div className="flex flex-wrap gap-3">
            {/* Refresh */}

            <button
              type="button"
              onClick={() =>
                loadInvoices(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
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

            {/* Create */}

            <Link
              href="/dashboard/purchasing/invoices/create"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={17} />

              Create Purchase Invoice
            </Link>
          </div>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Total Invoices"
            value={totalInvoices}
            icon={Receipt}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Draft"
            value={draftInvoices}
            icon={FileText}
            iconClass="bg-gray-100 text-gray-600"
          />

          <SummaryCard
            title="Unpaid"
            value={unpaidInvoices}
            icon={Clock3}
            iconClass="bg-yellow-50 text-yellow-600"
          />

          <SummaryCard
            title="Partially Paid"
            value={partiallyPaidInvoices}
            icon={CreditCard}
            iconClass="bg-orange-50 text-orange-600"
          />

          <SummaryCard
            title="Paid"
            value={paidInvoices}
            icon={CheckCircle2}
            iconClass="bg-green-50 text-green-600"
          />
        </div>

        {/* =================================================
            OUTSTANDING AMOUNT
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Outstanding Amount
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900">
                Rs.{" "}
                {outstandingAmount.toLocaleString(
                  "en-LK",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-2.5">
              <CreditCard
                size={20}
                className="text-yellow-600"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">

            {/* Invoice Search */}

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search Invoice Number
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
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search invoice number..."
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Supplier */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Supplier
              </label>

              <input
                type="text"
                value={supplierSearch}
                onChange={(e) =>
                  setSupplierSearch(
                    e.target.value
                  )
                }
                placeholder="Supplier name..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Payment Status */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Payment Status
              </label>

              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(
                    e.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="DRAFT">
                  Draft
                </option>

                <option value="UNPAID">
                  Unpaid
                </option>

                <option value="PARTIALLY_PAID">
                  Partially Paid
                </option>

                <option value="PAID">
                  Paid
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
                    setFromDate(
                      e.target.value
                    )
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
                    setToDate(
                      e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Filter footer */}

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {filteredInvoices.length}
              </span>{" "}
              result
              {filteredInvoices.length !==
              1
                ? "s"
                : ""}
            </p>

            <button
              type="button"
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

          {/* Table Header */}

          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              Purchase Invoices
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage supplier invoices.
            </p>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-600">
                    Invoice Number
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Supplier
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    PO Reference
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    GRN Reference
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Items
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Grand Total
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Payment Status
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Invoice Date
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {paginatedInvoices.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-14 text-center"
                    >
                      <Receipt
                        size={40}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium text-gray-700">
                        No purchase invoices found
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Try changing your filters or create a new invoice.
                      </p>

                      {/* Create link */}

                      <Link
                        href="/dashboard/purchasing/invoices/create"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Plus size={16} />

                        Create Invoice
                      </Link>
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map(
                    (invoice) => {

                      const itemCount =
                        invoice.items?.length ||
                        0;

                      const totalQuantity =
                        invoice.items?.reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            Number(
                              item.quantity ||
                                0
                            ),
                          0
                        ) || 0;

                      const status =
                        invoice.paymentStatus?.toUpperCase();

                      const canEdit =
                        [
                          "DRAFT",
                          "UNPAID",
                        ].includes(
                          status
                        );

                      const canCancel =
                        ![
                          "PAID",
                          "CANCELLED",
                        ].includes(
                          status
                        );

                      return (
                        <tr
                          key={invoice.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* Invoice Number */}

                          <td className="px-6 py-4">
                            <Link
                              href={`/dashboard/purchasing/invoices/${invoice.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                              {
                                invoice.invoiceNumber
                              }
                            </Link>

                            <p className="mt-1 text-xs text-gray-400">
                              ID #{invoice.id}
                            </p>
                          </td>

                          {/* Supplier */}

                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">
                              {invoice
                                .supplier
                                ?.supplierName ||
                                "—"}
                            </p>

                            {invoice
                              .supplier
                              ?.supplierCode && (
                              <p className="mt-0.5 text-xs text-gray-400">
                                {
                                  invoice
                                    .supplier
                                    .supplierCode
                                }
                              </p>
                            )}
                          </td>

                          {/* PO */}

                          <td className="px-6 py-4">
                            {invoice
                              .purchaseOrder
                              ?.poNumber ||
                            invoice.purchaseOrderId ? (
                              <span className="font-medium text-blue-600">
                                {invoice
                                  .purchaseOrder
                                  ?.poNumber ||
                                  `PO-${String(
                                    invoice.purchaseOrderId
                                  ).padStart(
                                    5,
                                    "0"
                                  )}`}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* GRN */}

                          <td className="px-6 py-4">
                            {invoice.grn
                              ?.grnNumber ||
                            invoice.grnId ? (
                              <span className="font-medium text-blue-600">
                                {invoice
                                  .grn
                                  ?.grnNumber ||
                                  `GRN-${String(
                                    invoice.grnId
                                  ).padStart(
                                    5,
                                    "0"
                                  )}`}
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                —
                              </span>
                            )}
                          </td>

                          {/* Items */}

                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">
                              {itemCount}{" "}
                              {itemCount ===
                              1
                                ? "item"
                                : "items"}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {totalQuantity}{" "}
                              total qty
                            </p>
                          </td>

                          {/* Grand Total */}

                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">
                              Rs.{" "}
                              {Number(
                                invoice.grandTotal ||
                                  0
                              ).toLocaleString(
                                "en-LK",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </p>
                          </td>

                          {/* Status */}

                          <td className="px-6 py-4">
                            <InvoiceStatusBadge
                              status={status}
                            />
                          </td>

                          {/* Date */}

                          <td className="px-6 py-4 text-gray-500">
                            {formatDate(
                              invoice.invoiceDate ||
                                invoice.createdAt
                            )}
                          </td>

                          {/* Actions */}

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">

                              {/* VIEW */}

                              <Link
                                href={`/dashboard/purchasing/invoices/${invoice.id}`}
                                title="View Invoice"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={17}
                                />
                              </Link>

                              {/* EDIT */}

                              {canEdit && (
                                <Link
                                  href={`/dashboard/purchasing/invoices/${invoice.id}/edit`}
                                  title="Edit Invoice"
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                  <Pencil
                                    size={17}
                                  />
                                </Link>
                              )}

                              {/* CANCEL */}

                              {canCancel && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancel(
                                      invoice
                                    )
                                  }
                                  title="Cancel Invoice"
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <XCircle
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

          {filteredInvoices.length >
            0 && (
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

                {/* Previous */}

                <button
                  type="button"
                  disabled={
                    safeCurrentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={16}
                  />

                  Previous
                </button>

                {/* Next */}

                <button
                  type="button"
                  disabled={
                    safeCurrentPage ===
                    totalPages
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

                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

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

// =========================================================
// STATUS BADGE
// =========================================================

function InvoiceStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    DRAFT:
      "bg-gray-50 text-gray-700 border-gray-200",

    UNPAID:
      "bg-yellow-50 text-yellow-700 border-yellow-200",

    PARTIALLY_PAID:
      "bg-orange-50 text-orange-700 border-orange-200",

    PAID:
      "bg-green-50 text-green-700 border-green-200",

    CANCELLED:
      "bg-red-50 text-red-700 border-red-200",
  };

  const labels: Record<
    string,
    string
  > = {
    DRAFT: "Draft",

    UNPAID: "Unpaid",

    PARTIALLY_PAID:
      "Partially Paid",

    PAID: "Paid",

    CANCELLED:
      "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "border-gray-200 bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] ||
        status ||
        "Unknown"}
    </span>
  );
}

// =========================================================
// DATE FORMAT
// =========================================================

function formatDate(date: string) {
  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
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