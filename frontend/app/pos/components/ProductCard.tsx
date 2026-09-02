"use client";

import { useState } from "react";
import { Product } from "@/services/product.service";
import { BookOpen } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  inCartQty?: number;
}

export const getProductImageUrl = (url?: string): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") || "http://localhost:5000";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ProductCard({
  product,
  onAddToCart,
  inCartQty = 0,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = (product.stockQuantity ?? 0) <= 0;
  const sellingPrice = Number(product.sellingPrice || 0);
  const imageUrl = getProductImageUrl(product.imageUrl);

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onAddToCart(product)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-white p-4 text-left transition-all duration-200 shadow-2xs ${
        isOutOfStock
          ? "cursor-not-allowed border-slate-200 opacity-60"
          : "border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-[0.98]"
      }`}
    >
      {/* Stock badge */}
      <div className="absolute right-3 top-3 z-10">
        {isOutOfStock ? (
          <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
            Out of Stock
          </span>
        ) : (
          <span
            className={`rounded-md px-2.5 py-1 text-sm font-bold ${
              (product.stockQuantity ?? 0) <= 5
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-100 text-emerald-900"
            }`}
          >
            Stock: {product.stockQuantity}
          </span>
        )}
      </div>

      {/* Cart quantity badge */}
      {inCartQty > 0 && (
        <div className="absolute left-3 top-3 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-black text-white shadow-sm border border-white">
          {inCartQty}
        </div>
      )}

      {/* Image container */}
      <div className="relative flex h-36 w-full items-center justify-center rounded-lg bg-slate-50 overflow-hidden mb-3">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={product.productName}
            onError={() => setImageError(true)}
            className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <BookOpen size={44} className="text-slate-300" />
            <span className="mt-1 text-xs font-semibold text-slate-400">No Image</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-slate-900 group-hover:text-blue-700">
            {product.productName}
          </h3>
          <p className="mt-1 text-sm font-mono text-slate-500 truncate">
            {product.productCode} {product.barcode ? `• ${product.barcode}` : ""}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-2xl font-bold text-blue-700">
            Rs. {sellingPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm font-medium text-slate-400">
            {product.category?.name || "General"}
          </span>
        </div>
      </div>
    </button>
  );
}
