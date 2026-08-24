"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Pencil,
  Printer,
  ClipboardList,
  Package,
  User,
  CalendarDays,
  FileText,
  Clock3,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

interface Product {
  id: string;
  productCode?: string;
  productName?: string;
}

interface RequisitionItem {
  id: number;
  productId: string;
  quantity: number;
  product?: Product;
}

interface PurchaseRequisition {
  id: number;
  requisitionNumber: string;
  requestedBy?: string;
  requestedDate?: string;
  requiredDate?: string;
  status: string;
  notes?: string | null;
  items: RequisitionItem[];
  createdAt: string;
  updatedAt?: string;
}

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const REQUISITION_API =
  `${API_URL}/purchasing/requisitions`;

/* =========================================================
   PAGE
========================================================= */

export default function PurchaseRequisitionDetailsPage() {
  const params = useParams();

  const id = params?.id;

  const [requisition, setRequisition] =
    useState<PurchaseRequisition | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     LOAD REQUISITION
  ======================================================= */

  const loadRequisition = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const response = await fetch(
        `${REQUISITION_API}/${id}`,
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
                "Failed to load requisition"
        );
      }

      const result =
        data?.data || data;

      setRequisition(result);
    } catch (err) {
      console.error(
        "Load requisition error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load requisition"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRequisition();
  }, [loadRequisition]);

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {
    window.print();
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
              Loading requisition...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !requisition) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <XCircle
            size={42}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Requisition Not Found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "Unable to find this requisition."}
          </p>

          <button
            type="button"
            onClick={loadRequisition}
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
     VALUES
  ======================================================= */

  const normalizedStatus =
    requisition.status?.toUpperCase();

  const canEdit =
    normalizedStatus === "PENDING";

  const totalQuantity =
    requisition.items?.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    ) || 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6 print:bg-white print:p-0">
      <div className="w-full space-y-6">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="flex items-center gap-2 text-sm print:hidden">

          <Link
            href="/dashboard/purchasing"
            className="font-medium text-gray-500 hover:text-blue-600"
          >
            Purchasing
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <Link
            href="/dashboard/purchasing/requisitions"
            className="font-medium text-gray-500 hover:text-blue-600"
          >
            Purchase Requisitions
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <span className="font-medium text-gray-900">
            {requisition.requisitionNumber}
          </span>

        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ClipboardList size={22} />
            </div>

            <div>

              <h1 className="text-2xl font-semibold text-gray-900">
                Purchase Requisition
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {requisition.requisitionNumber}
              </p>

            </div>

          </div>

          {/* TOP RIGHT ACTIONS */}

          <div className="flex items-center gap-3 print:hidden">

            {canEdit && (
              <Link
                href={`/dashboard/purchasing/requisitions/${requisition.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Pencil size={17} />
                Edit
              </Link>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer size={17} />
              Print
            </button>

          </div>

        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

          <InfoCard
            title="Requisition Number"
            value={requisition.requisitionNumber}
            icon={FileText}
          />

          <InfoCard
            title="Requested Date"
            value={formatDate(
              requisition.requestedDate
            )}
            icon={CalendarDays}
          />

          <InfoCard
            title="Required Date"
            value={formatDate(
              requisition.requiredDate
            )}
            icon={Clock3}
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

        {/* =================================================
            DETAILS
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* REQUISITION INFORMATION */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Requisition Information
              </h2>
            </div>

            <div className="space-y-4 p-6">

              <DetailRow
                label="Requisition Number"
                value={
                  requisition.requisitionNumber
                }
              />

              <DetailRow
                label="Requisition ID"
                value={`#${requisition.id}`}
              />

              <DetailRow
                label="Requested By"
                value={
                  requisition.requestedBy ||
                  "—"
                }
              />

              <DetailRow
                label="Requested Date"
                value={formatDate(
                  requisition.requestedDate
                )}
              />

              <DetailRow
                label="Required Date"
                value={formatDate(
                  requisition.requiredDate
                )}
              />

            </div>

          </div>

          {/* STATUS */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Status Information
              </h2>
            </div>

            <div className="space-y-4 p-6">

              <DetailRow
                label="Current Status"
                value={
                  getStatusLabel(
                    normalizedStatus
                  )
                }
              />

              <DetailRow
                label="Created"
                value={formatDate(
                  requisition.createdAt
                )}
              />

              <DetailRow
                label="Last Updated"
                value={formatDate(
                  requisition.updatedAt
                )}
              />

            </div>

          </div>

          {/* SUMMARY */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Request Summary
              </h2>
            </div>

            <div className="space-y-5 p-6">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Number of Products
                </span>

                <span className="font-semibold text-gray-900">
                  {requisition.items?.length ||
                    0}
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

            </div>

          </div>

        </div>

        {/* =================================================
            NOTES
        ================================================= */}

        {requisition.notes && (
          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Notes
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {requisition.notes}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">

            <div className="rounded-lg bg-blue-50 p-2">
              <Package
                size={19}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Requested Products
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Products requested for purchase.
              </p>
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px] text-left text-sm">

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

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {requisition.items?.length > 0 ? (
                  requisition.items.map(
                    (item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4 text-gray-500">
                          {index + 1}
                        </td>

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

                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {item.product
                            ?.productCode ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {Number(
                            item.quantity || 0
                          )}
                        </td>

                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}

              </tbody>

              <tfoot className="border-t border-gray-200 bg-gray-50">

                <tr>

                  <td
                    colSpan={3}
                    className="px-6 py-4 text-right font-medium text-gray-700"
                  >
                    Total Quantity
                  </td>

                  <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
                    {totalQuantity}
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

      <p className="mt-1 text-sm font-medium text-gray-900">
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
    PENDING:
      "bg-yellow-50 text-yellow-700 border-yellow-200",

    APPROVED:
      "bg-green-50 text-green-700 border-green-200",

    REJECTED:
      "bg-red-50 text-red-700 border-red-200",

    CANCELLED:
      "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${
        styles[status] ||
        "border-gray-200 bg-gray-100 text-gray-600"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return labels[status] || status || "Unknown";
}

/* =========================================================
   DATE
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