
"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import {
  financeService,
  CustomerPayment,
  PaymentMethod,
} from "@/services/finance.service";

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    salesInvoiceId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: "",
    paymentMethod: "CASH" as PaymentMethod,
    reference: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // --------------------------------------------------
  // FETCH CUSTOMER PAYMENTS
  // --------------------------------------------------
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await financeService.getCustomerPayments({
        search: search || undefined,
      });

      setPayments(res.data || []);
    } catch (err: any) {
      console.error("Error fetching customer payments:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load customer payments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // --------------------------------------------------
  // CREATE CUSTOMER PAYMENT
  // --------------------------------------------------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      setError("Customer ID is required.");
      return;
    }

    const amount = Number(formData.amount);

    if (!amount || amount <= 0) {
      setError("Valid payment amount is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await financeService.createCustomerPayment({
        customerId: Number(formData.customerId),
        salesInvoiceId: formData.salesInvoiceId || undefined,
        paymentDate: formData.paymentDate,
        amount,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      });

      // Close modal
      setIsAddOpen(false);

      // Reset form
      setFormData({
        customerId: "",
        salesInvoiceId: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        amount: "",
        paymentMethod: "CASH",
        reference: "",
        notes: "",
      });

      // Success message
      setSuccessMsg("Customer payment recorded successfully!");

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);

      // Refresh table
      fetchPayments();
    } catch (err: any) {
      console.error("Error creating customer payment:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to record customer payment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // FORMAT CURRENCY
  // --------------------------------------------------
  const formatCurrency = (amount: number) =>
    `Rs. ${(Number(amount) || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // --------------------------------------------------
  // RESET / CLOSE MODAL
  // --------------------------------------------------
  const closeModal = () => {
    setIsAddOpen(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* --------------------------------------------------
          HEADER
      -------------------------------------------------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Customer Payments
          </h2>

          <p className="text-xs text-gray-500">
            Record and manage payments received from customers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />

            Refresh
          </button>

          {/* Add Payment */}
          <button
            onClick={() => {
              setError(null);
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            Record Payment
          </button>
        </div>
      </div>

      {/* --------------------------------------------------
          SUCCESS MESSAGE
      -------------------------------------------------- */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle className="h-4 w-4" />

          <span>{successMsg}</span>
        </div>
      )}

      {/* --------------------------------------------------
          ERROR MESSAGE
      -------------------------------------------------- */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4" />

          <span>{error}</span>
        </div>
      )}

      {/* --------------------------------------------------
          SEARCH
      -------------------------------------------------- */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

          <input
            type="text"
            placeholder="Search by payment number, customer, invoice, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchPayments();
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={fetchPayments}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* --------------------------------------------------
          PAYMENTS TABLE
      -------------------------------------------------- */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3.5">
                  Payment #
                </th>

                <th className="px-5 py-3.5">
                  Payment Date
                </th>

                <th className="px-5 py-3.5">
                  Customer
                </th>

                <th className="px-5 py-3.5">
                  Sales Invoice
                </th>

                <th className="px-5 py-3.5">
                  Method
                </th>

                <th className="px-5 py-3.5">
                  Reference
                </th>

                <th className="px-5 py-3.5 text-right text-emerald-700">
                  Amount Received
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />

                      Loading customer payments...
                    </div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr
                    key={p.id}
                    className="transition hover:bg-gray-50/75"
                  >
                    {/* Payment Number */}
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {p.paymentNumber}
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {p.paymentDate}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Users className="h-3.5 w-3.5" />
                        </div>

                        <div>
                          <div>
                            {p.customer?.customerName ||
                              `Customer #${p.customerId}`}
                          </div>

                          {p.customer?.customerCode && (
                            <div className="text-[10px] text-gray-400">
                              {p.customer.customerCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Sales Invoice */}
                    <td className="px-5 py-3 text-gray-700">
                      {p.salesInvoice?.invoiceNumber ||
                        p.salesInvoiceId ||
                        "—"}
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 font-medium ${
                          p.paymentMethod === "CASH"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>

                    {/* Reference */}
                    <td className="px-5 py-3 text-gray-500">
                      {p.reference || "—"}
                    </td>

                    {/* Amount */}
                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-emerald-600">
                      + {formatCurrency(Number(p.amount))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No customer payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------------------------------------
          ADD CUSTOMER PAYMENT MODAL
      -------------------------------------------------- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Record Customer Payment
                </h3>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Record money received from a customer
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Info */}
            <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              💡 For invoice-specific customer payments, enter the
              related Sales Invoice ID. Leave it empty for a general
              customer payment.
            </p>

            {/* Form */}
            <form
              onSubmit={handleCreate}
              className="mt-4 space-y-3 text-xs"
            >
              {/* Customer + Invoice */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Customer ID *
                  </label>

                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Customer ID"
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerId: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Sales Invoice ID
                  </label>

                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.salesInvoiceId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salesInvoiceId: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Payment Date *
                </label>

                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentDate: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Amount + Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Amount (Rs.) *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Method *
                  </label>

                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod:
                          e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank</option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Reference
                </label>

                <input
                  type="text"
                  placeholder="Receipt / transaction reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reference: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  rows={2}
                  placeholder="Optional notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Processing..."
                    : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}