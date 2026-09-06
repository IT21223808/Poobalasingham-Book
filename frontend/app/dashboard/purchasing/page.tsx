"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  FileCheck2,
  FileText,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "@/services/api";

/* =========================================================
   TYPES
========================================================= */

interface DashboardData {
  overview: {
    totalRequisitions: number;
    pendingRequisitions: number;
    totalPurchaseOrders: number;
    pendingPurchaseOrders: number;
    totalGRNs: number;
    pendingGRNs: number;
    totalInvoices: number;
    pendingInvoices: number;
    totalReturns: number;
    pendingReturns: number;
  };

  purchaseOverview?: {
    totalPurchases: number;
    totalPurchaseAmount: number;
    totalReceivedAmount: number;
    totalPendingAmount: number;
  };

  poStatus?: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    cancelled: number;
  };

  invoiceStatus?: {
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };

  returnStatus?: {
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };

  recentPurchaseOrders?: PurchaseOrder[];

  recentGRNs?: GRN[];

  recentReturns?: PurchaseReturn[];

  recentInvoices?: PurchaseInvoice[];
}

interface Product {
  id: string | number;
  productName?: string;
  name?: string;
  productCode?: string;
  sku?: string;
}

interface PurchaseOrderItem {
  id: string | number;
  productId?: string | number;
  product?: Product;
  quantity?: number;
  orderedQuantity?: number;
  receivedQuantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface PurchaseOrder {
  id: string | number;
  poNumber?: string;
  purchaseOrderNumber?: string;
  supplierName?: string;
  supplier?: {
    id?: string | number;
    supplierName?: string;
    name?: string;
  };
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  orderDate?: string;
  items?: PurchaseOrderItem[];
}

interface GRNItem {
  id: string | number;
  productId?: string | number;
  product?: Product;
  receivedQuantity?: number;
  quantity?: number;
}

interface GRN {
  id: string | number;
  grnNumber?: string;
  purchaseOrderId?: string | number;
  purchaseOrder?: PurchaseOrder;
  status?: string;
  receivedDate?: string;
  createdAt?: string;
  items?: GRNItem[];
}

interface PurchaseInvoiceItem {
  id: string | number;
  productId?: string | number;
  product?: Product;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface PurchaseInvoice {
  id: string | number;
  invoiceNumber?: string;
  purchaseOrderId?: string | number;
  purchaseOrder?: PurchaseOrder;
  supplierName?: string;
  supplier?: {
    supplierName?: string;
    name?: string;
  };
  status?: string;
  totalAmount?: number;
  invoiceDate?: string;
  dueDate?: string;
  createdAt?: string;
  items?: PurchaseInvoiceItem[];
}

interface PurchaseReturnItem {
  id: string | number;
  productId?: string | number;
  product?: Product;
  quantity?: number;
  returnedQuantity?: number;
}

interface PurchaseReturn {
  id: string | number;
  returnNumber?: string;
  purchaseOrderId?: string | number;
  purchaseOrder?: PurchaseOrder;
  supplierName?: string;
  supplier?: {
    supplierName?: string;
    name?: string;
  };
  status?: string;
  totalAmount?: number;
  returnDate?: string;
  createdAt?: string;
  items?: PurchaseReturnItem[];
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function PurchasingDashboardPage() {
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

      console.log("📊 Loading purchasing dashboard...");
      console.log(
        "🌐 Dashboard URL:",
        "/purchasing/dashboard"
      );

      const response = await api.get<DashboardData>(
        "/purchasing/dashboard"
      );

      console.log(
        "✅ Purchasing dashboard loaded:",
        response.status,
        response.data
      );

      setDashboard(response.data);
    } catch (err: unknown) {
      console.error(
        "❌ Purchasing dashboard FAILED:",
        err
      );

      // Axios error details
      if (
        typeof err === "object" &&
        err !== null
      ) {
        const axiosError = err as {
          response?: {
            status?: number;
            statusText?: string;
            data?: unknown;
            headers?: unknown;
          };
          request?: unknown;
          message?: string;
          code?: string;
          config?: {
            url?: string;
            method?: string;
            baseURL?: string;
          };
        };

        console.error(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );

        console.error(
          "❌ STATUS:",
          axiosError.response?.status
        );

        console.error(
          "❌ STATUS TEXT:",
          axiosError.response?.statusText
        );

        console.error(
          "❌ RESPONSE DATA:",
          axiosError.response?.data
        );

        console.error(
          "❌ ERROR MESSAGE:",
          axiosError.message
        );

        console.error(
          "❌ ERROR CODE:",
          axiosError.code
        );

        console.error(
          "❌ REQUEST URL:",
          axiosError.config?.url
        );

        console.error(
          "❌ BASE URL:",
          axiosError.config?.baseURL
        );

        console.error(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );

        const status =
          axiosError.response?.status;

        const responseData =
          axiosError.response?.data;

        let message =
          "Failed to load purchasing dashboard";

        if (
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData
        ) {
          const backendMessage = (
            responseData as {
              message?: string | string[];
            }
          ).message;

          if (Array.isArray(backendMessage)) {
            message =
              backendMessage.join(", ");
          } else if (
            typeof backendMessage === "string"
          ) {
            message = backendMessage;
          }
        } else if (
          typeof responseData === "string"
        ) {
          message = responseData;
        } else if (
          axiosError.message
        ) {
          message = axiosError.message;
        }

        if (status === 401) {
          message =
            "Unauthorized (401): JWT token missing, invalid or expired.";
        } else if (status === 403) {
          message =
            "Forbidden (403): You do not have permission to access the purchasing dashboard.";
        } else if (status === 404) {
          message =
            "Not Found (404): /purchasing/dashboard endpoint does not exist.";
        } else if (status === 500) {
          message =
            "Server Error (500): Purchasing dashboard backend has an error.";
        }

        setError(message);
      } else {
        setError(
          "Failed to load purchasing dashboard"
        );
      }
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
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />

              <p className="text-sm text-gray-500">
                Loading purchasing dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR STATE
  ======================================================= */

  if (error && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Failed to load purchasing dashboard
              </h2>

              <p className="mb-6 text-sm text-gray-500">
                {error}
              </p>

              <button
                onClick={() => loadDashboard()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     SAFE DATA
  ======================================================= */

  const overview = dashboard?.overview ?? {
    totalRequisitions: 0,
    pendingRequisitions: 0,
    totalPurchaseOrders: 0,
    pendingPurchaseOrders: 0,
    totalGRNs: 0,
    pendingGRNs: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    totalReturns: 0,
    pendingReturns: 0,
  };

  const purchaseOverview =
    dashboard?.purchaseOverview ?? {
      totalPurchases: 0,
      totalPurchaseAmount: 0,
      totalReceivedAmount: 0,
      totalPendingAmount: 0,
    };

  const poStatus =
    dashboard?.poStatus ?? {
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0,
    };

  const invoiceStatus =
    dashboard?.invoiceStatus ?? {
      pending: 0,
      partial: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

  const returnStatus =
    dashboard?.returnStatus ?? {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
    };

  const recentPurchaseOrders =
    dashboard?.recentPurchaseOrders ?? [];

  const recentGRNs =
    dashboard?.recentGRNs ?? [];

  const recentReturns =
    dashboard?.recentReturns ?? [];

  const recentInvoices =
    dashboard?.recentInvoices ?? [];

  /* =======================================================
     FORMATTERS
  ======================================================= */

  const formatCurrency = (
    value?: number
  ) => {
    return new Intl.NumberFormat(
      "en-LK",
      {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
      }
    ).format(value ?? 0);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                Purchasing Dashboard
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Overview of purchasing activities,
              orders, goods received, invoices and
              returns.
            </p>
          </div>

          <button
            onClick={() =>
              loadDashboard(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* =================================================
            ERROR BANNER
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* =================================================
            MODULE CARDS
        ================================================= */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <ModuleCard
            href="/dashboard/purchasing/requisitions"
            icon={
              <ClipboardList className="h-5 w-5" />
            }
            title="Requisitions"
            value={
              overview.totalRequisitions
            }
            pending={
              overview.pendingRequisitions
            }
          />

          <ModuleCard
            href="/dashboard/purchasing/orders"
            icon={
              <ShoppingCart className="h-5 w-5" />
            }
            title="Purchase Orders"
            value={
              overview.totalPurchaseOrders
            }
            pending={
              overview.pendingPurchaseOrders
            }
          />

          <ModuleCard
            href="/dashboard/purchasing/grn"
            icon={
              <PackageCheck className="h-5 w-5" />
            }
            title="GRNs"
            value={overview.totalGRNs}
            pending={overview.pendingGRNs}
          />

          <ModuleCard
            href="/dashboard/purchasing/invoices"
            icon={
              <FileText className="h-5 w-5" />
            }
            title="Invoices"
            value={
              overview.totalInvoices
            }
            pending={
              overview.pendingInvoices
            }
          />

          <ModuleCard
            href="/dashboard/purchasing/returns"
            icon={
              <RotateCcw className="h-5 w-5" />
            }
            title="Returns"
            value={
              overview.totalReturns
            }
            pending={
              overview.pendingReturns
            }
          />
        </div>

        {/* =================================================
            PURCHASE OVERVIEW
        ================================================= */}

        <section className="mb-8">
          <SectionHeader
            icon={
              <BarChart3 className="h-5 w-5" />
            }
            title="Purchase Overview"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            <SummaryBox
              title="Total Purchases"
              value={
                purchaseOverview.totalPurchases
              }
              icon={
                <ShoppingCart className="h-5 w-5" />
              }
            />

            <SummaryBox
              title="Purchase Amount"
              value={formatCurrency(
                purchaseOverview.totalPurchaseAmount
              )}
              icon={
                <BarChart3 className="h-5 w-5" />
              }
            />

            <SummaryBox
              title="Received Amount"
              value={formatCurrency(
                purchaseOverview.totalReceivedAmount
              )}
              icon={
                <PackageCheck className="h-5 w-5" />
              }
            />

            <SummaryBox
              title="Pending Amount"
              value={formatCurrency(
                purchaseOverview.totalPendingAmount
              )}
              icon={
                <Clock3 className="h-5 w-5" />
              }
            />
          </div>
        </section>

        {/* =================================================
            STATUS SECTIONS
        ================================================= */}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* PO STATUS */}

          <StatusProgress
            title="Purchase Order Status"
            icon={
              <ShoppingCart className="h-5 w-5" />
            }
            items={[
              {
                label: "Pending",
                value: poStatus.pending,
                icon: (
                  <Clock3 className="h-4 w-4" />
                ),
              },
              {
                label: "Approved",
                value: poStatus.approved,
                icon: (
                  <CheckCircle2 className="h-4 w-4" />
                ),
              },
              {
                label: "Rejected",
                value: poStatus.rejected,
                icon: (
                  <XCircle className="h-4 w-4" />
                ),
              },
              {
                label: "Completed",
                value: poStatus.completed,
                icon: (
                  <PackageCheck className="h-4 w-4" />
                ),
              },
              {
                label: "Cancelled",
                value: poStatus.cancelled,
                icon: (
                  <XCircle className="h-4 w-4" />
                ),
              },
            ]}
          />

          {/* INVOICE STATUS */}

          <StatusProgress
            title="Invoice Status"
            icon={
              <FileText className="h-5 w-5" />
            }
            items={[
              {
                label: "Pending",
                value: invoiceStatus.pending,
                icon: (
                  <Clock3 className="h-4 w-4" />
                ),
              },
              {
                label: "Partial",
                value: invoiceStatus.partial,
                icon: (
                  <BarChart3 className="h-4 w-4" />
                ),
              },
              {
                label: "Paid",
                value: invoiceStatus.paid,
                icon: (
                  <CheckCircle2 className="h-4 w-4" />
                ),
              },
              {
                label: "Overdue",
                value: invoiceStatus.overdue,
                icon: (
                  <AlertTriangle className="h-4 w-4" />
                ),
              },
              {
                label: "Cancelled",
                value: invoiceStatus.cancelled,
                icon: (
                  <XCircle className="h-4 w-4" />
                ),
              },
            ]}
          />

          {/* RETURN STATUS */}

          <StatusProgress
            title="Return Status"
            icon={
              <RotateCcw className="h-5 w-5" />
            }
            items={[
              {
                label: "Pending",
                value: returnStatus.pending,
                icon: (
                  <Clock3 className="h-4 w-4" />
                ),
              },
              {
                label: "Approved",
                value: returnStatus.approved,
                icon: (
                  <CheckCircle2 className="h-4 w-4" />
                ),
              },
              {
                label: "Completed",
                value: returnStatus.completed,
                icon: (
                  <PackageCheck className="h-4 w-4" />
                ),
              },
              {
                label: "Rejected",
                value: returnStatus.rejected,
                icon: (
                  <XCircle className="h-4 w-4" />
                ),
              },
            ]}
          />
        </div>

        {/* =================================================
            RECENT PURCHASE ORDERS
        ================================================= */}

        <RecentSection
          title="Recent Purchase Orders"
          icon={
            <ShoppingCart className="h-5 w-5" />
          }
          href="/purchasing/orders"
          emptyMessage="No recent purchase orders."
        >
          {recentPurchaseOrders.map(
            (po) => (
              <div
                key={po.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {po.poNumber ??
                        po.purchaseOrderNumber ??
                        `PO-${po.id}`}
                    </p>

                    <p className="text-xs text-gray-500">
                      {po.supplierName ??
                        po.supplier?.supplierName ??
                        po.supplier?.name ??
                        "Unknown Supplier"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        po.totalAmount
                      )}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatDate(
                        po.createdAt ??
                          po.orderDate
                      )}
                    </p>
                  </div>

                  <StatusBadge
                    status={po.status}
                  />
                </div>
              </div>
            )
          )}
        </RecentSection>

        {/* =================================================
            RECENT GRNs
        ================================================= */}

        <RecentSection
          title="Recent GRNs"
          icon={
            <PackageCheck className="h-5 w-5" />
          }
          href="/purchasing/grn"
          emptyMessage="No recent GRNs."
        >
          {recentGRNs.map((grn) => (
            <div
              key={grn.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <PackageCheck className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {grn.grnNumber ??
                      `GRN-${grn.id}`}
                  </p>

                  <p className="text-xs text-gray-500">
                    PO #
                    {grn.purchaseOrder?.poNumber ??
                      grn.purchaseOrder
                        ?.purchaseOrderNumber ??
                      grn.purchaseOrderId ??
                      "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-xs text-gray-500">
                  {formatDate(
                    grn.receivedDate ??
                      grn.createdAt
                  )}
                </p>

                <StatusBadge
                  status={grn.status}
                />
              </div>
            </div>
          ))}
        </RecentSection>

        {/* =================================================
            RECENT RETURNS
        ================================================= */}

        <RecentSection
          title="Recent Purchase Returns"
          icon={
            <RotateCcw className="h-5 w-5" />
          }
          href="/purchasing/returns"
          emptyMessage="No recent purchase returns."
        >
          {recentReturns.map(
            (returnItem) => (
              <div
                key={returnItem.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {returnItem.returnNumber ??
                        `RET-${returnItem.id}`}
                    </p>

                    <p className="text-xs text-gray-500">
                      {returnItem.supplierName ??
                        returnItem.supplier
                          ?.supplierName ??
                        returnItem.supplier?.name ??
                        "Unknown Supplier"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        returnItem.totalAmount
                      )}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatDate(
                        returnItem.returnDate ??
                          returnItem.createdAt
                      )}
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      returnItem.status
                    }
                  />
                </div>
              </div>
            )
          )}
        </RecentSection>

        {/* =================================================
            RECENT INVOICES
        ================================================= */}

        <RecentSection
          title="Recent Purchase Invoices"
          icon={
            <FileText className="h-5 w-5" />
          }
          href="/purchasing/invoices"
          emptyMessage="No recent purchase invoices."
        >
          {recentInvoices.map(
            (invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.invoiceNumber ??
                        `INV-${invoice.id}`}
                    </p>

                    <p className="text-xs text-gray-500">
                      {invoice.supplierName ??
                        invoice.supplier
                          ?.supplierName ??
                        invoice.supplier?.name ??
                        "Unknown Supplier"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        invoice.totalAmount
                      )}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatDate(
                        invoice.invoiceDate ??
                          invoice.createdAt
                      )}
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      invoice.status
                    }
                  />
                </div>
              </div>
            )
          )}
        </RecentSection>
      </div>
    </div>
  );
}

/* =========================================================
   MODULE CARD
========================================================= */

function ModuleCard({
  href,
  icon,
  title,
  value,
  pending,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: number;
  pending: number;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>

        <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
      </div>

      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
        <Clock3 className="h-3.5 w-3.5" />

        <span>
          {pending} pending
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="text-blue-600">
        {icon}
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        {title}
      </h2>
    </div>
  );
}

/* =========================================================
   SUMMARY BOX
========================================================= */

function SummaryBox({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="text-xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   STATUS PROGRESS
========================================================= */

function StatusProgress({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: {
    label: string;
    value: number;
    icon: React.ReactNode;
  }[];
}) {
  const total = items.reduce(
    (sum, item) =>
      sum + (item.value ?? 0),
    0
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="text-blue-600">
          {icon}
        </div>

        <h3 className="font-semibold text-gray-900">
          {title}
        </h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const percentage =
            total > 0
              ? (item.value / total) * 100
              : 0;

          return (
            <div
              key={item.label}
            >
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  {item.icon}

                  <span>
                    {item.label}
                  </span>
                </div>

                <span className="font-medium text-gray-900">
                  {item.value}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
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
  status?: string;
}) {
  const normalized =
    status
      ?.toLowerCase()
      .replace(/_/g, " ")
      .trim() || "unknown";

  let className =
    "bg-gray-100 text-gray-700";

  if (
    normalized.includes("approved") ||
    normalized.includes("completed") ||
    normalized.includes("paid") ||
    normalized.includes("received")
  ) {
    className =
      "bg-green-100 text-green-700";
  } else if (
    normalized.includes("pending") ||
    normalized.includes("partial")
  ) {
    className =
      "bg-yellow-100 text-yellow-700";
  } else if (
    normalized.includes("rejected") ||
    normalized.includes("cancelled") ||
    normalized.includes("canceled") ||
    normalized.includes("overdue")
  ) {
    className =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}

/* =========================================================
   RECENT SECTION
========================================================= */

function RecentSection({
  title,
  icon,
  href,
  emptyMessage,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const hasChildren =
    Array.isArray(children)
      ? children.length > 0
      : !!children;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-blue-600">
            {icon}
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {hasChildren ? (
          children
        ) : (
          <div className="flex min-h-[100px] items-center justify-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
  status?: string
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
  value?: string
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}