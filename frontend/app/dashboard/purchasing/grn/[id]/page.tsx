"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  ShoppingCart,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import {
  purchasingService,
  GRN,
} from "@/services/purchasing.service";

export default function GRNViewPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [grn, setGrn] = useState<GRN | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // =========================================================
  // LOAD GRN
  // =========================================================

  useEffect(() => {
    const loadGRN = async () => {
      try {
        setLoading(true);

        const data = await purchasingService.getGRN(id);

        setGrn(data);
      } catch (error) {
        console.error("Failed to load GRN:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadGRN();
    }
  }, [id]);

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async () => {
    if (!grn) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${grn.grnNumber}?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await purchasingService.deleteGRN(grn.id);

      alert("GRN deleted successfully");

      router.push("/dashboard/purchasing/grn");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to delete GRN:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete GRN";

      if (Array.isArray(message)) {
        alert(message.join("\n"));
      } else {
        alert(message);
      }
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalProducts = grn?.items?.length || 0;

  const totalOrdered = useMemo(() => {
    return (
      grn?.items?.reduce(
        (total, item) =>
          total + Number(item.orderedQuantity || 0),
        0
      ) || 0
    );
  }, [grn]);

  const totalReceived = useMemo(() => {
    return (
      grn?.items?.reduce(
        (total, item) =>
          total + Number(item.receivedQuantity || 0),
        0
      ) || 0
    );
  }, [grn]);

  const remaining = Math.max(
    0,
    totalOrdered - totalReceived
  );

  const progress =
    totalOrdered > 0
      ? Math.min(
          100,
          Math.round(
            (totalReceived / totalOrdered) * 100
          )
        )
      : 0;

  // =========================================================
  // STATUS UI
  // =========================================================

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return "bg-green-50 text-green-700 border-green-200";

      case "PARTIAL":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "DRAFT":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading GRN...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!grn) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/purchasing/grn")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Goods Received
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Package
              size={40}
              className="mx-auto mb-4 text-slate-300"
            />

            <h2 className="font-semibold text-slate-900">
              GRN not found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The requested Goods Received Note could not be
              found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6">

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/purchasing/grn")
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Goods Received
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Package size={21} />
                </div>

                <div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {grn.grnNumber}
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Goods Received Note details
                  </p>

                </div>

              </div>

            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
                grn.status
              )}`}
            >
              <CheckCircle2 size={16} />
              {grn.status}
            </div>

          </div>
        </div>

        <div className="space-y-5">

          {/* ================================================= */}
          {/* GRN DETAILS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ShoppingCart size={18} />
                </div>

                <div>

                  <h2 className="font-semibold text-slate-900">
                    GRN Details
                  </h2>

                  <p className="text-xs text-slate-500">
                    Goods received note information
                  </p>

                </div>

              </div>

            </div>

            <div className="p-6">

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                {/* GRN NUMBER */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-500">
                    GRN Number
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {grn.grnNumber}
                  </p>

                </div>

                {/* PO */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-500">
                    Purchase Order
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    PO-
                    {String(
                      grn.purchaseOrderId
                    ).padStart(5, "0")}
                  </p>

                </div>

                {/* STATUS */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                      grn.status
                    )}`}
                  >
                    {grn.status}
                  </span>

                </div>

                {/* CREATED DATE */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-500">
                    Created Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {new Date(
                      grn.createdAt
                    ).toLocaleString()}
                  </p>

                </div>

                {/* LOCATION */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="flex items-center gap-2">

                    <MapPin
                      size={15}
                      className="text-slate-400"
                    />

                    <p className="text-xs text-slate-500">
                      Receiving Location
                    </p>

                  </div>

                  <p className="mt-1 font-medium text-slate-900">
                    Location
                  </p>

                  <p className="mt-1 break-all text-[11px] text-slate-400">
                    Location ID:{" "}
                    {grn.locationId || "N/A"}
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* RECEIVING SUMMARY */}
          {/* ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Receiving Summary
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {grn.grnNumber}
                </p>

              </div>

              <span className="text-sm font-semibold text-blue-600">
                {progress}% received
              </span>

            </div>

            {/* PROGRESS */}

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">

              <div
                className={`h-full rounded-full transition-all ${
                  grn.status === "CANCELLED"
                    ? "bg-red-500"
                    : grn.status === "PARTIAL"
                    ? "bg-orange-500"
                    : "bg-blue-600"
                }`}
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            {/* SUMMARY CARDS */}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

              {/* PRODUCTS */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Products
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {totalProducts}
                </p>

              </div>

              {/* ORDERED */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs text-slate-500">
                  Ordered
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {totalOrdered}
                </p>

              </div>

              {/* RECEIVED */}

              <div className="rounded-xl bg-green-50 p-4">

                <p className="text-xs text-green-600">
                  Received
                </p>

                <p className="mt-1 text-xl font-bold text-green-700">
                  {totalReceived}
                </p>

              </div>

              {/* REMAINING */}

              <div
                className={`rounded-xl p-4 ${
                  remaining === 0
                    ? "bg-green-50"
                    : "bg-orange-50"
                }`}
              >

                <p
                  className={`text-xs ${
                    remaining === 0
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  Remaining
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${
                    remaining === 0
                      ? "text-green-700"
                      : "text-orange-700"
                  }`}
                >
                  {remaining}
                </p>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* RECEIVED ITEMS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Received Items
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Products received against this purchase
                  order
                </p>

              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                {totalReceived} units received
              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px]">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Product
                    </th>

                    <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Ordered
                    </th>

                    <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Received
                    </th>

                    <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Remaining
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {grn.items?.map((item, index) => {

                    const ordered =
                      Number(
                        item.orderedQuantity || 0
                      );

                    const received =
                      Number(
                        item.receivedQuantity || 0
                      );

                    const itemRemaining =
                      Math.max(
                        0,
                        ordered - received
                      );

                    return (
                      <tr
                        key={
                          item.id ??
                          `${item.productId}-${index}`
                        }
                        className="transition hover:bg-slate-50/70"
                      >

                        {/* PRODUCT */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <Package size={18} />
                            </div>

                            <div>

                              <p className="font-medium text-slate-900">
                                {item.product
                                  ?.productName ||
                                  item.product?.name ||
                                  item.product
                                    ?.productCode ||
                                  item.productId}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Product ID:{" "}
                                {item.productId}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* ORDERED */}

                        <td className="px-4 py-5 text-center">

                          <span className="font-semibold text-slate-800">
                            {ordered}
                          </span>

                        </td>

                        {/* RECEIVED */}

                        <td className="px-4 py-5 text-center">

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">

                            <CheckCircle2 size={13} />

                            {received}

                          </span>

                        </td>

                        {/* REMAINING */}

                        <td className="px-4 py-5 text-center">

                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                              itemRemaining === 0
                                ? "bg-green-50 text-green-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {itemRemaining}
                          </span>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          </section>

          {/* ================================================= */}
          {/* STATUS MESSAGE */}
          {/* ================================================= */}

          {grn.status === "RECEIVED" && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">

              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-green-600"
              />

              <div>

                <p className="text-sm font-semibold text-green-800">
                  Purchase order fully received
                </p>

                <p className="mt-1 text-xs text-green-700">
                  All quantities recorded in this GRN have
                  been received successfully.
                </p>

              </div>

            </div>
          )}

          {grn.status === "PARTIAL" && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-orange-600"
              />

              <div>

                <p className="text-sm font-semibold text-orange-800">
                  Partial goods received
                </p>

                <p className="mt-1 text-xs text-orange-700">
                  Some quantities are still pending for this
                  purchase order.
                </p>

              </div>

            </div>
          )}

          {grn.status === "CANCELLED" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>

                <p className="text-sm font-semibold text-red-800">
                  GRN cancelled
                </p>

                <p className="mt-1 text-xs text-red-700">
                  This Goods Received Note has been
                  cancelled.
                </p>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* ACTIONS */}
          {/* ================================================= */}

          <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs text-slate-500">
                  GRN Status
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {grn.status}
                </p>

              </div>

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard/purchasing/grn"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={17} />
                  Back
                </button>

                {/* EDIT */}

                {grn.status !== "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/dashboard/purchasing/grn/${grn.id}/edit`
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Pencil size={17} />
                    Edit GRN
                  </button>
                )}

                {/* DELETE */}

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  {deleting
                    ? "Deleting..."
                    : "Delete GRN"}
                </button>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}