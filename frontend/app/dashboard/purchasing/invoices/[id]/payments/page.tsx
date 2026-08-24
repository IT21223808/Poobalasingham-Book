"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  Receipt,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   TYPES
========================================================= */

type Payment = {
  id: number;
  purchaseInvoiceId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
};

type PaymentData = {
  invoiceId: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  payments: Payment[];
};

/* =========================================================
   PAGE
========================================================= */

export default function PurchaseInvoicePaymentsPage() {
  const params = useParams();

  const invoiceId = params?.id
    ? Number(params.id)
    : NaN;

  /* =======================================================
     STATE
  ======================================================= */

  const [data, setData] =
    useState<PaymentData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date()
      .toISOString()
      .split("T")[0],
    paymentMethod: "CASH",
    referenceNumber: "",
    notes: "",
  });

  /* =======================================================
     LOAD PAYMENT DATA
  ======================================================= */

  const loadPayments = useCallback(async () => {
    if (!invoiceId || Number.isNaN(invoiceId)) {
      setError("Invalid invoice ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/purchasing/invoices/${invoiceId}/payments`,
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
                "Failed to load payments"
        );
      }

      /*
        Some APIs return:

        {
          data: {
            invoiceId: 1,
            ...
          }
        }

        Others return the object directly.
      */

      const paymentData =
        result?.data || result;

      setData(paymentData);
    } catch (err) {
      console.error(
        "Load payments error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load payment information"
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  /* =======================================================
     CREATE PAYMENT
  ======================================================= */

  const handleCreatePayment = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    if (
      data &&
      amount > Number(data.balanceAmount)
    ) {
      alert(
        `Payment cannot exceed the outstanding balance of Rs. ${formatAmount(
          data.balanceAmount
        )}`
      );
      return;
    }

    try {
      setSaving(true);

      const token =
        localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/purchasing/invoices/${invoiceId}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            amount,
            paymentDate:
              form.paymentDate,
            paymentMethod:
              form.paymentMethod,
            referenceNumber:
              form.referenceNumber.trim() ||
              undefined,
            notes:
              form.notes.trim() ||
              undefined,
          }),
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
                "Failed to create payment"
        );
      }

      /* Reset form */

      setForm({
        amount: "",
        paymentDate: new Date()
          .toISOString()
          .split("T")[0],
        paymentMethod: "CASH",
        referenceNumber: "",
        notes: "",
      });

      setShowForm(false);

      /* Reload latest payment data */

      await loadPayments();

      alert("Payment recorded successfully.");
    } catch (err) {
      console.error(
        "Create payment error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to create payment"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE PAYMENT
  ======================================================= */

  const handleDeletePayment = async (
    paymentId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this payment?"
      );

    if (!confirmed) return;

    try {
      setDeletingId(paymentId);

      const token =
        localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/purchasing/invoices/${invoiceId}/payments/${paymentId}`,
        {
          method: "DELETE",
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
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
                "Failed to delete payment"
        );
      }

      await loadPayments();

      alert("Payment deleted successfully.");
    } catch (err) {
      console.error(
        "Delete payment error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete payment"
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatAmount = (
    amount: number | string
  ) => {
    return Number(amount || 0).toLocaleString(
      "en-LK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const formatDate = (
    date?: string | null
  ) => {
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
  };

  const formatStatus = (
    status?: string
  ) => {
    if (!status) return "—";

    return status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const formatPaymentMethod = (
    method?: string
  ) => {
    if (!method) return "—";

    return method
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getStatusClass = (
    status?: string
  ) => {
    switch (
      status?.toUpperCase()
    ) {
      case "PAID":
        return "bg-green-50 text-green-700 border-green-200";

      case "PARTIALLY_PAID":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "UNPAID":
        return "bg-red-50 text-red-700 border-red-200";

      case "CANCELLED":
        return "bg-gray-100 text-gray-600 border-gray-200";

      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="rounded-xl border border-gray-200 bg-white px-8 py-7 text-center shadow-sm">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-4 text-sm font-medium text-gray-700">
              Loading payment information...
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Please wait
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">

          <Link
            href={`/dashboard/purchasing/invoices/${invoiceId}`}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Invoice
          </Link>

          <div className="rounded-xl border border-red-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle
                size={25}
                className="text-red-500"
              />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Unable to load payments
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadPayments}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const paymentStatus =
    data.paymentStatus?.toUpperCase();

  const canRecordPayment =
    Number(data.balanceAmount) > 0 &&
    paymentStatus !== "CANCELLED";

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">

      <div className="w-full space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">

          <div>

            <Link
              href={`/dashboard/purchasing/invoices/${invoiceId}`}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back to Invoice
            </Link>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                <CreditCard
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div>

                <h1 className="text-2xl font-semibold text-gray-900">
                  Payment Tracking
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Track payments and outstanding balance for invoice{" "}
                  <span className="font-medium text-gray-700">
                    #{data.invoiceId}
                  </span>
                </p>

              </div>
            </div>
          </div>

          <button
            onClick={() =>
              setShowForm(!showForm)
            }
            disabled={!canRecordPayment}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {showForm ? (
              <>
                <X size={17} />
                Close
              </>
            ) : (
              <>
                <Plus size={17} />
                Record Payment
              </>
            )}
          </button>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Invoice Total */}

          <SummaryCard
            title="Invoice Total"
            value={`Rs. ${formatAmount(
              data.grandTotal
            )}`}
            icon={
              <Receipt
                size={19}
                className="text-blue-600"
              />
            }
            iconBg="bg-blue-50"
            valueClass="text-gray-900"
          />

          {/* Paid */}

          <SummaryCard
            title="Paid Amount"
            value={`Rs. ${formatAmount(
              data.paidAmount
            )}`}
            icon={
              <CheckCircle2
                size={19}
                className="text-green-600"
              />
            }
            iconBg="bg-green-50"
            valueClass="text-green-600"
          />

          {/* Balance */}

          <SummaryCard
            title="Outstanding"
            value={`Rs. ${formatAmount(
              data.balanceAmount
            )}`}
            icon={
              <Clock3
                size={19}
                className="text-orange-600"
              />
            }
            iconBg="bg-orange-50"
            valueClass="text-orange-600"
          />

          {/* Status */}

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <WalletCards size={18} />
              Payment Status
            </div>

            <div className="mt-4">

              <span
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusClass(
                  data.paymentStatus
                )}`}
              >
                {formatStatus(
                  data.paymentStatus
                )}
              </span>

            </div>
          </div>

        </div>

        {/* =================================================
            PAYMENT PROGRESS
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-base font-semibold text-gray-900">
                Payment Progress
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Amount paid against the invoice total
              </p>

            </div>

            <p className="text-sm font-semibold text-gray-700">
              {data.grandTotal > 0
                ? Math.min(
                    100,
                    (Number(
                      data.paidAmount
                    ) /
                      Number(
                        data.grandTotal
                      )) *
                      100
                  ).toFixed(0)
                : 0}
              % Paid
            </p>

          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${
                  data.grandTotal > 0
                    ? Math.min(
                        100,
                        (Number(
                          data.paidAmount
                        ) /
                          Number(
                            data.grandTotal
                          )) *
                          100
                      )
                    : 0
                }%`,
              }}
            />

          </div>

          <div className="mt-3 flex justify-between text-xs text-gray-500">

            <span>
              Paid: Rs.{" "}
              {formatAmount(
                data.paidAmount
              )}
            </span>

            <span>
              Balance: Rs.{" "}
              {formatAmount(
                data.balanceAmount
              )}
            </span>

          </div>

        </div>

        {/* =================================================
            PAYMENT FORM
        ================================================= */}

        {showForm && canRecordPayment && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-6 py-5">

              <h2 className="text-lg font-semibold text-gray-900">
                Record New Payment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the payment details for this invoice.
              </p>

            </div>

            <form
              onSubmit={handleCreatePayment}
              className="p-6"
            >

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Amount */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Amount <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      Rs.
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={data.balanceAmount}
                      value={form.amount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          amount:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-11 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="0.00"
                      required
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-gray-500">
                    Outstanding balance:{" "}
                    <span className="font-medium text-orange-600">
                      Rs.{" "}
                      {formatAmount(
                        data.balanceAmount
                      )}
                    </span>
                  </p>

                </div>

                {/* Date */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Payment Date{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="date"
                      value={
                        form.paymentDate
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          paymentDate:
                            e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />

                  </div>

                </div>

                {/* Payment Method */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Payment Method{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      form.paymentMethod
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentMethod:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="CASH">
                      Cash
                    </option>

                    <option value="CARD">
                      Card
                    </option>

                    <option value="BANK_TRANSFER">
                      Bank Transfer
                    </option>

                    <option value="CHEQUE">
                      Cheque
                    </option>
                  </select>

                </div>

                {/* Reference */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    value={
                      form.referenceNumber
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        referenceNumber:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="PAY-00003"
                  />

                </div>

                {/* Notes */}

                <div className="md:col-span-2">

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Notes
                  </label>

                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes:
                          e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Add payment notes..."
                  />

                </div>

              </div>

              {/* Buttons */}

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Save Payment
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-6 py-5">

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Payment History
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  All payments recorded against this invoice
                </p>

              </div>

              <div className="text-sm text-gray-500">
                {data.payments.length}{" "}
                {data.payments.length === 1
                  ? "payment"
                  : "payments"}
              </div>

            </div>

          </div>

          {/* No payments */}

          {data.payments.length === 0 ? (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                <CreditCard
                  size={25}
                  className="text-gray-400"
                />
              </div>

              <h3 className="mt-4 font-medium text-gray-900">
                No payments recorded
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Record the first payment for this invoice.
              </p>

              {canRecordPayment && (
                <button
                  onClick={() =>
                    setShowForm(true)
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Record Payment
                </button>
              )}

            </div>
          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-sm">

                <thead className="bg-gray-50">

                  <tr className="border-b border-gray-200">

                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment
                    </th>

                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Method
                    </th>

                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reference
                    </th>

                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>

                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {data.payments.map(
                    (payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* Payment */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                              <CreditCard
                                size={17}
                                className="text-blue-600"
                              />
                            </div>

                            <div>

                              <p className="font-medium text-gray-900">
                                Payment #
                                {
                                  payment.id
                                }
                              </p>

                              {payment.notes && (
                                <p className="mt-1 max-w-xs truncate text-xs text-gray-400">
                                  {
                                    payment.notes
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* Date */}

                        <td className="px-6 py-4 text-gray-600">

                          <div className="flex items-center gap-2">

                            <CalendarDays
                              size={15}
                              className="text-gray-400"
                            />

                            {formatDate(
                              payment.paymentDate
                            )}

                          </div>

                        </td>

                        {/* Method */}

                        <td className="px-6 py-4">

                          <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {formatPaymentMethod(
                              payment.paymentMethod
                            )}
                          </span>

                        </td>

                        {/* Reference */}

                        <td className="px-6 py-4 text-gray-600">

                          {payment.referenceNumber ? (
                            <span className="font-medium text-gray-700">
                              {
                                payment.referenceNumber
                              }
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              —
                            </span>
                          )}

                        </td>

                        {/* Amount */}

                        <td className="px-6 py-4 text-right">

                          <span className="font-semibold text-gray-900">
                            Rs.{" "}
                            {formatAmount(
                              payment.amount
                            )}
                          </span>

                        </td>

                        {/* Delete */}

                        <td className="px-6 py-4 text-right">

                          <button
                            onClick={() =>
                              handleDeletePayment(
                                payment.id
                              )
                            }
                            disabled={
                              deletingId ===
                              payment.id
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete payment"
                          >

                            {deletingId ===
                            payment.id ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={17}
                              />
                            )}

                          </button>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

                {/* Total */}

                <tfoot>

                  <tr className="border-t border-gray-200 bg-gray-50">

                    <td
                      colSpan={4}
                      className="px-6 py-4 text-right font-semibold text-gray-700"
                    >
                      Total Paid
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      Rs.{" "}
                      {formatAmount(
                        data.paidAmount
                      )}
                    </td>

                    <td />

                  </tr>

                </tfoot>

              </table>

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
  icon,
  iconBg,
  valueClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2 text-sm text-gray-500">
          {title}
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>

      </div>

      <p
        className={`mt-3 text-xl font-semibold ${valueClass}`}
      >
        {value}
      </p>

    </div>
  );
}