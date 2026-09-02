"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Package,
  FileText,
  ShoppingCart,
  MapPin,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronRight,
  Pencil,
  Ban,
  RefreshCw,
} from "lucide-react";

import {
  purchasingService,
  PurchaseReturn,
} from "@/services/purchasing.service";

export default function PurchaseReturnViewPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [purchaseReturn, setPurchaseReturn] =
    useState<PurchaseReturn | null>(null);

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD RETURN
  // =========================================================

  const loadReturn = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError("Invalid purchase return ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await purchasingService.getReturn(id);

      setPurchaseReturn(data);
    } catch (err: any) {
      console.error(
        "Failed to load purchase return:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load purchase return";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  // =========================================================
  // CANCEL RETURN
  // =========================================================

  const handleCancelReturn = async () => {
    if (!purchaseReturn) {
      return;
    }

    if (purchaseReturn.status !== "PENDING") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel purchase return ${purchaseReturn.returnNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);
      setError("");
      setSuccess("");

      await purchasingService.cancelReturn(
        purchaseReturn.id
      );

      setSuccess(
        "Purchase return cancelled successfully."
      );

      // Update UI immediately
      setPurchaseReturn((prev) =>
        prev
          ? {
              ...prev,
              status: "CANCELLED",
            }
          : prev
      );

      // Optional refresh from backend
      await loadReturn();
    } catch (err: any) {
      console.error(
        "Cancel purchase return error:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to cancel purchase return.";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );
    } finally {
      setCancelling(false);
    }
  };

  // =========================================================
  // STATUS ICON
  // =========================================================

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 size={18} />;

      case "CANCELLED":
        return <XCircle size={18} />;

      case "PENDING":
        return <Clock3 size={18} />;

      default:
        return <AlertCircle size={18} />;
    }
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";

      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";

      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date?: string) => {
    if (!date) {
      return "-";
    }

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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

              <p className="text-sm text-gray-500">
                Loading purchase return...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR / NOT FOUND
  // =========================================================

  if (error && !purchaseReturn) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/dashboard/purchasing/returns"
              className="hover:text-orange-600"
            >
              Purchasing
            </Link>

            <ChevronRight className="h-4 w-4 text-gray-400" />

            <span className="font-medium text-gray-900">
              Purchase Returns
            </span>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 text-red-600"
                size={22}
              />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load purchase return
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error || "Purchase return not found"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseReturn) {
    return null;
  }

  // =========================================================
  // STATUS
  // =========================================================

  const isPending =
    purchaseReturn.status === "PENDING";

  const isCompleted =
    purchaseReturn.status === "COMPLETED";

  const isCancelled =
    purchaseReturn.status === "CANCELLED";

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            BREADCRUMB
        ===================================================== */}

        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link
            href="/dashboard/purchasing"
            className="transition-colors hover:text-orange-600"
          >
            Purchasing
          </Link>

          <ChevronRight className="h-4 w-4 text-gray-400" />

          <Link
            href="/dashboard/purchasing/returns"
            className="transition-colors hover:text-orange-600"
          >
            Purchase Returns
          </Link>

          <ChevronRight className="h-4 w-4 text-gray-400" />

          <span className="font-medium text-gray-900">
            {purchaseReturn.returnNumber}
          </span>
        </div>

        {/* =====================================================
            ALERTS
        ===================================================== */}

        {error && (
          <div className="mb-5 flex items-start rounded-lg border border-red-200 bg-red-50 p-4">
            <XCircle
              className="mr-3 mt-0.5 shrink-0 text-red-600"
              size={20}
            />

            <div>
              <p className="font-medium text-red-800">
                Error
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle2
              className="mr-3 mt-0.5 shrink-0 text-green-600"
              size={20}
            />

            <p className="text-sm font-medium text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Package size={26} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Purchase Return
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {purchaseReturn.returnNumber}
                </p>
              </div>
            </div>

            {/* STATUS + ACTIONS */}

            <div className="flex flex-wrap items-center gap-3">

              {/* STATUS */}

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClass(
                  purchaseReturn.status
                )}`}
              >
                {getStatusIcon(
                  purchaseReturn.status
                )}

                {purchaseReturn.status}
              </span>

              {/* EDIT */}

              {isPending && (
                <Link
                  href={`/dashboard/purchasing/returns/${purchaseReturn.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Pencil size={17} />
                  Edit Return
                </Link>
              )}

              {/* CANCEL */}

              {isPending && (
                <button
                  type="button"
                  onClick={handleCancelReturn}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelling ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Ban size={17} />
                      Cancel Return
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            RETURN SUMMARY
        ===================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* RETURN NUMBER */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-gray-500">
              <FileText size={18} />

              <span className="text-sm font-medium">
                Return Number
              </span>
            </div>

            <p className="text-xl font-bold text-gray-900">
              {purchaseReturn.returnNumber}
            </p>
          </div>

          {/* PURCHASE ORDER */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-gray-500">
              <ShoppingCart size={18} />

              <span className="text-sm font-medium">
                Purchase Order
              </span>
            </div>

            <p className="text-xl font-bold text-gray-900">
              PO-
              {String(
                purchaseReturn.purchaseOrderId
              ).padStart(5, "0")}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Order ID:{" "}
              {purchaseReturn.purchaseOrderId}
            </p>
          </div>

          {/* INVOICE */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-gray-500">
              <FileText size={18} />

              <span className="text-sm font-medium">
                Purchase Invoice
              </span>
            </div>

            <p className="text-xl font-bold text-gray-900">
              {purchaseReturn.invoiceId
                ? `Invoice #${purchaseReturn.invoiceId}`
                : "Not linked"}
            </p>

            {purchaseReturn.invoiceId && (
              <p className="mt-1 text-xs text-gray-500">
                Invoice ID:{" "}
                {purchaseReturn.invoiceId}
              </p>
            )}
          </div>

          {/* STATUS */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-medium text-gray-500">
              Status
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusClass(
                purchaseReturn.status
              )}`}
            >
              {getStatusIcon(
                purchaseReturn.status
              )}

              {purchaseReturn.status}
            </span>
          </div>
        </div>

        {/* =====================================================
            RETURN INFORMATION
        ===================================================== */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Return Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">

            {/* RETURN NUMBER */}

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <FileText size={16} />
                Return Number
              </div>

              <p className="font-semibold text-gray-900">
                {purchaseReturn.returnNumber}
              </p>
            </div>

            {/* PURCHASE ORDER */}

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <ShoppingCart size={16} />
                Purchase Order
              </div>

              <p className="font-semibold text-gray-900">
                PO-
                {String(
                  purchaseReturn.purchaseOrderId
                ).padStart(5, "0")}
              </p>
            </div>

            {/* CREATED DATE */}

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays size={16} />
                Created Date
              </div>

              <p className="font-semibold text-gray-900">
                {formatDate(
                  purchaseReturn.createdAt
                )}
              </p>
            </div>

            {/* INVOICE */}

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <FileText size={16} />
                Invoice
              </div>

              <p className="font-semibold text-gray-900">
                {purchaseReturn.invoiceId
                  ? `Invoice #${purchaseReturn.invoiceId}`
                  : "Not linked"}
              </p>
            </div>

            {/* STATUS */}

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle size={16} />
                Status
              </div>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                  purchaseReturn.status
                )}`}
              >
                {getStatusIcon(
                  purchaseReturn.status
                )}

                {purchaseReturn.status}
              </span>
            </div>

            {/* LOCATION */}

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={16} />
                Location
              </div>

              <p className="font-semibold text-gray-900">
                {purchaseReturn.locationId
                  ? String(
                      purchaseReturn.locationId
                    )
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            REASON
        ===================================================== */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Return Reason
            </h2>
          </div>

          <div className="p-6">
            {purchaseReturn.reason ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {purchaseReturn.reason}
              </p>
            ) : (
              <p className="text-sm italic text-gray-400">
                No reason provided.
              </p>
            )}
          </div>
        </div>

        {/* =====================================================
            RETURN ITEMS
        ===================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Returned Items
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {purchaseReturn.items?.length || 0}{" "}
                product(s)
              </p>
            </div>

            <Package
              size={22}
              className="text-gray-400"
            />
          </div>

          {/* DESKTOP */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                  <th className="px-6 py-3">
                    #
                  </th>

                  <th className="px-6 py-3">
                    Product
                  </th>

                  <th className="px-6 py-3">
                    Product Code
                  </th>

                  <th className="px-6 py-3 text-right">
                    Quantity
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {purchaseReturn.items?.map(
                  (item, index) => (
                    <tr
                      key={
                        item.id ??
                        `${item.productId}-${index}`
                      }
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">

                          <div className="rounded-lg bg-gray-100 p-2">
                            <Package
                              size={17}
                              className="text-gray-500"
                            />
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product
                                ?.productName ||
                                item.product
                                  ?.name ||
                                "Unknown Product"}
                            </p>

                            <p className="text-xs text-gray-500">
                              ID:{" "}
                              {item.productId}
                            </p>
                          </div>

                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.product
                          ?.productCode || "-"}
                      </td>

                      <td className="px-6 py-4 text-right">

                        <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                          {item.quantity}
                        </span>

                      </td>
                    </tr>
                  )
                )}

              </tbody>
            </table>
          </div>

          {/* MOBILE */}

          <div className="divide-y divide-gray-100 md:hidden">

            {purchaseReturn.items?.map(
              (item, index) => (
                <div
                  key={
                    item.id ??
                    `${item.productId}-${index}`
                  }
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3">

                      <div className="rounded-lg bg-gray-100 p-2">
                        <Package
                          size={18}
                          className="text-gray-500"
                        />
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">
                          {item.product
                            ?.productName ||
                            item.product?.name ||
                            "Unknown Product"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.product
                            ?.productCode ||
                            item.productId}
                        </p>
                      </div>

                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Quantity
                      </p>

                      <p className="font-bold text-blue-700">
                        {item.quantity}
                      </p>
                    </div>

                  </div>
                </div>
              )
            )}

          </div>

          {/* EMPTY */}

          {(!purchaseReturn.items ||
            purchaseReturn.items.length === 0) && (
            <div className="px-6 py-12 text-center">

              <Package
                size={40}
                className="mx-auto mb-3 text-gray-300"
              />

              <p className="text-sm text-gray-500">
                No return items found.
              </p>

            </div>
          )}
        </div>

        {/* =====================================================
            STATUS INFORMATION
        ===================================================== */}

        {isCancelled && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5">

            <XCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h3 className="font-semibold text-red-800">
                Purchase Return Cancelled
              </h3>

              <p className="mt-1 text-sm text-red-700">
                This purchase return has been cancelled
                and can no longer be edited or completed.
              </p>
            </div>

          </div>
        )}

        {isCompleted && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">

            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0 text-green-600"
            />

            <div>
              <h3 className="font-semibold text-green-800">
                Purchase Return Completed
              </h3>

              <p className="mt-1 text-sm text-green-700">
                This purchase return has been completed.
              </p>
            </div>

          </div>
        )}

        {isPending && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

            <Clock3
              size={22}
              className="mt-0.5 shrink-0 text-yellow-600"
            />

            <div>
              <h3 className="font-semibold text-yellow-800">
                Purchase Return Pending
              </h3>

              <p className="mt-1 text-sm text-yellow-700">
                This return is still pending. You can
                edit or cancel it.
              </p>
            </div>

          </div>
        )}

        {/* =====================================================
            FOOTER ACTIONS
        ===================================================== */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

          <Link
            href="/dashboard/purchasing/returns"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Returns
          </Link>

          {isPending && (
            <>
              <Link
                href={`/dashboard/purchasing/returns/${purchaseReturn.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Pencil size={17} />
                Edit Return
              </Link>

              <button
                type="button"
                onClick={handleCancelReturn}
                disabled={cancelling}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban size={17} />
                    Cancel Return
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}