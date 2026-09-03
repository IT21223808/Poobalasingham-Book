"use client";

import { useState, useEffect } from "react";
import { PaymentMethod, PosPaymentDetail, CreateSalePayload, SaleInvoice } from "@/types/pos";
import { PosCartItem } from "@/types/pos";
import { Customer } from "@/services/customer.service";
import posService from "@/services/pos.service";
import {
  X,
  Banknote,
  CreditCard,
  QrCode,
  Layers,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: PosCartItem[];
  customer: Customer | null;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  heldBillId?: string;
  locationId?: string | null;
  onSaleSuccess: (saleInvoice: SaleInvoice) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  customer,
  subtotal,
  discountAmount,
  grandTotal,
  heldBillId,
  locationId,
  onSaleSuccess,
}: PaymentModalProps) {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | "MULTIPLE">("CASH");

  // Cash state
  const [cashReceived, setCashReceived] = useState<string>("");
  const [cashRef, setCashRef] = useState<string>("");

  // Card state
  const [cardRef, setCardRef] = useState<string>("");

  // QR state
  const [qrRef, setQrRef] = useState<string>("");

  // Multiple mode state
  const [multiCash, setMultiCash] = useState<string>("0");
  const [multiCard, setMultiCard] = useState<string>("0");
  const [multiQr, setMultiQr] = useState<string>("0");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveMethod("CASH");
      setCashReceived(grandTotal.toString());
      setMultiCash(grandTotal.toString());
      setMultiCard("0");
      setMultiQr("0");
      setCashRef("");
      setCardRef("");
      setQrRef("");
      setIsLoading(false);
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const numCashReceived = parseFloat(cashReceived) || 0;
  const cashChange = numCashReceived >= grandTotal ? numCashReceived - grandTotal : 0;

  // Multiple mode totals calculation
  const numMultiCash = parseFloat(multiCash) || 0;
  const numMultiCard = parseFloat(multiCard) || 0;
  const numMultiQr = parseFloat(multiQr) || 0;
  const multiSum = numMultiCash + numMultiCard + numMultiQr;
  const multiRemaining = grandTotal - multiSum;

  const handleQuickCash = (extra: number) => {
    const nextVal = Math.ceil(grandTotal / 100) * 100 + extra;
    setCashReceived(nextVal.toString());
  };

  const handleCompleteSale = async () => {
    if (isLoading) return; // Prevent duplicate click
    if (cartItems.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    let payments: PosPaymentDetail[] = [];

    if (activeMethod === "CASH") {
      if (numCashReceived < grandTotal) {
        toast.error(`Insufficient cash. Minimum required: Rs. ${grandTotal.toFixed(2)}`);
        return;
      }
      payments = [
        {
          paymentMethod: "CASH",
          amount: grandTotal,
          amountReceived: numCashReceived,
          changeAmount: cashChange,
          referenceNumber: cashRef.trim() || undefined,
        },
      ];
    } else if (activeMethod === "CARD") {
      payments = [
        {
          paymentMethod: "CARD",
          amount: grandTotal,
          referenceNumber: cardRef.trim() || undefined,
        },
      ];
    } else if (activeMethod === "QR") {
      payments = [
        {
          paymentMethod: "QR",
          amount: grandTotal,
          referenceNumber: qrRef.trim() || undefined,
        },
      ];
    } else if (activeMethod === "MULTIPLE") {
      if (Math.abs(multiSum - grandTotal) > 0.01) {
        toast.error(
          `Allocated payment total (Rs. ${multiSum.toFixed(
            2,
          )}) must equal invoice total (Rs. ${grandTotal.toFixed(2)}).`,
        );
        return;
      }

      if (numMultiCash > 0) {
        payments.push({
          paymentMethod: "CASH",
          amount: numMultiCash,
        });
      }
      if (numMultiCard > 0) {
        payments.push({
          paymentMethod: "CARD",
          amount: numMultiCard,
          referenceNumber: cardRef.trim() || undefined,
        });
      }
      if (numMultiQr > 0) {
        payments.push({
          paymentMethod: "QR",
          amount: numMultiQr,
          referenceNumber: qrRef.trim() || undefined,
        });
      }
    }

    const payload: CreateSalePayload = {
      customerId: customer?.id || undefined,
      customerName: customer?.customerName || undefined,
      subtotal,
      discountAmount,
      grandTotal,
      locationId: locationId || undefined,
      items: cartItems.map((ci) => ({
        productId: ci.productId,
        productCode: ci.productCode,
        productName: ci.productName,
        barcode: ci.barcode || undefined,
        unitPrice: ci.unitPrice,
        quantity: ci.quantity,
        discountAmount: ci.discountAmount || 0,
        lineTotal: ci.lineTotal,
      })),
      payments,
      heldBillId,
    };

    setIsLoading(true);
    try {
      const saleInvoice = await posService.createSale(payload);
      toast.success(`Sale completed successfully! Invoice #${saleInvoice.invoiceNumber}`);
      onSaleSuccess(saleInvoice);
    } catch (err: any) {
      console.error("Sale completion failed:", err);
      const rawMsg = err.response?.data?.message;
      const errorMsg = Array.isArray(rawMsg)
        ? rawMsg.join(", ")
        : typeof rawMsg === "string"
        ? rawMsg
        : "Failed to process sale. Please check stock & payment details.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Checkout & Payment</h3>
            <p className="text-xs text-slate-500 font-semibold">
              Select payment method and confirm transaction
            </p>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Total Summary Header Box */}
          <div className="flex items-center justify-between rounded-2xl bg-blue-600 p-5 text-white shadow-md">
            <div>
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                Grand Total Payable
              </p>
              <p className="text-3xl font-black">
                Rs. {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right text-xs text-blue-100">
              <p className="font-extrabold">{cartItems.length} Cart Item(s)</p>
              <p className="font-semibold">{customer ? customer.customerName : "Walk-in Customer"}</p>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => setActiveMethod("CASH")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black transition ${
                activeMethod === "CASH"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Banknote size={18} />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMethod("CARD")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black transition ${
                activeMethod === "CARD"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard size={18} />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMethod("QR")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black transition ${
                activeMethod === "QR"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <QrCode size={18} />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMethod("MULTIPLE")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-black transition ${
                activeMethod === "MULTIPLE"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers size={18} />
              <span>Multiple</span>
            </button>
          </div>

          {/* CASH MODE */}
          {activeMethod === "CASH" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Cash Amount Received (Rs.)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-xl font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  autoFocus
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCashReceived(grandTotal.toString())}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-extrabold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  Exact (Rs.{grandTotal.toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCash(0)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-extrabold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  Rounded
                </button>
                <button
                  type="button"
                  onClick={() => setCashReceived((Math.ceil(grandTotal / 500) * 500 || 500).toString())}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-extrabold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  +Rs.500
                </button>
                <button
                  type="button"
                  onClick={() => setCashReceived((Math.ceil(grandTotal / 1000) * 1000 || 1000).toString())}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-extrabold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  +Rs.1000
                </button>
              </div>

              {/* Live Change Calculation Display */}
              <div className={`flex items-center justify-between rounded-2xl p-4 ${
                numCashReceived >= grandTotal
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-950"
                  : "bg-red-50 border border-red-200 text-red-950"
              }`}>
                <span className="text-xs font-extrabold">
                  {numCashReceived >= grandTotal ? "Balance Change to Return" : "Shortage Amount"}
                </span>
                <span className="text-xl font-black">
                  Rs. {numCashReceived >= grandTotal
                    ? cashChange.toLocaleString("en-US", { minimumFractionDigits: 2 })
                    : (grandTotal - numCashReceived).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* CARD MODE */}
          {activeMethod === "CARD" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-xs font-extrabold text-slate-700">Card Payment Confirmation</p>
                <p className="mt-1 text-base font-black text-blue-700">
                  Full Amount: Rs. {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Card Slip / Auth Reference No. (Optional)
                </label>
                <input
                  type="text"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  placeholder="e.g. SLIP-884920"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* QR MODE */}
          {activeMethod === "QR" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-center">
                <QrCode size={48} className="mx-auto text-blue-600 mb-2" />
                <p className="text-xs font-extrabold text-slate-700">LANKAQR / Digital Pay</p>
                <p className="mt-1 text-lg font-black text-blue-700">
                  Rs. {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Transaction Reference No. (Optional)
                </label>
                <input
                  type="text"
                  value={qrRef}
                  onChange={(e) => setQrRef(e.target.value)}
                  placeholder="e.g. QR-99201"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* MULTIPLE MODE */}
          {activeMethod === "MULTIPLE" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">Cash (Rs.)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={multiCash}
                    onChange={(e) => setMultiCash(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">Card (Rs.)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={multiCard}
                    onChange={(e) => setMultiCard(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">QR (Rs.)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={multiQr}
                    onChange={(e) => setMultiQr(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Split Summary */}
              <div className={`flex items-center justify-between rounded-2xl p-3.5 text-xs font-black ${
                Math.abs(multiRemaining) < 0.01
                  ? "bg-emerald-50 text-emerald-950 border border-emerald-200"
                  : "bg-amber-50 text-amber-950 border border-amber-200"
              }`}>
                <span>Total Allocated: Rs. {multiSum.toFixed(2)}</span>
                <span>
                  {Math.abs(multiRemaining) < 0.01
                    ? "✓ Fully Allocated"
                    : multiRemaining > 0
                    ? `Remaining: Rs. ${multiRemaining.toFixed(2)}`
                    : `Overpaid: Rs. ${Math.abs(multiRemaining).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading || (activeMethod === "CASH" && numCashReceived < grandTotal) || (activeMethod === "MULTIPLE" && Math.abs(multiRemaining) >= 0.01)}
              onClick={handleCompleteSale}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Invoice & Stock...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>COMPLETE SALE (F9)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
