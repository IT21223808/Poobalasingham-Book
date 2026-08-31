"use client";

import Link from "next/link";
import {
  ClipboardList,
  ShoppingCart,
  PackageCheck,
  Receipt,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

interface DashboardData {
  summary: {
    totalRequisitions: number;
    pendingRequisitions: number;

    totalPurchaseOrders: number;
    pendingPurchaseOrders: number;
    approvedPurchaseOrders: number;
    receivedPurchaseOrders: number;
    cancelledPurchaseOrders: number;

    totalGoodsReceived: number;
    pendingGoodsReceived: number;
    partialGoodsReceived: number;
    cancelledGoodsReceived: number;

    totalPurchaseInvoices: number;
    draftPurchaseInvoices: number;
    unpaidPurchaseInvoices: number;
    partiallyPaidPurchaseInvoices: number;
    paidPurchaseInvoices: number;
    cancelledPurchaseInvoices: number;

    totalPurchaseReturns: number;
    pendingPurchaseReturns: number;
    completedPurchaseReturns: number;
    cancelledPurchaseReturns: number;
  };

  overview: {
    totalPurchaseAmount: number;
    orders: number;
    received: number;
    pending: number;
    approved: number;
    cancelled: number;
  };

  status: {
    pending: number;
    approved: number;
    received: number;
    cancelled: number;
  };

  recentOrders: PurchaseOrder[];
  recentGRNs: GRN[];
  recentInvoices: PurchaseInvoice[];
  recentReturns: PurchaseReturn[];
}

interface Product {
  id: string;
  productCode?: string;
  productName?: string;
  name?: string;
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
  requisitionId: number;
  status: string;
  totalAmount: string | number;
  items: PurchaseOrderItem[];
  createdAt: string;
}

interface GRNItem {
  id: number;
  grnId: number;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  product?: Product;
}

interface GRN {
  id: number;
  grnNumber: string;
  purchaseOrderId: number;
  status: string;
  items: GRNItem[];
  createdAt: string;
}

interface PurchaseInvoiceItem {
  id: number;
  invoiceId: number;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  product?: Product;
}

interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  purchaseOrderId: number;
  supplierId?: number | null;
  grnId?: number | null;
  invoiceDate?: string;
  dueDate?: string | null;
  paymentStatus: string;
  subtotal?: number | string;
  discount?: number | string;
  tax?: number | string;
  grandTotal?: number | string;
  items: PurchaseInvoiceItem[];
  createdAt: string;
}

interface PurchaseReturnItem {
  id: number;
  returnId: number;
  productId: string;
  quantity: number;
  product?: Product;
}

interface PurchaseReturn {
  id: number;
  returnNumber: string;
  purchaseOrderId: number;
  invoiceId: number | null;
  status: string;
  reason: string | null;
  items: PurchaseReturnItem[];
  createdAt: string;
}

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   MAIN PURCHASING DASHBOARD
========================================================= */

