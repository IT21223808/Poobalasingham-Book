"use client";

import { SaleInvoice } from "@/types/pos";
import {
  X,
  Printer,
  PlusCircle,
  CheckCircle2,
  Mail,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleInvoice: SaleInvoice | null;
  onNewSale: () => void;

  /**
   * Optional email callback.
   * If provided, parent page handles the API call.
   */
  onEmailReceipt?: () => Promise<void> | void;

  /**
   * Customer email from the completed sale.
   * Pass this from POS page if available.
   */
  customerEmail?: string | null;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  saleInvoice,
  onNewSale,
  onEmailReceipt,
  customerEmail,
}: ReceiptModalProps) {
  const [isEmailing, setIsEmailing] = useState(false);

  if (!isOpen || !saleInvoice) return null;

  /* =========================================================
     SAFE HELPERS
  ========================================================= */

  const safeString = (value: unknown, fallback = ""): string => {
    if (value === null || value === undefined) {
      return fallback;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    // Prevent "Objects are not valid as a React child"
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;

      return (
        String(
          obj.name ??
            obj.fullName ??
            obj.username ??
            obj.email ??
            obj.id ??
            "",
        ) || fallback
      );
    }

    return fallback;
  };

  /* =========================================================
     CASHIER DISPLAY
  ========================================================= */

  const getCashierDisplay = () => {
    const cashier = saleInvoice.cashierId;

    if (!cashier) {
      return "Admin User";
    }

    if (typeof cashier === "string") {
      return cashier;
    }

    if (typeof cashier === "number") {
      return String(cashier);
    }

    if (typeof cashier === "object") {
      const cashierObject = cashier as Record<string, unknown>;

      return safeString(
        cashierObject.name ??
          cashierObject.fullName ??
          cashierObject.username ??
          cashierObject.email ??
          cashierObject.id,
        "Admin User",
      );
    }

    return "Admin User";
  };

  /* =========================================================
     CUSTOMER EMAIL
  ========================================================= */

  const resolvedCustomerEmail =
    customerEmail ||
    safeString(
      (saleInvoice as unknown as Record<string, unknown>).customerEmail,
      "",
    );

  const hasCustomerEmail =
    resolvedCustomerEmail.trim().length > 0;

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================================================
     EMAIL
  ========================================================= */

  const handleEmail = async () => {
    if (!onEmailReceipt) {
      return;
    }

    if (!hasCustomerEmail) {
      return;
    }

    try {
      setIsEmailing(true);

      await onEmailReceipt();
    } finally {
      setIsEmailing(false);
    }
  };

  /* =========================================================
     DATA
  ========================================================= */

  const cashPayment = saleInvoice.payments?.find(
    (p) => p.paymentMethod === "CASH",
  );

  const amountReceived =
    cashPayment?.amountReceived != null
      ? Number(cashPayment.amountReceived)
      : null;

  const changeAmount =
    cashPayment?.changeAmount != null
      ? Number(cashPayment.changeAmount)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      {/* =====================================================
          MODAL CONTAINER
      ===================================================== */}

      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ===================================================
            HEADER - SCREEN ONLY
        =================================================== */}

        <div className="print:hidden flex items-center justify-between border-b border-slate-100 bg-emerald-50/70 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={22}
              className="text-emerald-600"
            />

            <div>
              <h3 className="text-sm font-extrabold text-emerald-900">
                Sale Successfully Completed
              </h3>

              <p className="text-[11px] font-mono font-semibold text-emerald-700">
                Invoice #{safeString(saleInvoice.invoiceNumber)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close receipt"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===================================================
            PRINTABLE RECEIPT
        =================================================== */}

        <div
          id="receipt-print-area"
          className="max-h-[70vh] overflow-y-auto bg-white p-6 font-mono text-xs text-slate-900 print:max-h-none print:overflow-visible print:p-0"
        >
          {/* STORE HEADER */}

          <div className="border-b border-dashed border-slate-300 pb-3 text-center">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
              Poobalasingham Book Depot
            </h2>

            <p className="font-sans text-[11px] text-slate-600">
              Main Branch • Colombo, Sri Lanka
            </p>

            <p className="mt-0.5 font-sans text-[10px] text-slate-500">
              Tel: +94 11 234 5678
            </p>
          </div>

          {/* RECEIPT META */}

          <div className="space-y-0.5 border-b border-dashed border-slate-300 py-2.5 text-[11px]">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">
                Invoice No:
              </span>

              <span className="font-bold">
                {safeString(saleInvoice.invoiceNumber)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">
                Date/Time:
              </span>

              <span>
                {saleInvoice.createdAt
                  ? new Date(
                      saleInvoice.createdAt,
                    ).toLocaleString()
                  : "-"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">
                Cashier:
              </span>

              {/* IMPORTANT:
                  Never render cashier object directly.
              */}

              <span className="max-w-[220px] text-right font-semibold">
                {getCashierDisplay()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-500">
                Customer:
              </span>

              <span className="max-w-[220px] text-right">
                {safeString(
                  saleInvoice.customerName,
                  "Walk-in Customer",
                )}
              </span>
            </div>

            {hasCustomerEmail && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Email:
                </span>

                <span className="max-w-[220px] break-all text-right">
                  {resolvedCustomerEmail}
                </span>
              </div>
            )}
          </div>

          {/* ITEMS */}

          <div className="border-b border-dashed border-slate-300 py-3">
            <div className="flex justify-between gap-2 border-b border-slate-200 pb-1 text-[11px] font-bold text-slate-500">
              <span className="flex-1">
                Item
              </span>

              <span className="whitespace-nowrap">
                Qty × Price
              </span>

              <span className="whitespace-nowrap">
                Total
              </span>
            </div>

            <div className="space-y-2 pt-2">
              {saleInvoice.items?.map((item, index) => (
                <div
                  key={
                    item.id ||
                    `${item.productName}-${index}`
                  }
                  className="text-[11px]"
                >
                  <p className="font-bold text-slate-900">
                    {safeString(
                      item.productName,
                      "Unknown Product",
                    )}
                  </p>

                  <div className="flex justify-between gap-2 pt-0.5 text-slate-600">
                    <span>
                      {Number(item.quantity)} × Rs.{" "}
                      {Number(item.unitPrice).toFixed(2)}
                    </span>

                    <span className="font-bold text-slate-900">
                      Rs.{" "}
                      {Number(item.lineTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOTALS */}

          <div className="space-y-1 border-b border-dashed border-slate-300 py-2.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>

              <span>
                Rs.{" "}
                {Number(
                  saleInvoice.subtotal,
                ).toFixed(2)}
              </span>
            </div>

            {Number(saleInvoice.discountAmount) > 0 && (
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Discount:</span>

                <span>
                  -Rs.{" "}
                  {Number(
                    saleInvoice.discountAmount,
                  ).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-black text-slate-900">
              <span>GRAND TOTAL:</span>

              <span>
                Rs.{" "}
                {Number(
                  saleInvoice.grandTotal,
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* PAYMENT */}

          <div className="space-y-1 border-b border-dashed border-slate-300 py-2.5 text-[11px]">
            <p className="font-bold text-slate-700">
              Payment Breakdown:
            </p>

            {saleInvoice.payments?.map((p, index) => (
              <div
                key={p.id || `${p.paymentMethod}-${index}`}
                className="flex justify-between gap-3 text-slate-600"
              >
                <span>
                  {safeString(p.paymentMethod)}

                  {p.referenceNumber
                    ? ` (${safeString(
                        p.referenceNumber,
                      )})`
                    : ""}
                </span>

                <span className="font-semibold text-slate-800">
                  Rs. {Number(p.amount).toFixed(2)}
                </span>
              </div>
            ))}

            {amountReceived !== null && (
              <>
                <div className="flex justify-between pt-1 text-slate-500">
                  <span>Cash Received:</span>

                  <span>
                    Rs.{" "}
                    {amountReceived.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-slate-900">
                  <span>Change Returned:</span>

                  <span>
                    Rs.{" "}
                    {changeAmount.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}

          <div className="pb-1 pt-4 text-center text-[10px] text-slate-500">
            <p className="font-bold text-slate-800">
              Thank you for shopping with us!
            </p>

            <p className="mt-0.5">
              Please retain this receipt for any
              return or exchange within 7 days.
            </p>
          </div>
        </div>

        {/* ===================================================
            FOOTER ACTIONS - SCREEN ONLY
        =================================================== */}

        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          {/* PRINT */}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-blue-600"
          >
            <Printer size={16} />

            <span>
              Print / PDF
            </span>
          </button>

          {/* EMAIL */}

          {onEmailReceipt && (
            <button
              type="button"
              onClick={handleEmail}
              disabled={
                isEmailing ||
                !hasCustomerEmail
              }
              title={
                hasCustomerEmail
                  ? `Send receipt to ${resolvedCustomerEmail}`
                  : "Customer email is not available"
              }
              className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEmailing ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Mail size={16} />
              )}

              <span>
                {isEmailing
                  ? "Sending..."
                  : "Email Receipt"}
              </span>
            </button>
          )}

          {/* NEW SALE */}

          <button
            type="button"
            onClick={() => {
              onNewSale();
              onClose();
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-blue-700"
          >
            <PlusCircle size={16} />

            <span>
              New Sale
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================
          PRINT CSS
      ===================================================== */}

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 8mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible !important;
          }

          #receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          #receipt-print-area {
            font-size: 11px !important;
          }

          #receipt-print-area h2 {
            font-size: 15px !important;
          }

          #receipt-print-area p,
          #receipt-print-area span,
          #receipt-print-area div {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}