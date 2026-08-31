"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  Pencil,
  Loader2,
  Receipt,
  CalendarDays,
  CreditCard,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

/* API */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* TYPES */

interface InvoiceItem {
  id: number;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  discount?: string | number;
  tax?: string | number;
  subtotal: string | number;

  product?: {
    id: string;
    productCode?: string;
    productName: string;
  };
}

interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;

  supplierId?: number | string;

  supplier?: {
    id: number | string;
    supplierCode?: string;
    supplierName: string;
  };

  purchaseOrderId?: number | null;

  purchaseOrder?: {
    id: number;
    poNumber: string;
  };

  grnId?: number | null;

  grn?: {
    id: number;
    grnNumber: string;
  };

  invoiceDate: string;
  dueDate?: string | null;

  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  grandTotal: string | number;

  paymentStatus: string;

  items: InvoiceItem[];
}

/* =========================================================
   PAGE PROPS
========================================================= */

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/* =========================================================
   PAGE
========================================================= */

export default function ViewPurchaseInvoicePage({
  params,
}: PageProps) {
  const { id } = use(params);

  const invoiceId = String(id);

  const [invoice, setInvoice] =
    useState<PurchaseInvoice | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD INVOICE
  ======================================================= */

  useEffect(() => {
    if (!invoiceId) {
      setError("Invoice ID is missing");
      setLoading(false);
      return;
    }

    const loadInvoice = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("accessToken");

        const response = await fetch(
          `${API_URL}/purchasing/invoices/${invoiceId}`,
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

        const result =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            Array.isArray(result?.message)
              ? result.message.join(", ")
              : result?.message?.message ||
                  result?.message ||
                  "Failed to load invoice"
          );
        }

        const invoiceData =
          result?.data || result;

        setInvoice(invoiceData);
      } catch (err) {
        console.error(
          "Load invoice error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load invoice"
        );
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !invoice) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/purchasing/invoices"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Invoices
          </Link>

          <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-red-600">
              {error || "Invoice not found"}
            </p>

            <Link
              href="/dashboard/purchasing/invoices"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     STATUS
  ======================================================= */

  const paymentStatus =
    invoice.paymentStatus?.toUpperCase() || "";

  const canEdit = [
    "DRAFT",
    "UNPAID",
  ].includes(paymentStatus);

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">

          <div>

            {/* BREADCRUMB */}

            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">

              <Link
                href="/dashboard/purchasing"
                className="text-gray-500 transition hover:text-blue-600"
              >
                Purchasing
              </Link>

              <span className="text-gray-300">
                /
              </span>

              <Link
                href="/dashboard/purchasing/invoices"
                className="text-gray-500 transition hover:text-blue-600"
              >
                Purchase Invoices
              </Link>

              <span className="text-gray-300">
                /
              </span>

              <span className="font-medium text-gray-900">
                {invoice.invoiceNumber}
              </span>

            </div>

            {/* TITLE */}

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Receipt
                  size={23}
                  className="text-blue-600"
                />
              </div>

              <div>

                <h1 className="text-2xl font-semibold text-gray-900">
                  {invoice.invoiceNumber}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Purchase Invoice Details
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-wrap items-center gap-2">

            {/* BACK */}

            <Link
              href="/dashboard/purchasing/invoices"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            {/* PAYMENT TRACKING */}

            <Link
              href={`/dashboard/purchasing/invoices/${invoice.id}/payments`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              <CreditCard size={16} />
              Payments
              <ExternalLink size={14} />
            </Link>

            {/* EDIT */}

            {canEdit && (
              <Link
                href={`/dashboard/purchasing/invoices/${invoice.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <Pencil size={16} />
                Edit Invoice
              </Link>
            )}

          </div>

        </div>

        {/* =================================================
            BASIC INFORMATION
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* SUPPLIER */}

          <InfoCard
            title="Supplier"
            value={
              invoice.supplier?.supplierName ||
              "—"
            }
            subValue={
              invoice.supplier?.supplierCode
            }
          />

          {/* INVOICE DATE */}

          <InfoCard
            title="Invoice Date"
            value={formatDate(
              invoice.invoiceDate
            )}
            icon={
              <CalendarDays
                size={20}
                className="text-blue-600"
              />
            }
          />

          {/* PAYMENT STATUS */}

          <InfoCard
            title="Payment Status"
            value={formatStatus(
              paymentStatus
            )}
            icon={
              <CreditCard
                size={20}
                className="text-blue-600"
              />
            }
          />

        </div>

        {/* =================================================
            PAYMENT QUICK ACCESS
        ================================================= */}

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <CreditCard
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="font-semibold text-blue-900">
                  Payment Tracking
                </h2>

              </div>

              <p className="mt-1 text-sm text-blue-700">
                View payment history, record payments,
                and track the outstanding balance.
              </p>

            </div>

            <Link
              href={`/dashboard/purchasing/invoices/${invoice.id}/payments`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <CreditCard size={16} />
              Manage Payments
            </Link>

          </div>

        </div>

        {/* =================================================
            REFERENCES
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <h2 className="font-semibold text-gray-900">
            References
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

            <Detail
              label="Invoice Number"
              value={
                invoice.invoiceNumber
              }
            />

            <Detail
              label="Purchase Order"
              value={
                invoice.purchaseOrder?.poNumber ||
                (invoice.purchaseOrderId
                  ? `PO-${String(
                      invoice.purchaseOrderId
                    ).padStart(5, "0")}`
                  : "—")
              }
            />

            <Detail
              label="GRN"
              value={
                invoice.grn?.grnNumber ||
                (invoice.grnId
                  ? `GRN-${String(
                      invoice.grnId
                    ).padStart(5, "0")}`
                  : "—")
              }
            />

            <Detail
              label="Invoice Date"
              value={formatDate(
                invoice.invoiceDate
              )}
            />

            <Detail
              label="Due Date"
              value={
                invoice.dueDate
                  ? formatDate(
                      invoice.dueDate
                    )
                  : "—"
              }
            />

            <Detail
              label="Payment Status"
              value={formatStatus(
                paymentStatus
              )}
            />

          </div>

        </div>

        {/* =================================================
            ITEMS
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-6 py-5">

            <h2 className="font-semibold text-gray-900">
              Invoice Items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Products included in this purchase invoice.
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-sm">

              <thead className="bg-gray-50">

                <tr className="border-b border-gray-200">

                  <th className="px-6 py-3 text-left font-medium text-gray-600">
                    Product
                  </th>

                  <th className="px-6 py-3 text-left font-medium text-gray-600">
                    Quantity
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Unit Price
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Discount
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Tax
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Subtotal
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {invoice.items?.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-gray-50"
                    >

                      <td className="px-6 py-4">

                        <p className="font-medium text-gray-900">
                          {item.product
                            ?.productName ||
                            item.productId}
                        </p>

                        {item.product
                          ?.productCode && (
                          <p className="mt-1 text-xs text-gray-400">
                            {
                              item.product
                                .productCode
                            }
                          </p>
                        )}

                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {item.quantity}
                      </td>

                      <td className="px-6 py-4 text-right">
                        Rs.{" "}
                        {formatMoney(
                          item.unitPrice
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        Rs.{" "}
                        {formatMoney(
                          item.discount || 0
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        Rs.{" "}
                        {formatMoney(
                          item.tax || 0
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-medium">
                        Rs.{" "}
                        {formatMoney(
                          item.subtotal
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            TOTAL
        ================================================= */}

        <div className="flex justify-end">

          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <TotalRow
              label="Subtotal"
              value={invoice.subtotal}
            />

            <TotalRow
              label="Discount"
              value={invoice.discount}
            />

            <TotalRow
              label="Tax"
              value={invoice.tax}
            />

            <div className="mt-3 flex justify-between border-t border-gray-200 pt-4">

              <span className="font-semibold text-gray-900">
                Grand Total
              </span>

              <span className="text-xl font-semibold text-blue-600">
                Rs.{" "}
                {formatMoney(
                  invoice.grandTotal
                )}
              </span>

            </div>

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
  subValue,
  icon,
}: {
  title: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 font-semibold text-gray-900">
            {value}
          </p>

          {subValue && (
            <p className="mt-1 text-xs text-gray-400">
              {subValue}
            </p>
          )}

        </div>

        {icon && (
          <div className="rounded-lg bg-blue-50 p-2">
            {icon}
          </div>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   TOTAL ROW
========================================================= */

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between py-2 text-sm">

      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-medium text-gray-900">
        Rs. {formatMoney(value)}
      </span>

    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  value: string | number
) {
  return Number(value || 0).toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatDate(
  date?: string | null
) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatStatus(
  status: string
) {
  if (!status) return "—";

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}
