"use client";

import { PosCartItem } from "@/types/pos";
import { Plus, Minus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: PosCartItem;
  onUpdateQty: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
}

export default function CartItem({
  item,
  onUpdateQty,
  onRemoveItem,
}: CartItemProps) {
  const isMaxStock = item.quantity >= item.availableStock;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300">
      {/* Top Row: Product Title & Remove Trash */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-bold text-slate-900" title={item.productName}>
            {item.productName}
          </h4>
          <p className="text-sm font-mono text-slate-500">
            {item.productCode} {item.barcode ? `• ${item.barcode}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemoveItem(item.productId)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          title="Remove item"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Bottom Row: Qty Controls & Prices */}
      <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Quantity Controls (36px - 40px buttons) */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 p-1 shadow-2xs">
          <button
            type="button"
            disabled={item.quantity <= 1}
            onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-800 shadow-2xs transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
          >
            <Minus size={16} />
          </button>
          <span className="w-9 text-center font-mono text-base font-bold text-slate-900">
            {item.quantity}
          </span>
          <button
            type="button"
            disabled={isMaxStock}
            onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-800 shadow-2xs transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
            title={isMaxStock ? `Max available stock (${item.availableStock})` : "Increase quantity"}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Price & Line Total */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 font-medium">
            <span>
              Rs. {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            {item.discountAmount > 0 && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                -Rs.{item.discountAmount}
              </span>
            )}
          </div>
          <p className="text-base font-bold text-slate-900">
            Rs. {item.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
