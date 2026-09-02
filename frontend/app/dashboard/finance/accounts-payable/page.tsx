"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle,
  DollarSign,
  Clock,
  Filter,
  Eye,
  CreditCard,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import {
  AccountsPayableItem,
  financeService,
  PaymentMethod,
  SupplierPayment,
} from "@/services/finance.service";

export default function AccountsPayablePage() {
  const [records, setRecords] = useState<AccountsPayableItem[]>([]);
  const [summary, setSummary] = useState({
    totalInvoiceAmount: 0,
    totalPaidAmount: 0,
    totalOutstanding: 0,
    totalOverdueAmount: 0,
    overdueCount: 0,
    invoiceCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pay Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AccountsPayableItem | null>(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    paymentMethod: "CASH" as PaymentMethod,
    reference: "",
    notes: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<AccountsPayableItem | null>(null);

  const fetchAP = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getAccountsPayable({
        search,
        status: statusFilter || undefined,
        overdueOnly,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setRecords(res.data.records || []);
      setSummary(res.data.summary || {
        totalInvoiceAmount: 0,
        totalPaidAmount: 0,
        totalOutstanding: 0,
        totalOverdueAmount: 0,
        overdueCount: 0,
        invoiceCount: 0,
      });
    } catch (err: any) {
      console.error("Error loading AP:", err);
      setError(err?.response?.data?.message || "Failed to load Accounts Payable.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, overdueOnly, startDate, endDate]);

  useEffect(() => {
    fetchAP();
  }, [statusFilter, overdueOnly]);

  const openPayModal = (record: AccountsPayableItem) => {
    setSelectedRecord(record);
    setPayForm({
      amount: String(record.outstanding),
      paymentMethod: "CASH",
      reference: "",
      notes: "",
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    setPayModalOpen(true);
  };

  const openHistoryModal = (record: AccountsPayableItem) => {
    setHistoryRecord(record);
    setHistoryModalOpen(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    const amount = Number(payForm.amount);
    if (!amount || amount <= 0) return setError("Payment amount must be greater than 0.");
    if (amount > selectedRecord.outstanding + 0.01)
      return setError(`Payment cannot exceed outstanding balance of Rs. ${selectedRecord.outstanding.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`);

    try {
      setSubmitting(true);
      setError(null);
      await financeService.createSupplierPayment({
        supplierId: selectedRecord.supplierId,
        purchaseInvoiceId: selectedRecord.id as number,
        paymentDate: payForm.paymentDate,
        amount,
        paymentMethod: payForm.paymentMethod,
        reference: payForm.reference || undefined,
        notes: payForm.notes || undefined,
      });

      setPayModalOpen(false);
      setSelectedRecord(null);
      setSuccessMsg(`Payment of Rs. ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })} recorded successfully!`);
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchAP();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `Rs. ${(amount || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (isOverdue) return <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">OVERDUE</span>;
    const map: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
      UNPAID: "bg-rose-50 text-rose-700 border-rose-200",
      PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
      PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
      CANCELLED: "bg-gray-200 text-gray-500 border-gray-300",
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${map[status] || "bg-gray-100 text-gray-600"}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Accounts Payable (AP)</h2>
          <p className="text-xs text-gray-500">Track outstanding balances owed to suppliers against purchase invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAP} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
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

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Invoiced</span>
          <h3 className="mt-1.5 text-lg font-bold text-gray-900">{formatCurrency(summary.totalInvoiceAmount)}</h3>
          <p className="text-[11px] text-gray-400">{summary.invoiceCount} invoices</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Paid</span>
          <h3 className="mt-1.5 text-lg font-bold text-emerald-600">{formatCurrency(summary.totalPaidAmount)}</h3>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Outstanding Balance</span>
          <h3 className="mt-1.5 text-lg font-bold text-rose-600">{formatCurrency(summary.totalOutstanding)}</h3>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Overdue</span>
            <Clock className="h-4 w-4 text-red-500" />
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-red-700">{formatCurrency(summary.totalOverdueAmount)}</h3>
          <p className="text-[11px] text-red-400">{summary.overdueCount} overdue invoices</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by supplier name, invoice number..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAP()}
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-700 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded border-gray-300 text-red-600" />
          Overdue Only
        </label>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-gray-500 whitespace-nowrap">From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50/50 px-2 py-1.5 text-xs focus:outline-none" />
          <label className="text-gray-500">To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50/50 px-2 py-1.5 text-xs focus:outline-none" />
        </div>
        <button onClick={fetchAP} className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          Apply
        </button>
      </div>

      {/* AP Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Invoice Date</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5 text-right">Invoice Amt</th>
                <th className="px-5 py-3.5 text-right text-emerald-700">Paid</th>
                <th className="px-5 py-3.5 text-right text-rose-700">Outstanding</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {records && records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className={`hover:bg-gray-50/75 transition ${r.isOverdue ? "bg-red-50/30" : ""}`}>
                    <td className="px-5 py-3 font-semibold text-gray-900">{r.invoiceNumber}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{r.supplierName}</div>
                      {r.supplierCode && <div className="text-[11px] text-gray-400">{r.supplierCode}</div>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-600">{r.invoiceDate}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={r.isOverdue ? "font-bold text-red-600" : "text-gray-600"}>
                        {r.dueDate || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">{formatCurrency(r.invoiceAmount)}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatCurrency(r.paidAmount)}</td>
                    <td className="px-5 py-3 text-right font-bold text-rose-600">{formatCurrency(r.outstanding)}</td>
                    <td className="px-5 py-3 text-center">{getStatusBadge(r.status, r.isOverdue)}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.outstanding > 0 && r.status !== "CANCELLED" && (
                          <button onClick={() => openPayModal(r)} title="Pay Now"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition">
                            <CreditCard className="h-3 w-3" />
                            Pay
                          </button>
                        )}
                        <button onClick={() => openHistoryModal(r)} title="Payment History"
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    No accounts payable records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {payModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Record Supplier Payment</h3>
              <button onClick={() => { setPayModalOpen(false); setError(null); }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>

            {/* Invoice Summary */}
            <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Supplier:</span>
                <span className="font-semibold text-gray-900">{selectedRecord.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice:</span>
                <span className="font-semibold text-gray-900">{selectedRecord.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Total:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedRecord.invoiceAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Already Paid:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedRecord.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-700">Outstanding:</span>
                <span className="font-bold text-rose-600">{formatCurrency(selectedRecord.outstanding)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Payment Date *</label>
                <input type="date" required value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Payment Amount (Max: {formatCurrency(selectedRecord.outstanding)}) *
                </label>
                <input type="number" step="0.01" min="0.01"
                  max={selectedRecord.outstanding}
                  required value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs font-semibold focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Payment Method *</label>
                <select value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs bg-white focus:border-blue-500 focus:outline-none">
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Reference / Cheque No.</label>
                <input type="text" placeholder="Optional reference"
                  value={payForm.reference}
                  onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} placeholder="Optional notes..."
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => { setPayModalOpen(false); setError(null); }}
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

      {/* History Modal */}
      {historyModalOpen && historyRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Payment History</h3>
                <p className="text-xs text-gray-500 mt-0.5">Invoice #{historyRecord.invoiceNumber} — {historyRecord.supplierName}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4">
              {historyRecord.payments && historyRecord.payments.length > 0 ? (
                <div className="space-y-2">
                  {historyRecord.payments.map((p: SupplierPayment) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{p.paymentNumber}</p>
                        <p className="text-gray-500">{p.paymentDate} · {p.paymentMethod}</p>
                        {p.reference && <p className="text-gray-400">Ref: {p.reference}</p>}
                      </div>
                      <span className="font-bold text-emerald-600">{formatCurrency(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-gray-400">No payments recorded for this invoice yet.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs">
              <div>
                <span className="text-gray-500">Total Paid: </span>
                <span className="font-bold text-emerald-600">{formatCurrency(historyRecord.paidAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500">Outstanding: </span>
                <span className="font-bold text-rose-600">{formatCurrency(historyRecord.outstanding)}</span>
              </div>
              <button onClick={() => setHistoryModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
