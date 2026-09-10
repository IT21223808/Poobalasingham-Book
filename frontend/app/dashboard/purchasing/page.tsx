"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  XCircle,
  TrendingUp,
  Receipt,
  CircleDollarSign,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "@/services/api";

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

export default function PurchasingDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response =
          await api.get<DashboardData>(
            "/purchasing/dashboard",
          );

        console.log(
          "✅ Purchasing dashboard:",
          response.data,
        );

        setDashboard(response.data);
      } catch (err: unknown) {
        console.error(
          "❌ Purchasing dashboard failed:",
          err,
        );

        if (
          typeof err === "object" &&
          err !== null
        ) {
          const axiosError = err as {
            response?: {
              status?: number;
              data?: unknown;
            };

            message?: string;

            config?: {
              url?: string;
              method?: string;
              baseURL?: string;
            };
          };

          const status =
            axiosError.response?.status;

          const responseData =
            axiosError.response?.data;

          let message =
            "Failed to load purchasing dashboard.";

          if (
            responseData &&
            typeof responseData === "object" &&
            "message" in responseData
          ) {
            const backendMessage =
              (
                responseData as {
                  message?: string | string[];
                }
              ).message;

            if (
              Array.isArray(
                backendMessage,
              )
            ) {
              message =
                backendMessage.join(", ");
            } else if (
              typeof backendMessage ===
              "string"
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
            message =
              axiosError.message;
          }

          if (status === 401) {
            message =
              "Unauthorized (401): JWT token is missing, invalid or expired.";
          } else if (status === 403) {
            message =
              "Forbidden (403): You do not have permission to access purchasing.";
          } else if (status === 404) {
            message =
              "Not Found (404): Purchasing dashboard endpoint was not found.";
          } else if (status === 500) {
            message =
              "Server Error (500): Please check the purchasing backend.";
          }

          setError(message);
        } else {
          setError(
            "Failed to load purchasing dashboard.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex min-h-[520px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              </div>

              <p className="text-sm font-medium text-slate-700">
                Loading purchasing dashboard...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Fetching latest purchasing data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error && !dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              onClick={() =>
                loadDashboard()
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     SAFE DEFAULTS
  ========================================================= */

  const overview =
    dashboard?.overview ?? {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Purchasing
                </h1>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                  Dashboard
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Monitor purchase orders, GRNs,
                invoices and supplier returns.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              loadDashboard(true)
            }
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
              : "Refresh Data"}
          </button>
        </div>

        {/* =====================================================
            ERROR WARNING
        ===================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Dashboard warning
              </p>

              <p className="mt-0.5 text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            MODULE CARDS
        ===================================================== */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

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
            iconStyle="blue"
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
            iconStyle="indigo"
          />

          <ModuleCard
            href="/dashboard/purchasing/grn"
            icon={
              <PackageCheck className="h-5 w-5" />
            }
            title="GRNs"
            value={overview.totalGRNs}
            pending={overview.pendingGRNs}
            iconStyle="green"
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
            iconStyle="purple"
          />

          <ModuleCard
            href="/dashboard/purchasing/returns"
            icon={
              <RotateCcw className="h-5 w-5" />
            }
            title="Returns"
            value={overview.totalReturns}
            pending={
              overview.pendingReturns
            }
            iconStyle="orange"
          />
        </div>

        {/* =====================================================
            PURCHASE OVERVIEW
        ===================================================== */}

        <section className="mb-7">
          <SectionTitle
            icon={
              <TrendingUp className="h-5 w-5" />
            }
            title="Purchase Overview"
            description="Current purchasing value and receiving position"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <KpiCard
              title="Total Purchases"
              value={
                purchaseOverview.totalPurchases
              }
              subtitle="Purchase orders"
              icon={
                <ShoppingCart className="h-5 w-5" />
              }
              style="blue"
            />

            <KpiCard
              title="Purchase Amount"
              value={formatCurrency(
                purchaseOverview.totalPurchaseAmount,
              )}
              subtitle="Total committed value"
              icon={
                <CircleDollarSign className="h-5 w-5" />
              }
              style="indigo"
            />

            <KpiCard
              title="Received Amount"
              value={formatCurrency(
                purchaseOverview.totalReceivedAmount,
              )}
              subtitle="Received purchase value"
              icon={
                <PackageCheck className="h-5 w-5" />
              }
              style="green"
            />

            <KpiCard
              title="Pending Amount"
              value={formatCurrency(
                purchaseOverview.totalPendingAmount,
              )}
              subtitle="Awaiting receipt"
              icon={
                <Clock3 className="h-5 w-5" />
              }
              style="orange"
            />

          </div>
        </section>

        {/* =====================================================
            STATUS CARDS
        ===================================================== */}

        <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-3">

          <StatusCard
            title="Purchase Orders"
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

          <StatusCard
            title="Invoices"
            icon={
              <Receipt className="h-5 w-5" />
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

          <StatusCard
            title="Purchase Returns"
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
        {/* =====================================================
            RECENT ACTIVITY
            GRNs + RETURNS = 2 COLUMNS
            INVOICES = NEXT ROW
        ===================================================== */}

        <section className="mb-7">

          <SectionTitle
            icon={
              <FileText className="h-5 w-5" />
            }
            title="Recent Purchasing Activity"
            description="Latest GRNs, purchase returns and invoices"
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

  {/* ================================================= 
        RECENT PURCHASE ORDERS
    ================================================= */} 

    <RecentSection 
      title="Recent Purchase Orders" 
      icon={ 
        <ShoppingCart className="h-5 w-5" /> 
      } 
      href="/dashboard/purchasing/orders" 
      emptyMessage="No recent purchase orders." 
    > 
      {recentPurchaseOrders.map((po) => ( 
        <RecentPurchaseOrder 
          key={po.id} 
          po={po} 
        /> 
      ))} 
    </RecentSection> 
            {/* =================================================
                RECENT GRNs
            ================================================= */}

            <RecentSection
              title="Recent GRNs"
              icon={
                <PackageCheck className="h-5 w-5" />
              }
              href="/dashboard/purchasing/grn"
              emptyMessage="No recent GRNs."
            >
              {recentGRNs.map((grn) => (
                <RecentGRN
                  key={grn.id}
                  grn={grn}
                />
              ))}
            </RecentSection>

            {/* =================================================
                RECENT PURCHASE RETURNS
            ================================================= */}

            <RecentSection
              title="Recent Purchase Returns"
              icon={
                <RotateCcw className="h-5 w-5" />
              }
              href="/dashboard/purchasing/returns"
              emptyMessage="No recent purchase returns."
            >
              {recentReturns.map(
                (returnItem) => (
                  <RecentReturn
                    key={returnItem.id}
                    item={returnItem}
                  />
                ),
              )}
            </RecentSection>

            {/* =================================================
                RECENT PURCHASE INVOICES
            ================================================= */}

            <RecentSection
              title="Recent Purchase Invoices"
              icon={
                <FileText className="h-5 w-5" />
              }
              href="/dashboard/purchasing/invoices"
              emptyMessage="No recent purchase invoices."
            >
              {recentInvoices.map(
                (invoice) => (
                  <RecentInvoice
                    key={invoice.id}
                    invoice={invoice}
                  />
                ),
              )}
            </RecentSection>

          </div>
        </section>

      </div>
    </div>
  );
}

/* =============================================================
   MODULE CARD
============================================================= */

function ModuleCard({
  href,
  icon,
  title,
  value,
  pending,
  iconStyle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: number;
  pending: number;
  iconStyle:
    | "blue"
    | "indigo"
    | "green"
    | "purple"
    | "orange";
}) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      hover: "hover:border-blue-200",
    },

    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      hover: "hover:border-indigo-200",
    },

    green: {
      icon: "bg-emerald-50 text-emerald-600",
      hover: "hover:border-emerald-200",
    },

    purple: {
      icon: "bg-purple-50 text-purple-600",
      hover: "hover:border-purple-200",
    },

    orange: {
      icon: "bg-orange-50 text-orange-600",
      hover: "hover:border-orange-200",
    },
  };

  return (
    <Link
      href={href}
      className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles[iconStyle].hover}`}
    >
      <div className="flex items-start justify-between">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[iconStyle].icon}`}
        >
          {icon}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition group-hover:bg-slate-50 group-hover:text-blue-600">
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>

      </div>

      <div className="mt-5">

        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs">

          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50">
            <Clock3 className="h-3 w-3 text-amber-600" />
          </span>

          <span className="font-medium text-slate-500">
            {pending} pending
          </span>

        </div>

      </div>
    </Link>
  );
}