export default function PurchasingDashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(
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
          `${API_URL}/purchasing/dashboard`,
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
          const data =
            await response.json().catch(
              () => null
            );

          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message ||
                  `Failed to load purchasing dashboard (${response.status})`
          );
        }

        const data: DashboardData =
          await response.json();

        setDashboard(data);
      } catch (err) {
        console.error(
          "Purchasing dashboard error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load purchasing dashboard"
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
    loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 px-4 py-6 sm:px-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading purchasing dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !dashboard) {
    return (
      <div className="min-h-full bg-gray-50 px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="font-medium text-red-600">
            Failed to load purchasing dashboard
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "No dashboard data available"}
          </p>

          <button
            onClick={() =>
              loadDashboard()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MODULE CARDS
  ========================================================= */

  const moduleCards = [
    {
      title: "Requisitions",
      description:
        "Create and manage purchase requests",
      href: "/dashboard/purchasing/requisitions",
      icon: ClipboardList,
      count:
        dashboard.summary.totalRequisitions,
      countLabel: "Total",
      pending:
        dashboard.summary.pendingRequisitions,
      pendingLabel: "Pending",
    },

    {
      title: "Purchase Orders",
      description:
        "Manage supplier purchase orders",
      href: "/dashboard/purchasing/orders",
      icon: ShoppingCart,
      count:
        dashboard.summary.totalPurchaseOrders,
      countLabel: "Total",
      pending:
        dashboard.summary.pendingPurchaseOrders,
      pendingLabel: "Pending",
    },

    {
      title: "Goods Received",
      description:
        "Receive and verify supplier goods",
      href: "/dashboard/purchasing/grn",
      icon: PackageCheck,
      count:
        dashboard.summary.totalGoodsReceived,
      countLabel: "Received",
      pending:
        dashboard.summary.partialGoodsReceived,
      pendingLabel: "Partial",
    },

    {
      title: "Purchase Invoices",
      description:
        "Manage supplier invoices and payments",
      href: "/dashboard/purchasing/invoices",
      icon: Receipt,
      count:
        dashboard.summary.totalPurchaseInvoices,
      countLabel: "Total",
      pending:
        dashboard.summary.unpaidPurchaseInvoices,
      pendingLabel: "Unpaid",
    },

    {
      title: "Purchase Returns",
      description:
        "Return goods to suppliers",
      href: "/dashboard/purchasing/returns",
      icon: RotateCcw,
      count:
        dashboard.summary.totalPurchaseReturns,
      countLabel: "Total",
      pending:
        dashboard.summary.pendingPurchaseReturns,
      pendingLabel: "Pending",
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-full bg-gray-50 px-4 py-6 sm:px-6">
      <div className="w-full space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Purchasing
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage requisitions, purchase orders,
              goods received, invoices and returns.
            </p>
          </div>

          <button
            onClick={() =>
              loadDashboard(true)
            }
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* =================================================
            MODULE CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

          {moduleCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex min-h-[175px] flex-col rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm"
              >

                {/* CARD HEADER */}

                <div className="flex items-center justify-between gap-2">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <Icon size={18} />
                    </div>

                    <h2 className="truncate text-sm font-semibold text-gray-900">
                      {card.title}
                    </h2>

                  </div>

                  <ArrowRight
                    size={15}
                    className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                  />

                </div>

                {/* DESCRIPTION */}

                <p className="mt-3 min-h-[32px] text-xs leading-4 text-gray-500">
                  {card.description}
                </p>

                {/* COUNTS */}

                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">

                  <div>
                    <p className="text-xl font-semibold leading-none text-gray-900">
                      {card.count}
                    </p>

                    <p className="mt-1 text-[11px] text-gray-400">
                      {card.countLabel}
                    </p>
                  </div>

                  <div className="border-l border-gray-100 pl-3">
                    <p className="text-xl font-semibold leading-none text-gray-900">
                      {card.pending}
                    </p>

                    <p className="mt-1 text-[11px] text-gray-400">
                      {card.pendingLabel}
                    </p>
                  </div>

                </div>

              </Link>
            );
          })}

        </div>

        {/* =================================================
            QUICK STATUS SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* PURCHASE OVERVIEW */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">

            <div className="flex items-start justify-between">

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Purchase Overview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Current purchasing activity
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <TrendingUp
                  size={19}
                  className="text-green-600"
                />
              </div>

            </div>

            {/* TOTAL PURCHASE */}

            <div className="mt-5">

              <p className="text-sm text-gray-500">
                Total Purchase Amount
              </p>

              <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                Rs.{" "}
                {Number(
                  dashboard.overview
                    .totalPurchaseAmount
                ).toLocaleString(
                  "en-LK",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>

            </div>

            {/* OVERVIEW */}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">

              <OverviewItem
                label="Orders"
                value={
                  dashboard.overview.orders
                }
              />

              <OverviewItem
                label="Pending"
                value={
                  dashboard.overview.pending
                }
              />

              <OverviewItem
                label="Approved"
                value={
                  dashboard.overview.approved
                }
              />

              <OverviewItem
                label="Received"
                value={
                  dashboard.overview.received
                }
              />

              <OverviewItem
                label="Cancelled"
                value={
                  dashboard.overview.cancelled
                }
              />

            </div>

          </div>

          {/* PURCHASE ORDER STATUS */}

          <div className="rounded-xl border border-gray-200 bg-white p-5">

            <h2 className="text-base font-semibold text-gray-900">
              Purchase Order Status
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current purchase order status
            </p>

            <div className="mt-5 space-y-5">

              <StatusProgress
                label="Pending"
                value={
                  dashboard.status.pending
                }
                total={
                  dashboard.overview.orders
                }
              />

              <StatusProgress
                label="Approved"
                value={
                  dashboard.status.approved
                }
                total={
                  dashboard.overview.orders
                }
              />

              <StatusProgress
                label="Received"
                value={
                  dashboard.status.received
                }
                total={
                  dashboard.overview.orders
                }
              />

              <StatusProgress
                label="Cancelled"
                value={
                  dashboard.status.cancelled
                }
                total={
                  dashboard.overview.orders
                }
              />

            </div>

          </div>

        </div>

        {/* =================================================
            INVOICE + RETURN STATUS
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* PURCHASE INVOICE STATUS */}

          <div className="rounded-xl border border-gray-200 bg-white p-5">

            <div className="flex items-start justify-between">

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Purchase Invoice Status
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Current supplier invoice payment status
                </p>
              </div>

              <Receipt
                size={20}
                className="text-blue-600"
              />

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

              <SummaryBox
                label="Total"
                value={
                  dashboard.summary
                    .totalPurchaseInvoices
                }
              />

              <SummaryBox
                label="Draft"
                value={
                  dashboard.summary
                    .draftPurchaseInvoices
                }
              />

              <SummaryBox
                label="Unpaid"
                value={
                  dashboard.summary
                    .unpaidPurchaseInvoices
                }
              />

              <SummaryBox
                label="Partially Paid"
                value={
                  dashboard.summary
                    .partiallyPaidPurchaseInvoices
                }
              />

              <SummaryBox
                label="Paid"
                value={
                  dashboard.summary
                    .paidPurchaseInvoices
                }
              />

              <SummaryBox
                label="Cancelled"
                value={
                  dashboard.summary
                    .cancelledPurchaseInvoices
                }
              />

            </div>

          </div>

          {/* PURCHASE RETURN STATUS */}

          <div className="rounded-xl border border-gray-200 bg-white p-5">

            <div className="flex items-start justify-between">

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Purchase Return Status
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Current supplier return status
                </p>
              </div>

              <RotateCcw
                size={20}
                className="text-orange-600"
              />

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

              <SummaryBox
                label="Total"
                value={
                  dashboard.summary
                    .totalPurchaseReturns
                }
              />

              <SummaryBox
                label="Pending"
                value={
                  dashboard.summary
                    .pendingPurchaseReturns
                }
              />

              <SummaryBox
                label="Completed"
                value={
                  dashboard.summary
                    .completedPurchaseReturns
                }
              />

              <SummaryBox
                label="Cancelled"
                value={
                  dashboard.summary
                    .cancelledPurchaseReturns
                }
              />

            </div>

          </div>

        </div>

        {/* =================================================
            RECENT PURCHASE ORDERS
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Recent Purchase Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest supplier purchase orders
              </p>
            </div>

            <Link
              href="/dashboard/purchasing/orders"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              View All
              <ArrowRight size={15} />
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    PO Number
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Amount
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Status
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {dashboard.recentOrders.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  dashboard.recentOrders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">

                          <Link
                            href={`/dashboard/purchasing/orders/${order.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {order.poNumber}
                          </Link>

                        </td>

                        <td className="max-w-[280px] truncate px-5 py-4 text-gray-600">

                          {order.items
                            ?.map(
                              (item) =>
                                item.product
                                  ?.productName ||
                                item.product
                                  ?.name
                            )
                            .filter(Boolean)
                            .join(", ") ||
                            "—"}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">

                          Rs.{" "}
                          {Number(
                            order.totalAmount
                          ).toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={formatStatus(
                              order.status
                            )}
                          />

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">

                          {formatDate(
                            order.createdAt
                          )}

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            RECENT GRNs + RETURNS
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* RECENT GRNs */}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Goods Received
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Recently received goods
                </p>
              </div>

              <Link
                href="/dashboard/purchasing/grn"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View All
                <ArrowRight size={15} />
              </Link>

            </div>

            <div className="divide-y divide-gray-100">

              {dashboard.recentGRNs.length ===
              0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  No GRNs found.
                </div>
              ) : (
                dashboard.recentGRNs.map(
                  (grn) => (
                    <Link
                      key={grn.id}
                      href={`/dashboard/purchasing/grn/${grn.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
                    >

                      <div className="min-w-0">

                        <p className="font-medium text-gray-900">
                          {grn.grnNumber}
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-500">

                          PO-
                          {String(
                            grn.purchaseOrderId
                          ).padStart(5, "0")}

                          {" · "}

                          {grn.items
                            ?.map(
                              (item) =>
                                item.product
                                  ?.productName ||
                                item.product?.name
                            )
                            .filter(Boolean)
                            .join(", ") ||
                            "No product"}

                        </p>

                      </div>

                      <StatusBadge
                        status={formatStatus(
                          grn.status
                        )}
                      />

                    </Link>
                  )
                )
              )}

            </div>

          </div>

          {/* RECENT RETURNS */}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Purchase Returns
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest supplier returns
                </p>
              </div>

              <Link
                href="/dashboard/purchasing/returns"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View All
                <ArrowRight size={15} />
              </Link>

            </div>

            <div className="divide-y divide-gray-100">

              {dashboard.recentReturns.length ===
              0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  No purchase returns found.
                </div>
              ) : (
                dashboard.recentReturns.map(
                  (item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/purchasing/returns/${item.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
                    >

                      <div className="min-w-0">

                        <p className="font-medium text-gray-900">
                          {item.returnNumber}
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-500">

                          {item.reason ||
                            "Purchase return"}

                          {" · "}

                          {formatDate(
                            item.createdAt
                          )}

                        </p>

                      </div>

                      <div className="shrink-0 text-right">

                        <p className="font-medium text-gray-900">
                          {item.items?.reduce(
                            (
                              total,
                              returnItem
                            ) =>
                              total +
                              Number(
                                returnItem.quantity ||
                                  0
                              ),
                            0
                          ) || 0}{" "}
                          items
                        </p>

                        <div className="mt-1">

                          <StatusBadge
                            status={formatStatus(
                              item.status
                            )}
                          />

                        </div>

                      </div>

                    </Link>
                  )
                )
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            RECENT INVOICES
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Recent Purchase Invoices
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest supplier invoices
              </p>
            </div>

            <Link
              href="/dashboard/purchasing/invoices"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All
              <ArrowRight size={15} />
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px] text-left text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Invoice Number
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    PO
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Amount
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Payment Status
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {dashboard.recentInvoices.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No purchase invoices found.
                    </td>
                  </tr>
                ) : (
                  dashboard.recentInvoices.map(
                    (invoice) => (
                      <tr
                        key={invoice.id}
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">

                          <Link
                            href={`/dashboard/purchasing/invoices/${invoice.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {invoice.invoiceNumber}
                          </Link>

                        </td>

                        <td className="px-5 py-4 text-gray-600">

                          PO-
                          {String(
                            invoice.purchaseOrderId
                          ).padStart(5, "0")}

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">

                          Rs.{" "}
                          {Number(
                            invoice.grandTotal ?? 0
                          ).toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={formatStatus(
                              invoice.paymentStatus
                            )}
                          />

                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">

                          {formatDate(
                            invoice.createdAt
                          )}

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   OVERVIEW ITEM
========================================================= */

function OverviewItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3.5">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   SUMMARY BOX
========================================================= */

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3.5">

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-gray-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   STATUS PROGRESS
========================================================= */

function StatusProgress({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (value / total) * 100
          )
        )
      : 0;

  return (
    <div>

      <div className="mb-2 flex items-center justify-between text-sm">

        <span className="text-gray-600">
          {label}
        </span>

        <span className="font-medium text-gray-900">
          {value}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">

        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <p className="mt-1 text-right text-xs text-gray-400">
        {percentage}%
      </p>

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
  const styles: Record<
    string,
    string
  > = {
    Pending:
      "bg-yellow-50 text-yellow-700",

    Approved:
      "bg-blue-50 text-blue-700",

    Received:
      "bg-green-50 text-green-700",

    Completed:
      "bg-green-50 text-green-700",

    Cancelled:
      "bg-red-50 text-red-700",

    Rejected:
      "bg-red-50 text-red-700",

    Draft:
      "bg-gray-50 text-gray-700",

    Unpaid:
      "bg-yellow-50 text-yellow-700",

    "Partially Paid":
      "bg-orange-50 text-orange-700",

    Paid:
      "bg-green-50 text-green-700",

    Partially_received:
      "bg-orange-50 text-orange-700",

    "Partially received":
      "bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
  status: string
) {
  if (!status) {
    return "Unknown";
  }

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  date: string
) {
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