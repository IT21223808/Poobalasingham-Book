"use client";

import {
  Boxes,
  AlertTriangle,
  XCircle,
  Wallet,
} from "lucide-react";

interface InventoryStatusProps {
  totalStock: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
}

export default function InventoryStatus({
  totalStock,
  lowStock,
  outOfStock,
  stockValue,
}: InventoryStatusProps) {
  const formatCurrency = (
    value: number,
  ) => {
    return `Rs. ${Number(
      value || 0,
    ).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Boxes size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Inventory Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current inventory overview
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
        {/* Total Stock */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <Boxes size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Total Stock
            </span>
          </div>

          <p className="text-2xl font-bold text-blue-600">
            {Number(
              totalStock || 0,
            ).toLocaleString("en-LK")}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Units currently available
          </p>
        </div>

        {/* Low Stock */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <AlertTriangle size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Low Stock
            </span>
          </div>

          <p className="text-2xl font-bold text-amber-600">
            {Number(
              lowStock || 0,
            ).toLocaleString("en-LK")}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Books need restocking
          </p>
        </div>

        {/* Out of Stock */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <XCircle size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Out of Stock
            </span>
          </div>

          <p className="text-2xl font-bold text-red-600">
            {Number(
              outOfStock || 0,
            ).toLocaleString("en-LK")}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Books currently unavailable
          </p>
        </div>

        {/* Stock Value */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <Wallet size={17} />

            <span className="text-xs font-medium uppercase tracking-wide">
              Stock Value
            </span>
          </div>

          <p className="text-xl font-bold text-purple-600">
            {formatCurrency(stockValue)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Based on purchase price
          </p>
        </div>
      </div>
    </div>
  );
}