"use client";

import { useState, useEffect } from "react";
import { X, Tag, Percent, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currentDiscountAmount: number;
  onApplyDiscount: (amount: number, discountType: "fixed" | "percentage", value: number) => void;
}

export default function DiscountModal({
  isOpen,
  onClose,
  subtotal,
  currentDiscountAmount,
  onApplyDiscount,
}: DiscountModalProps) {
  const [type, setType] = useState<"fixed" | "percentage">("fixed");
  const [value, setValue] = useState<string>("0");

  useEffect(() => {
    if (isOpen) {
      setValue(currentDiscountAmount > 0 ? currentDiscountAmount.toString() : "0");
      setType("fixed");
    }
  }, [isOpen, currentDiscountAmount]);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(value) || 0;

    if (numericValue < 0) {
      toast.error("Discount value cannot be negative.");
      return;
    }

    let calculatedDiscount = 0;
    if (type === "percentage") {
      if (numericValue > 100) {
        toast.error("Percentage discount cannot exceed 100%.");
        return;
      }
      calculatedDiscount = (subtotal * numericValue) / 100;
    } else {
      calculatedDiscount = numericValue;
    }

    if (calculatedDiscount > subtotal) {
      toast.error(`Discount amount (Rs. ${calculatedDiscount.toFixed(2)}) cannot exceed subtotal (Rs. ${subtotal.toFixed(2)}).`);
      return;
    }

    onApplyDiscount(calculatedDiscount, type, numericValue);
    toast.success(`Discount of Rs. ${calculatedDiscount.toFixed(2)} applied.`);
    onClose();
  };

  const handleClearDiscount = () => {
    onApplyDiscount(0, "fixed", 0);
    toast.success("Discount cleared.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Tag size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Apply Bill Discount</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleApply} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500 font-medium">Cart Subtotal</p>
            <p className="text-lg font-extrabold text-slate-800">
              Rs. {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Discount Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Discount Type
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setType("fixed")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                  type === "fixed"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Fixed (Rs.)</span>
              </button>
              <button
                type="button"
                onClick={() => setType("percentage")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                  type === "percentage"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Percent size={14} />
                <span>Percentage (%)</span>
              </button>
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {type === "fixed" ? "Discount Amount (Rs.)" : "Discount Percentage (%)"}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "fixed" ? "100.00" : "10"}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              autoFocus
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 pt-1">
            {type === "percentage" ? (
              [5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setValue(pct.toString())}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {pct}%
                </button>
              ))
            ) : (
              [50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue(amt.toString())}
                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Rs.{amt}
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearDiscount}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100"
            >
              Clear Discount
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
