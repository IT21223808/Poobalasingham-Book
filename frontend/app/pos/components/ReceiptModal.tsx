"use client";

import { SaleInvoice } from "@/types/pos";
import { X, Printer, PlusCircle, CheckCircle2 } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleInvoice: SaleInvoice | null;
  onNewSale: () => void;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  saleInvoice,
  onNewSale,
}: ReceiptModalProps) {
  if (!isOpen || !saleInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      {/* Container */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header - Screen only */}
        <div className="print:hidden flex items-center justify-between border-b border-slate-100 bg-emerald-50/70 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={22} className="text-emerald-600" />
            <div>
              <h3 className="text-sm font-extrabold text-emerald-900">Sale Successfully Completed</h3>
              <p className="text-[11px] font-mono font-semibold text-emerald-700">
                Invoice #{saleInvoice.invoiceNumber}
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

        {/* PRINTABLE RECEIPT SECTION */}
        <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-xs text-slate-900 bg-white" id="receipt-print-area">
          {/* Receipt Store Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
              Poobalasingham Book Depot
            </h2>
            <p className="text-[11px] text-slate-600 font-sans">Main Branch • Colombo, Sri Lanka</p>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Tel: +94 11 234 5678</p>
          </div>

          {/* Receipt Meta */}
          <div className="py-2.5 space-y-0.5 border-b border-dashed border-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice No:</span>
              <span className="font-bold">{saleInvoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{new Date(saleInvoice.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{saleInvoice.cashierId || "Admin User"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span>{saleInvoice.customerName || "Walk-in Customer"}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 pb-1 border-b border-slate-200">
              <span>Item</span>
              <span>Qty x Price</span>
              <span>Total</span>
            </div>
            <div className="space-y-2 pt-2">
              {saleInvoice.items.map((item) => (
                <div key={item.id} className="text-[11px]">
                  <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                  <div className="flex justify-between text-slate-600 pt-0.5">
                    <span>
                      {item.quantity} x Rs. {Number(item.unitPrice).toFixed(2)}
                    </span>
                    <span className="font-bold text-slate-900">
                      Rs. {Number(item.lineTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>Rs. {Number(saleInvoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(saleInvoice.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span>-Rs. {Number(saleInvoice.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>GRAND TOTAL:</span>
              <span>Rs. {Number(saleInvoice.grandTotal).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-300">
            <p className="font-bold text-slate-700">Payment Breakdown:</p>
            {saleInvoice.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-slate-600">
                <span>
                  {p.paymentMethod} {p.referenceNumber ? `(${p.referenceNumber})` : ""}
                </span>
                <span className="font-semibold text-slate-800">
                  Rs. {Number(p.amount).toFixed(2)}
                </span>
              </div>
            ))}
            {saleInvoice.payments.find((p) => p.paymentMethod === "CASH")?.amountReceived != null && (
              <>
                <div className="flex justify-between text-slate-500 pt-1">
                  <span>Cash Received:</span>
                  <span>
                    Rs. {Number(saleInvoice.payments.find((p) => p.paymentMethod === "CASH")?.amountReceived).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Change Returned:</span>
                  <span>
                    Rs. {Number(saleInvoice.payments.find((p) => p.paymentMethod === "CASH")?.changeAmount || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Footer message */}
          <div className="text-center pt-4 pb-1 text-[10px] text-slate-500">
            <p className="font-bold text-slate-800">Thank you for shopping with us!</p>
            <p className="mt-0.5">Please retain this receipt for any return or exchange within 7 days.</p>
          </div>
        </div>

        {/* Footer Actions - Screen only */}
        <div className="print:hidden flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600"
          >
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNewSale();
              onClose();
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-blue-700"
          >
            <PlusCircle size={16} />
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
}
