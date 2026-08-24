"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Pencil,
  Printer,
  ShoppingCart,
  Package,
  User,
  CalendarDays,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Supplier {
  id: number | string;
  supplierCode?: string;
  supplierName: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Product {
  id: string;
  productCode?: string;
  productName: string;
  barcode?: string;
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
  updatedAt?: string;
  orderDate?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const ORDERS_API = `${API_URL}/purchasing/orders`;

export default function PurchaseOrderDetailsPage() {
  const params = useParams();

  const id = params?.id;

  const [order, setOrder] =
    useState<PurchaseOrder | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =========================================================
     LOAD PURCHASE ORDER
  ========================================================= */

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const response = await fetch(
        `${ORDERS_API}/${id}`,
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

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Failed to load purchase order"
        );
      }

      const result =
        data?.data || data;

      setOrder(result);
    } catch (err) {
      console.error(
        "Load purchase order error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchase order"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id, loadOrder]);

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
              Loading purchase order...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !order) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-white p-8 text-center">
          <XCircle
            size={42}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Purchase Order Not Found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "Unable to find this purchase order."}
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={loadOrder}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ORDER CALCULATIONS
  ========================================================= */

  const normalizedStatus =
    order.status?.toUpperCase();

  const canEdit = [
    "DRAFT",
    "PENDING",
  ].includes(normalizedStatus);

  const totalQuantity =
    order.items?.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    ) || 0;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>

          {/* BREADCRUMB */}

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

            <Link
              href="/dashboard/purchasing/orders"
              className="text-gray-500 hover:text-blue-600"
            >
              Purchase Orders
            </Link>

            <span className="text-gray-300">
              /
            </span>

            <span className="font-medium text-gray-900">
              {order.poNumber}
            </span>
          </div>

          {/* TITLE + ACTIONS */}

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* TITLE */}

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-blue-50 p-3">
                <ShoppingCart
                  size={24}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Purchase Order
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {order.poNumber}
                </p>
              </div>

            </div>

            {/* TOP RIGHT ACTIONS */}

            <div className="flex flex-wrap gap-3">

              {canEdit && (
                <Link
                  href={`/dashboard/purchasing/orders/${order.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Pencil size={17} />
                  Edit Purchase Order
                </Link>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Printer size={17} />
                Print
              </button>

            </div>

          </div>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

          <InfoCard
            title="PO Number"
            value={order.poNumber}
            icon={FileText}
          />

          <InfoCard
            title="Supplier"
            value={
              order.supplier?.supplierName ||
              "—"
            }
            icon={User}
          />

          <InfoCard
            title="Order Date"
            value={formatDate(
              order.orderDate ||
                order.createdAt
            )}
            icon={CalendarDays}
          />

          <div className="rounded-xl border border-gray-200 bg-white p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <div className="mt-3">
                  <StatusBadge
                    status={normalizedStatus}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-2.5">
                <CheckCircle2
                  size={20}
                  className="text-green-600"
                />
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            PURCHASE ORDER DETAILS
        ===================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ===================================================
              SUPPLIER DETAILS
          =================================================== */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Supplier Details
              </h2>
            </div>

            <div className="space-y-4 p-6">

              <DetailRow
                label="Supplier Name"
                value={
                  order.supplier?.supplierName ||
                  "—"
                }
              />

              <DetailRow
                label="Supplier Code"
                value={
                  order.supplier?.supplierCode ||
                  "—"
                }
              />

              <DetailRow
                label="Phone"
                value={
                  order.supplier?.phone ||
                  "—"
                }
              />

              <DetailRow
                label="Email"
                value={
                  order.supplier?.email ||
                  "—"
                }
              />

              <DetailRow
                label="Address"
                value={
                  order.supplier?.address ||
                  "—"
                }
              />

            </div>
          </div>

          {/* ===================================================
              ORDER DETAILS
          =================================================== */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Order Details
              </h2>
            </div>

            <div className="space-y-4 p-6">

              <DetailRow
                label="PO Number"
                value={order.poNumber}
              />

              <DetailRow
                label="Purchase Order ID"
                value={`#${order.id}`}
              />

              <DetailRow
                label="Requisition"
                value={
                  order.requisitionId
                    ? `REQ-${String(
                        order.requisitionId
                      ).padStart(5, "0")}`
                    : "—"
                }
              />

              <DetailRow
                label="Order Date"
                value={formatDate(
                  order.orderDate ||
                    order.createdAt
                )}
              />

              <DetailRow
                label="Created"
                value={formatDate(
                  order.createdAt
                )}
              />

              {order.updatedAt && (
                <DetailRow
                  label="Last Updated"
                  value={formatDate(
                    order.updatedAt
                  )}
                />
              )}

            </div>
          </div>

          {/* ===================================================
              ORDER SUMMARY
          =================================================== */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Order Summary
              </h2>
            </div>

            <div className="space-y-5 p-6">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Number of Items
                </span>

                <span className="font-semibold text-gray-900">
                  {order.items?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Total Quantity
                </span>

                <span className="font-semibold text-gray-900">
                  {totalQuantity}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-5">

                <div className="flex items-center justify-between">

                  <span className="font-medium text-gray-700">
                    Total Amount
                  </span>

                  <span className="text-xl font-bold text-gray-900">
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
                  </span>

                </div>

              </div>

            </div>
          </div>

        </div>

        {/* =====================================================
            ORDER ITEMS
        ===================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          {/* SECTION HEADER */}

          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">

            <div className="rounded-lg bg-blue-50 p-2">
              <Package
                size={19}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Order Items
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products included in this purchase order.
              </p>
            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    #
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Product
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Product Code
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Quantity
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Unit Price
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Subtotal
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {order.items?.length > 0 ? (

                  order.items.map(
                    (item, index) => (

                      <tr
                        key={item.id}
                        className="hover:bg-gray-50"
                      >

                        {/* NUMBER */}

                        <td className="px-6 py-4 text-gray-500">
                          {index + 1}
                        </td>

                        {/* PRODUCT */}

                        <td className="px-6 py-4">

                          <p className="font-medium text-gray-900">
                            {item.product
                              ?.productName ||
                              "Unknown Product"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Product ID:{" "}
                            {item.productId}
                          </p>

                          {item.product?.barcode && (
                            <p className="mt-1 text-xs text-gray-400">
                              Barcode:{" "}
                              {item.product.barcode}
                            </p>
                          )}

                        </td>

                        {/* PRODUCT CODE */}

                        <td className="px-6 py-4 text-gray-500">
                          {item.product
                            ?.productCode ||
                            "—"}
                        </td>

                        {/* QUANTITY */}

                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {Number(
                            item.quantity || 0
                          )}
                        </td>

                        {/* UNIT PRICE */}

                        <td className="px-6 py-4 text-right text-gray-700">
                          Rs.{" "}
                          {Number(
                            item.unitPrice || 0
                          ).toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        {/* SUBTOTAL */}

                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          Rs.{" "}
                          {Number(
                            item.subtotal || 0
                          ).toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No items found.
                    </td>

                  </tr>

                )}

              </tbody>

              {/* TOTAL */}

              <tfoot className="border-t border-gray-200 bg-gray-50">

                <tr>

                  <td
                    colSpan={3}
                    className="px-6 py-4 text-right font-medium text-gray-700"
                  >
                    Total
                  </td>

                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    {totalQuantity}
                  </td>

                  <td />

                  <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
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
                  </td>

                </tr>

              </tfoot>

            </table>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {value}
          </p>

        </div>

        <div className="rounded-lg bg-blue-50 p-2.5">

          <Icon
            size={20}
            className="text-blue-600"
          />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value}
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
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${
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

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date?: string) {
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