/* =============================================================
   SECTION TITLE
============================================================= */

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">
          {title}
        </h2>

        <p className="text-xs text-slate-500">
          {description}
        </p>
      </div>

    </div>
  );
}

/* =============================================================
   KPI CARD
============================================================= */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  style,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  style:
    | "blue"
    | "indigo"
    | "green"
    | "orange";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[style]}`}
        >
          {icon}
        </div>

      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          {subtitle}
        </p>
      </div>

    </div>
  );
}

/* =============================================================
   STATUS CARD
============================================================= */

function StatusCard({
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
    0,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="mb-5 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>

          <h3 className="text-sm font-bold text-slate-900">
            {title}
          </h3>

        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {total} Total
        </span>

      </div>

      <div className="space-y-4">

        {items.map((item) => {
          const percentage =
            total > 0
              ? (item.value / total) * 100
              : 0;

          return (
            <div key={item.label}>

              <div className="mb-1.5 flex items-center justify-between">

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {item.icon}

                  <span>
                    {item.label}
                  </span>
                </div>

                <span className="text-xs font-bold text-slate-800">
                  {item.value}
                </span>

              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      percentage,
                      100,
                    )}%`,
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

/* =============================================================
   RECENT SECTION
============================================================= */

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
    <section className="mb-0">

      <div className="mb-4 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>

          <h2 className="text-base font-bold text-slate-900">
            {title}
          </h2>

        </div>

        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          View all

          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {hasChildren ? (
          <div className="divide-y divide-slate-100">
            {children}
          </div>
        ) : (
          <div className="flex min-h-[180px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                <PackageCheck className="h-4 w-4 text-slate-300" />
              </div>

              <p className="text-sm text-slate-400">
                {emptyMessage}
              </p>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}

/* =============================================================
   RECENT PURCHASE ORDER
============================================================= */

function RecentPurchaseOrder({
  po,
}: {
  po: PurchaseOrder;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ShoppingCart className="h-5 w-5" />
        </div>

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-slate-900">
            {po.poNumber ??
              po.purchaseOrderNumber ??
              `PO-${po.id}`}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">

            <span className="text-xs text-slate-500">
              {po.supplierName ??
                po.supplier?.supplierName ??
                po.supplier?.name ??
                "Unknown Supplier"}
            </span>

            <span className="text-slate-300">
              •
            </span>

            <span className="text-xs text-slate-400">
              {formatDate(
                po.createdAt ??
                  po.orderDate,
              )}
            </span>

          </div>

        </div>

      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">

        <p className="text-sm font-bold text-slate-900">
          {formatCurrency(
            po.totalAmount,
          )}
        </p>

        <StatusBadge
          status={po.status}
        />

      </div>

    </div>
  );
}

/* =============================================================
   RECENT GRN
============================================================= */

function RecentGRN({
  grn,
}: {
  grn: GRN;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <PackageCheck className="h-5 w-5" />
        </div>

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-slate-900">
            {grn.grnNumber ??
              `GRN-${grn.id}`}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            PO #
            {grn.purchaseOrder?.poNumber ??
              grn.purchaseOrder
                ?.purchaseOrderNumber ??
              grn.purchaseOrderId ??
              "-"}
          </p>

        </div>

      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">

        <span className="text-xs text-slate-400">
          {formatDate(
            grn.receivedDate ??
              grn.createdAt,
          )}
        </span>

        <StatusBadge
          status={grn.status}
        />

      </div>

    </div>
  );
}

/* =============================================================
   RECENT PURCHASE RETURN
============================================================= */

function RecentReturn({
  item,
}: {
  item: PurchaseReturn;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <RotateCcw className="h-5 w-5" />
        </div>

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-slate-900">
            {item.returnNumber ??
              `RET-${item.id}`}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {item.supplierName ??
              item.supplier?.supplierName ??
              item.supplier?.name ??
              "Unknown Supplier"}
          </p>

        </div>

      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">

        <div className="text-right">

          <p className="text-sm font-bold text-slate-900">
            {formatCurrency(
              item.totalAmount,
            )}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {formatDate(
              item.returnDate ??
                item.createdAt,
            )}
          </p>

        </div>

        <StatusBadge
          status={item.status}
        />

      </div>

    </div>
  );
}

/* =============================================================
   RECENT PURCHASE INVOICE
============================================================= */

function RecentInvoice({
  invoice,
}: {
  invoice: PurchaseInvoice;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <FileText className="h-5 w-5" />
        </div>

        <div className="min-w-0">

          <p className="truncate text-sm font-semibold text-slate-900">
            {invoice.invoiceNumber ??
              `INV-${invoice.id}`}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {invoice.supplierName ??
              invoice.supplier?.supplierName ??
              invoice.supplier?.name ??
              "Unknown Supplier"}
          </p>

        </div>

      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">

        <div className="text-right">

          <p className="text-sm font-bold text-slate-900">
            {formatCurrency(
              invoice.totalAmount,
            )}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {formatDate(
              invoice.invoiceDate ??
                invoice.createdAt,
            )}
          </p>

        </div>

        <StatusBadge
          status={invoice.status}
        />

      </div>

    </div>
  );
}

/* =============================================================
   STATUS BADGE
============================================================= */

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
    "bg-slate-100 text-slate-600";

  if (
    normalized.includes("approved") ||
    normalized.includes("completed") ||
    normalized === "paid" ||
    normalized === "received"
  ) {
    className =
      "bg-emerald-50 text-emerald-700";
  } else if (
    normalized.includes("pending") ||
    normalized.includes("partial") ||
    normalized === "unpaid"
  ) {
    className =
      "bg-amber-50 text-amber-700";
  } else if (
    normalized.includes("rejected") ||
    normalized.includes("cancelled") ||
    normalized.includes("canceled") ||
    normalized.includes("overdue")
  ) {
    className =
      "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}

/* =============================================================
   FORMAT STATUS
============================================================= */

function formatStatus(
  status?: string,
) {
  if (!status) {
    return "Unknown";
  }

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

/* =============================================================
   FORMAT CURRENCY
============================================================= */

function formatCurrency(
  value?: number,
) {
  return new Intl.NumberFormat(
    "en-LK",
    {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value ?? 0);
}

/* =============================================================
   FORMAT DATE
============================================================= */

function formatDate(
  value?: string,
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}