"use client";

import { useState } from "react";
import { PosCartItem, SaleInvoice } from "@/types/pos";
import { Customer } from "@/services/customer.service";
import CartItem from "./CartItem";
import CustomerSelector from "./CustomerSelector";
import {
  ShoppingBag,
  PauseCircle,
  CheckCircle2,
  Tag,
  Trash2,
  Mail,
  Eye,
  Pause,
} from "lucide-react";

interface PosCartProps {
  cartItems: PosCartItem[];
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenNewCustomerModal: () => void;
  onUpdateQty: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  onOpenDiscountModal: () => void;
  onHoldBill: () => void;
  onOpenPaymentModal: () => void;
  onEmailReceipt: () => void;
  onViewReceipt: () => void;
  isHolding?: boolean;
}

export default function PosCart({
  cartItems,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onOpenNewCustomerModal,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  subtotal,
  discountAmount,
  grandTotal,
  onOpenDiscountModal,
  onHoldBill,
  onOpenPaymentModal,
  onEmailReceipt,
  onViewReceipt,
  isHolding = false,
}: PosCartProps) {
  const isCartEmpty = cartItems.length === 0;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearRequest = () => {
    if (isCartEmpty) return;
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    setShowClearConfirm(false);
    onClearCart();
  };

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      {/* ── 1. Cart Header ─────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">Current Sale</h2>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
            {cartItems.length}
          </span>
        </div>

        {/* Icon action row */}
        <div className="flex items-center gap-0.5">
          {/* Clear Cart */}
          <button
            type="button"
            onClick={handleClearRequest}
            disabled={isCartEmpty}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Clear Cart"
            title="Clear Cart"
          >
            <Trash2 size={14} />
          </button>

          {/* View Receipt */}
          <button
            type="button"
            onClick={onViewReceipt}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            aria-label="View Receipt"
            title="View Receipt"
          >
            <Eye size={14} />
          </button>

          {/* Email Receipt */}
          <button
            type="button"
            onClick={onEmailReceipt}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
            aria-label="Email Receipt"
            title="Email Receipt"
          >
            <Mail size={14} />
          </button>

          {/* Hold Bill */}
          <button
            type="button"
            onClick={onHoldBill}
            disabled={isCartEmpty || isHolding}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Hold Bill"
            title="Hold Bill (F8)"
          >
            <Pause size={14} />
          </button>
        </div>
      </div>

      {/* ── Clear Cart Confirm Banner ───────────────────── */}
      {showClearConfirm && (
        <div className="mx-4 mt-3 shrink-0 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <p className="text-sm font-bold text-red-800">Clear Cart?</p>
          <p className="mt-0.5 text-xs text-red-600">
            Remove all items from the current bill? This does not affect inventory.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClear}
              className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}

      {/* ── 2. Customer Section ────────────────────────── */}
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <CustomerSelector
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={onSelectCustomer}
          onOpenNewCustomerModal={onOpenNewCustomerModal}
        />
      </div>

      {/* ── 3. Scrollable Cart Items ───────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {isCartEmpty ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ShoppingBag size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-700">Cart is Empty</h3>
            <p className="mt-1 max-w-[200px] text-xs text-slate-400">
              Add products from the left panel to start billing
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {cartItems.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdateQty={onUpdateQty}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Bill Summary + Actions ─────────────────── */}
      <div className="shrink-0 space-y-3 border-t border-slate-200 bg-slate-50/90 p-4">
        {/* Summary rows */}
        <div className="space-y-2 text-base">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">
              Rs.{" "}
              {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <button
              type="button"
              onClick={onOpenDiscountModal}
              className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
            >
              <Tag size={15} />
              <span>Discount</span>
              {discountAmount > 0 && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                  Applied
                </span>
              )}
            </button>
            <span className="font-semibold text-emerald-700">
              -Rs.{" "}
              {discountAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Tax</span>
            <span>Rs. 0.00</span>
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
          <span className="text-2xl font-extrabold text-slate-900">TOTAL</span>
          <span className="text-4xl font-extrabold text-blue-700">
            Rs.{" "}
            {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* HOLD + CHARGE Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button
            type="button"
            disabled={isCartEmpty || isHolding}
            onClick={onHoldBill}
            className="flex h-14 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 text-base font-bold text-amber-900 transition hover:bg-amber-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PauseCircle size={20} />
            <span>HOLD (F8)</span>
          </button>

          <button
            type="button"
            disabled={isCartEmpty || grandTotal <= 0}
            onClick={onOpenPaymentModal}
            className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 text-xl font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 size={24} />
            <span>CHARGE (F9)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
