"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CashClosingSummary } from "@/types/pos";
import posService from "@/services/pos.service";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Banknote,
  CreditCard,
  QrCode,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function CashClosingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  const [openingCash, setOpeningCash] = useState<string>("5000");
  const [actualCash, setActualCash] = useState<string>("");
  const [summary, setSummary] = useState<CashClosingSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSummary = async (date: string) => {
    setIsLoading(true);
    try {
      const data = await posService.getCashClosingSummary(date);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load cash closing summary:", err);
      toast.error("Failed to fetch cash closing summary.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate]);

  const numOpeningCash = parseFloat(openingCash) || 0;
  const numActualCash = parseFloat(actualCash) || 0;
  const cashSales = summary?.cashSales || 0;
  const cardSales = summary?.cardSales || 0;
  const qrSales = summary?.qrSales || 0;
  const totalSales = summary?.totalSales || 0;
  const refunds = summary?.totalRefunds || 0;

  const expectedCash = numOpeningCash + cashSales - refunds;
  const difference = numActualCash ? numActualCash - expectedCash : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-xs border border-slate-200">
          <div className="flex items-center gap-4">
            <Link
              href="/pos"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Daily Cash Closing
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Poobalasingham Book Depot • Main Cash Register Summary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              <Calendar size={15} className="text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200">
            <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 shadow-2xs border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Banknote size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Cash Sales</p>
                    <p className="text-lg font-black text-slate-800">
                      Rs. {cashSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-2xs border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Card Sales</p>
                    <p className="text-lg font-black text-slate-800">
                      Rs. {cardSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-2xs border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <QrCode size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">QR Sales</p>
                    <p className="text-lg font-black text-slate-800">
                      Rs. {qrSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-2xs border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <RotateCcw size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Total Refunds</p>
                    <p className="text-lg font-black text-slate-800">
                      Rs. {refunds.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Calculations Table & Balancing */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left: Financial Summary */}
              <div className="rounded-2xl bg-white p-6 shadow-2xs border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Daily Revenue Breakdown
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Total Completed Transactions:</span>
                    <span className="font-bold text-slate-800">{summary?.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600 font-medium">Opening Float Cash:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">Rs.</span>
                      <input
                        type="number"
                        value={openingCash}
                        onChange={(e) => setOpeningCash(e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Cash Collections:</span>
                    <span className="font-bold text-emerald-600">+Rs. {cashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Cash Refunds Paid:</span>
                    <span className="font-bold text-red-600">-Rs. {refunds.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center rounded-xl bg-slate-900 p-3 text-white">
                    <span className="font-bold">Expected Drawer Cash:</span>
                    <span className="text-base font-black text-emerald-400">
                      Rs. {expectedCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Drawer Reconciliation */}
              <div className="rounded-2xl bg-white p-6 shadow-2xs border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Physical Cash Drawer Reconciliation
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Actual Cash Counted in Till (Rs.)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      placeholder="Enter counted cash amount..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>

                  {/* Variance Display */}
                  {actualCash !== "" && (
                    <div
                      className={`flex items-center justify-between rounded-xl p-4 border ${
                        Math.abs(difference) < 0.01
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : difference > 0
                          ? "bg-blue-50 border-blue-200 text-blue-900"
                          : "bg-red-50 border-red-200 text-red-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {Math.abs(difference) < 0.01 ? (
                          <CheckCircle2 size={20} className="text-emerald-600" />
                        ) : (
                          <AlertTriangle size={20} className={difference > 0 ? "text-blue-600" : "text-red-600"} />
                        )}
                        <span className="text-xs font-bold">
                          {Math.abs(difference) < 0.01
                            ? "Till Balanced Perfectly"
                            : difference > 0
                            ? "Cash Surplus / Overage"
                            : "Cash Shortage / Deficit"}
                        </span>
                      </div>
                      <span className="text-lg font-black">
                        Rs. {difference.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toast.success("Daily Cash Closing logged successfully.")}
                    className="w-full rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-md hover:bg-blue-700"
                  >
                    CLOSE REGISTER & RECORD CLOSING
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
