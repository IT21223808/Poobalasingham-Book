"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import { financeService, PaymentMethod, SupplierPayment } from "@/services/finance.service";

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseInvoiceId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: "",
    paymentMethod: "CASH" as PaymentMethod,
    reference: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getSupplierPayments({ search: search || undefined });
      setPayments(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load supplier payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.purchaseInvoiceId) return setError("Supplier ID and Invoice ID are required.");
    const amount = Number(formData.amount);
    if (!amount || amount <= 0) return setError("Valid payment amount required.");

    try {
      setSubmitting(true);
      setError(null);
      await financeService.createSupplierPayment({
        supplierId: Number(formData.supplierId),
        purchaseInvoiceId: Number(formData.purchaseInvoiceId),
        paymentDate: formData.paymentDate,
        amount,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
      });

      setIsAddOpen(false);
      setFormData({ supplierId: "", purchaseInvoiceId: "", paymentDate: new Date().toISOString().slice(0, 10), amount: "", paymentMethod: "CASH", reference: "", notes: "" });
      setSuccessMsg("Supplier payment recorded successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchPayments();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `Rs. ${(amount || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Supplier Payments</h2>
          <p className="text-xs text-gray-500">Log of all payments made to suppliers for purchase invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPayments} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition">
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle className="h-4 w-4" /><span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4" /><span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by payment number, supplier, invoice, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPayments()}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs focus:border-blue-500 focus:outline-none" />
        </div>
        <button onClick={fetchPayments} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
          Search
        </button>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Payment #</th>
                <th className="px-5 py-3.5">Payment Date</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Invoice</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5 text-right text-emerald-700">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {payments && payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/75 transition">
                    <td className="px-5 py-3 font-semibold text-gray-900">{p.paymentNumber}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{p.paymentDate}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{p.supplier?.supplierName || `Supplier #${p.supplierId}`}</td>
                    <td className="px-5 py-3 text-gray-700">{p.purchaseInvoice?.invoiceNumber || `Invoice #${p.purchaseInvoiceId}`}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">{p.paymentMethod}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.reference || "—"}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(Number(p.amount))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No supplier payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Record Supplier Payment</h3>
              <button onClick={() => { setIsAddOpen(false); setError(null); }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
              💡 Tip: For better workflow, use the <strong>Accounts Payable</strong> page to pay directly against specific invoices with outstanding balance calculation.
            </p>
            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Supplier ID *</label>
                  <input type="number" required placeholder="Supplier ID" value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Invoice ID *</label>
                  <input type="number" required placeholder="Purchase Invoice ID" value={formData.purchaseInvoiceId}
                    onChange={(e) => setFormData({ ...formData, purchaseInvoiceId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Payment Date *</label>
                <input type="date" required value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Amount (Rs.) *</label>
                  <input type="number" step="0.01" min="0.01" required placeholder="0.00" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs font-semibold focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Method *</label>
                  <select value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs bg-white focus:border-blue-500 focus:outline-none">
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Reference</label>
                <input type="text" placeholder="Optional reference" value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} placeholder="Optional notes" value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => { setIsAddOpen(false); setError(null); }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? "Processing..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
