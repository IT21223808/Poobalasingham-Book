"use client";

import { useState } from "react";
import { Product } from "@/services/product.service";
import { BookOpen } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  inCartQty?: number;
}

export const getProductImageUrl = (
  url?: string,
): string | null => {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
      "/api",
      "",
    ) || "http://localhost:5000";

  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ProductCard({
  product,
  onAddToCart,
  inCartQty = 0,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const isOutOfStock =
    (product.stockQuantity ?? 0) <= 0;

  const sellingPrice = Number(
    product.sellingPrice || 0,
  );

  const imageUrl = getProductImageUrl(
    product.imageUrl,
  );

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onAddToCart(product)}
      className={`group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border bg-white p-3 text-left shadow-2xs transition-all duration-200 sm:p-4 ${
        isOutOfStock
          ? "cursor-not-allowed border-slate-200 opacity-60"
          : "border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-[0.98]"
      }`}
    >
      {/* =================================================
          STOCK BADGE
      ================================================= */}
      <div className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
        {isOutOfStock ? (
          <span className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700 sm:text-xs">
            Out of Stock
          </span>
        ) : (
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold sm:px-2.5 sm:text-sm ${
              (product.stockQuantity ?? 0) <= 5
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-100 text-emerald-900"
            }`}
          >
            Stock: {product.stockQuantity}
          </span>
        )}
      </div>

      {/* =================================================
          CART QUANTITY
      ================================================= */}
      {inCartQty > 0 && (
        <div className="absolute left-2 top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full border border-white bg-blue-600 px-1.5 text-xs font-black text-white shadow-sm sm:left-3 sm:top-3">
          {inCartQty}
        </div>
      )}

      {/* =================================================
          IMAGE
      ================================================= */}
      <div className="relative mb-3 flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-50 sm:h-36">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={product.productName}
            onError={() => setImageError(true)}
            className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <BookOpen
              size={40}
              className="text-slate-300 sm:h-11 sm:w-11"
            />

            <span className="mt-1 text-xs font-semibold text-slate-400">
              No Image
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          DETAILS
      ================================================= */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          {/* Product Name */}
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-700 sm:text-lg">
            {product.productName}
          </h3>

          {/* Product Code */}
          <p className="mt-1 break-words font-mono text-xs leading-5 text-slate-500 sm:text-sm">
            {product.productCode}
          </p>

          {/* Barcode */}
          {product.barcode && (
            <p className="break-all font-mono text-xs leading-5 text-slate-500 sm:text-sm">
              Barcode: {product.barcode}
            </p>
          )}
        </div>

        {/* =================================================
            PRICE + CATEGORY
        ================================================= */}
        <div className="mt-3 flex min-w-0 items-end justify-between gap-2 border-t border-slate-100 pt-3">
          {/* Price */}
          <span className="min-w-0 truncate text-lg font-bold text-blue-700 sm:text-2xl">
            Rs.{" "}
            {sellingPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </span>

          {/* Category */}
          <span className="max-w-[45%] shrink-0 text-right text-xs font-medium leading-4 text-slate-400 sm:text-sm">
            {product.category?.name || "General"}
          </span>
        </div>
      </div>
    </button>
  );
}