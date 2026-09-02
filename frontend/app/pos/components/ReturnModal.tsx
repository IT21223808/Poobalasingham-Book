"use client";

import { useState } from "react";
import { SaleInvoice, ReturnResponse } from "@/types/pos";
import posService from "@/services/pos.service";
import { X, RotateCcw, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReturnModal({ isOpen, onClose }: ReturnModalProps) {
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [saleInvoice, setSaleInvoice] = useState<SaleInvoice | null>(null);

  // Return item selection state: productId -> returnQty
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("Customer Return");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnResult, setReturnResult] = useState<ReturnResponse | null>(null);

  if (!isOpen) return null;

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceQuery.trim()) {
      toast.error("Please enter an invoice number.");
      return;
    }

    setIsSearching(true);
    setSaleInvoice(null);
    setReturnResult(null);
    try {
      const invoice = await posService.getSaleById(invoiceQuery.trim());
      setSaleInvoice(invoice);
      // Initialize return quantities to 0
      const initialMap: Record<string, number> = {};
      invoice.items.forEach((item) => {
        initialMap[item.productId] = 0;
      });
      setReturnQtyMap(initialMap);
    } catch (err: any) {
      console.error("Invoice search failed:", err);
      toast.error("Invoice not found. Please check invoice number.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleQtyChange = (productId: string, val: number, maxQty: number) => {
    const validQty = Math.max(0, Math.min(val, maxQty));
    setReturnQtyMap((prev) => ({
      ...prev,
      [productId]: validQty,
    }));
  };

  const calculateReturnTotal = (): number => {
    if (!saleInvoice) return 0;
    return saleInvoice.items.reduce((sum, item) => {
      const returnQty = returnQtyMap[item.productId] || 0;
      return sum + returnQty * Number(item.unitPrice);
    }, 0);
  };

  const handleSubmitReturn = async () => {
    if (!saleInvoice) return;

    const returnItems = Object.entries(returnQtyMap)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const orig = saleInvoice.items.find((i) => i.productId === productId);
        return {
          productId,
          quantity,
          refundUnitPrice: Number(orig?.unitPrice || 0),
        };
      });

    if (returnItems.length === 0) {
      toast.error("Please select at least one item to return.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await posService.processReturn({
        saleId: saleInvoice.id,
        reason: reason.trim() || "Customer Return",
        items: returnItems,
      });

      setReturnResult(res);
      toast.success(`Return processed successfully! Return #${res.returnNumber}`);
    } catch (err: any) {
      console.error("Return processing failed:", err);
      toast.error(err.response?.data?.message || "Failed to process return.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">POS Sales Return</h3>
              <p className="text-xs text-slate-500 font-medium">
                Search invoice & restore inventory items
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Invoice Bar */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <form onSubmit={handleSearchInvoice} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                placeholder="Enter Invoice Number (e.g. INV-20260831-0001)..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>Search Invoice</span>
            </button>
          </form>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {returnResult ? (
            /* RETURN COMPLETED RECEIPT */
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800">Return Completed</h4>
                <p className="text-xs font-mono font-bold text-purple-700 mt-0.5">
                  Return Record #{returnResult.returnNumber}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Original Invoice #{returnResult.invoiceNumber}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-left border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Total Refund Amount:</span>
                  <span className="text-emerald-700">
                    Rs. {Number(returnResult.totalReturnAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Return Reason:</span>
                  <span>{returnResult.reason}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Inventory Status:</span>
                  <span className="text-emerald-600 font-bold">✓ Returned items restored to stock</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setReturnResult(null);
                  setSaleInvoice(null);
                  setInvoiceQuery("");
                }}
                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700"
              >
                Process Another Return
              </button>
            </div>
          ) : saleInvoice ? (
            /* INVOICE ITEM RETURN SELECTION */
            <div className="space-y-4">
              {/* Sale Info Summary */}
              <div className="flex items-center justify-between rounded-xl bg-purple-50 p-3 text-xs border border-purple-100">
                <div>
                  <p className="font-bold text-purple-900">{saleInvoice.invoiceNumber}</p>
                  <p className="text-[11px] text-purple-700">
                    Customer: {saleInvoice.customerName || "Walk-in"} • Date: {new Date(saleInvoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right font-extrabold text-purple-900">
                  Total: Rs. {Number(saleInvoice.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Select Items to Return:</p>
                {saleInvoice.items.map((item) => {
                  const currentReturnQty = returnQtyMap[item.productId] || 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-500">
                          Sold Qty: {item.quantity} • Unit Price: Rs.{Number(item.unitPrice).toFixed(2)}
                        </p>
                      </div>

                      {/* Return Qty Control */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-semibold">Return Qty:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={currentReturnQty}
                          onChange={(e) =>
                            handleQtyChange(item.productId, parseInt(e.target.value, 10) || 0, item.quantity)
                          }
                          className="w-16 rounded-lg border border-slate-200 py-1 text-center font-bold text-slate-800 outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reason input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Return
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Damaged cover, incorrect edition, customer changed mind..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-purple-600"
                />
              </div>

              {/* Total Refund calculation */}
              <div className="flex items-center justify-between rounded-xl bg-slate-900 p-3.5 text-white">
                <span className="text-xs font-bold">Total Calculated Refund</span>
                <span className="text-base font-extrabold text-emerald-400">
                  Rs. {calculateReturnTotal().toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Action */}
              <button
                type="button"
                disabled={isSubmitting || calculateReturnTotal() <= 0}
                onClick={handleSubmitReturn}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-extrabold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}
                <span>CONFIRM RETURN & RESTORE STOCK</span>
              </button>
            </div>
          ) : (
            <div className="flex h-36 flex-col items-center justify-center text-center text-slate-400">
              <RotateCcw size={32} className="text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Enter an invoice number above to inspect original sale items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
