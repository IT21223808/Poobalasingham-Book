"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Clock3,
  CheckCircle2,
  PackageCheck,
  CalendarDays,
  XCircle,
  Trash2,
  FileText,
  Truck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  product?: Product;
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  requisitionId?: number | null;
  supplierId?: number | string | null;
  supplier?: Supplier | null;
  status: string;
  totalAmount: string | number;
  items: PurchaseOrderItem[];
  createdAt: string;
  orderDate?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const ORDERS_API = `${API_URL}/purchasing/orders`;

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  /* =========================================================
     LOAD ORDERS
  ========================================================= */

  const loadOrders = useCallback(async (isRefresh = false) => {
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

      const response = await fetch(ORDERS_API, {
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
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                `Failed to load purchase orders (${response.status})`
        );
      }

      const data = await response.json();

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setOrders(result);
    } catch (err) {
      console.error("Load purchase orders error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchase orders"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const normalizedStatus =
        order.status?.toUpperCase();

      const matchesSearch =
        !search ||
        order.poNumber
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const supplierName =
        order.supplier?.supplierName || "";

      const matchesSupplier =
        !supplierSearch ||
        supplierName
          .toLowerCase()
          .includes(supplierSearch.toLowerCase());

      const matchesStatus =
        status === "ALL" ||
        normalizedStatus === status;

      const dateValue =
        order.orderDate || order.createdAt;

      const parsedDate = new Date(dateValue);

      const orderDate = Number.isNaN(
        parsedDate.getTime()
      )
        ? ""
        : parsedDate.toISOString().split("T")[0];

      const matchesFromDate =
        !fromDate || orderDate >= fromDate;

      const matchesToDate =
        !toDate || orderDate <= toDate;

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    orders,
    search,
    supplierSearch,
    status,
    fromDate,
    toDate,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length / itemsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedOrders =
    filteredOrders.slice(
      (safeCurrentPage - 1) * itemsPerPage,
      safeCurrentPage * itemsPerPage
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    supplierSearch,
    status,
    fromDate,
    toDate,
  ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalOrders = orders.length;

  const draftOrders = orders.filter(
    (order) =>
      order.status?.toUpperCase() === "DRAFT"
  ).length;

  const pendingOrders = orders.filter(
    (order) =>
      order.status?.toUpperCase() === "PENDING"
  ).length;

  const approvedOrders = orders.filter(
    (order) =>
      order.status?.toUpperCase() === "APPROVED"
  ).length;

  const partiallyReceivedOrders = orders.filter(
    (order) =>
      order.status?.toUpperCase() ===
      "PARTIALLY_RECEIVED"
  ).length;

  const receivedOrders = orders.filter(
    (order) =>
      ["RECEIVED", "COMPLETED"].includes(
        order.status?.toUpperCase()
      )
  ).length;

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setSupplierSearch("");
    setStatus("ALL");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  /* =========================================================
     APPROVE
  ========================================================= */

  const handleApprove = async (
    order: PurchaseOrder
  ) => {
    if (
      !window.confirm(
        `Approve purchase order ${order.poNumber}?`
      )
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem("accessToken");

      const response = await fetch(
        `${ORDERS_API}/${order.id}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Failed to approve purchase order"
        );
      }

      await loadOrders(true);
    } catch (err) {
      console.error(
        "Approve purchase order error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to approve purchase order"
      );
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (
    order: PurchaseOrder
  ) => {
    const normalizedStatus =
      order.status?.toUpperCase();

    if (
      !["DRAFT", "PENDING"].includes(
        normalizedStatus
      )
    ) {
      alert(
        "Only draft or pending purchase orders can be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${order.poNumber}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError(null);

      const token =
        localStorage.getItem("accessToken");

      const response = await fetch(
        `${ORDERS_API}/${order.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Failed to delete purchase order"
        );
      }

      setOrders((previous) =>
        previous.filter(
          (item) => item.id !== order.id
        )
      );

      alert(
        `${order.poNumber} deleted successfully.`
      );
    } catch (err) {
      console.error(
        "Delete purchase order error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete purchase order"
      );
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading purchase orders...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <XCircle
            size={40}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 font-semibold text-gray-900">
            Failed to load purchase orders
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            onClick={() => loadOrders()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
            BREADCRUMB + HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            {/* Breadcrumb - no back arrow */}
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
                Purchase Orders
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <ShoppingCart
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Purchase Orders
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage supplier purchase orders.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => loadOrders(true)}
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

            <Link
              href="/dashboard/purchasing/orders/create"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Create Purchase Order
            </Link>

          </div>
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <SummaryCard
            title="Total POs"
            value={totalOrders}
            icon={ShoppingCart}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Draft"
            value={draftOrders}
            icon={FileText}
            iconClass="bg-gray-100 text-gray-600"
          />

          <SummaryCard
            title="Pending"
            value={pendingOrders}
            icon={Clock3}
            iconClass="bg-yellow-50 text-yellow-600"
          />

          <SummaryCard
            title="Approved"
            value={approvedOrders}
            icon={CheckCircle2}
            iconClass="bg-green-50 text-green-600"
          />

          <SummaryCard
            title="Received"
            value={
              receivedOrders +
              partiallyReceivedOrders
            }
            icon={PackageCheck}
            iconClass="bg-purple-50 text-purple-600"
          />

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">

            {/* SEARCH */}

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search PO Number
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
                  placeholder="Search PO number..."
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* SUPPLIER */}

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

            {/* STATUS */}

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

                <option value="DRAFT">
                  Draft
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="PARTIALLY_RECEIVED">
                  Partially Received
                </option>

                <option value="RECEIVED">
                  Received
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>

                <option value="REJECTED">
                  Rejected
                </option>
              </select>
            </div>

            {/* FROM DATE */}

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

            {/* TO DATE */}

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
                {filteredOrders.length}
              </span>{" "}
              result
              {filteredOrders.length !== 1
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
            PURCHASE ORDER TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-gray-900">
                Purchase Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View and manage supplier purchase orders.
              </p>
            </div>

            <Link
              href="/dashboard/purchasing/orders/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Create PO
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px] text-left text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    PO Number
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Supplier
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Requisition
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Items
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Total Amount
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Date
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {paginatedOrders.length === 0 ? (

                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-14 text-center"
                    >
                      <ShoppingCart
                        size={40}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium text-gray-700">
                        No purchase orders found
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Try changing your filters or create a new purchase order.
                      </p>
                    </td>
                  </tr>

                ) : (

                  paginatedOrders.map((order) => {

                    const itemCount =
                      order.items?.length || 0;

                    const totalQuantity =
                      order.items?.reduce(
                        (total, item) =>
                          total +
                          Number(
                            item.quantity || 0
                          ),
                        0
                      ) || 0;

                    const normalizedStatus =
                      order.status?.toUpperCase();

                    const canEdit =
                      ["DRAFT", "PENDING"].includes(
                        normalizedStatus
                      );

                    const canDelete =
                      ["DRAFT", "PENDING"].includes(
                        normalizedStatus
                      );

                    const canApprove =
                      normalizedStatus ===
                      "PENDING";

                    const canReceive =
                      [
                        "APPROVED",
                        "PARTIALLY_RECEIVED",
                      ].includes(
                        normalizedStatus
                      );

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* PO NUMBER */}

                        <td className="px-6 py-4">

                          <Link
                            href={`/dashboard/purchasing/orders/${order.id}`}
                            className="font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {order.poNumber}
                          </Link>

                          <p className="mt-1 text-xs text-gray-400">
                            ID #{order.id}
                          </p>

                        </td>

                        {/* SUPPLIER */}

                        <td className="px-6 py-4">

                          <p className="font-medium text-gray-900">
                            {order.supplier
                              ?.supplierName ||
                              "—"}
                          </p>

                          {order.supplier
                            ?.supplierCode && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {
                                order.supplier
                                  .supplierCode
                              }
                            </p>
                          )}

                        </td>

                        {/* REQUISITION */}

                        <td className="px-6 py-4">

                          {order.requisitionId ? (
                            <Link
                              href={`/dashboard/purchasing/requisitions/${order.requisitionId}`}
                              className="text-blue-600 hover:underline"
                            >
                              REQ-
                              {String(
                                order.requisitionId
                              ).padStart(5, "0")}
                            </Link>
                          ) : (
                            <span className="text-gray-400">
                              —
                            </span>
                          )}

                        </td>

                        {/* ITEMS */}

                        <td className="px-6 py-4">

                          <p className="font-medium text-gray-900">
                            {itemCount}{" "}
                            {itemCount === 1
                              ? "item"
                              : "items"}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            {totalQuantity} total qty
                          </p>

                        </td>

                        {/* TOTAL */}

                        <td className="px-6 py-4">

                          <p className="font-semibold text-gray-900">
                            Rs.{" "}
                            {Number(
                              order.totalAmount || 0
                            ).toLocaleString(
                              "en-LK",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">

                          <StatusBadge
                            status={
                              normalizedStatus
                            }
                          />

                        </td>

                        {/* DATE */}

                        <td className="px-6 py-4 text-gray-500">

                          {formatDate(
                            order.orderDate ||
                              order.createdAt
                          )}

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">

                          <div className="flex items-center justify-end gap-1">

                            {/* VIEW */}

                            <Link
                              href={`/dashboard/purchasing/orders/${order.id}`}
                              title="View Purchase Order"
                              className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye size={17} />
                            </Link>

                            {/* EDIT */}

                            {canEdit && (
                              <Link
                                href={`/dashboard/purchasing/orders/${order.id}/edit`}
                                title="Edit Purchase Order"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <Pencil size={17} />
                              </Link>
                            )}

                            {/* APPROVE */}

                            {canApprove && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(
                                    order
                                  )
                                }
                                title="Approve Purchase Order"
                                className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                              >
                                <Check size={17} />
                              </button>
                            )}

                            {/* RECEIVE GOODS */}

                            {canReceive && (
                              <Link
                                href={`/dashboard/purchasing/grn/create?purchaseOrderId=${order.id}`}
                                title="Receive Goods"
                                className="rounded-lg p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-600"
                              >
                                <PackageCheck
                                  size={17}
                                />
                              </Link>
                            )}

                            {/* DELETE */}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    order
                                  )
                                }
                                title="Delete Purchase Order"
                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={17} />
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          {filteredOrders.length > 0 && (
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
                  type="button"
                  disabled={
                    safeCurrentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    safeCurrentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage((page) =>
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
    DRAFT:
      "bg-gray-50 text-gray-700 border-gray-200",

    PENDING:
      "bg-yellow-50 text-yellow-700 border-yellow-200",

    APPROVED:
      "bg-blue-50 text-blue-700 border-blue-200",

    PARTIALLY_RECEIVED:
      "bg-orange-50 text-orange-700 border-orange-200",

    RECEIVED:
      "bg-green-50 text-green-700 border-green-200",

    COMPLETED:
      "bg-green-50 text-green-700 border-green-200",

    CANCELLED:
      "bg-red-50 text-red-700 border-red-200",

    REJECTED:
      "bg-red-50 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING: "Pending",
    APPROVED: "Approved",
    PARTIALLY_RECEIVED: "Partially Received",
    RECEIVED: "Received",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "border-gray-200 bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] || status || "Unknown"}
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