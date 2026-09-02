"use client";

import { Product } from "@/services/product.service";
import { PosCartItem } from "@/types/pos";
import ProductCard from "./ProductCard";
import { PackageSearch } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  cartItems: PosCartItem[];
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export default function ProductGrid({
  products,
  cartItems,
  onAddToCart,
  isLoading = false,
}: ProductGridProps) {
  const getCartQty = (productId: string): number => {
    const item = cartItems.find((ci) => ci.productId === productId);
    return item ? item.quantity : 0;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse h-56"
          >
            <div className="h-28 w-full rounded-lg bg-slate-100 mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-1/3 rounded bg-slate-100 mt-3" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
          <PackageSearch size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-700">No products found</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-xs">
          Try searching with a different product name, code, barcode or select another category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          inCartQty={getCartQty(product.id)}
        />
      ))}
    </div>
  );
}
