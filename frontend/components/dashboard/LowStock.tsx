"use client";

import { AlertTriangle } from "lucide-react";

interface LowStockBook {
  id: string | number;
  productCode?: string;
  productName?: string;
  stockQuantity?: number;
  reorderLevel?: number;
}

interface LowStockProps {
  products: LowStockBook[];
}

export default function LowStock({
  products,
}: LowStockProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <AlertTriangle
              className="text-amber-500"
              size={22}
            />

            Low Stock Books
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Books that require restocking.
          </p>
        </div>
      </div>

      <div className="divide-y">
        {products.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No low stock books.
          </div>
        ) : (
          products.map((product) => {
            const stock = Number(
              product.stockQuantity ?? 0,
            );

            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-5 hover:bg-slate-50"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {product.productName ??
                      "Unknown Product"}
                  </h3>

                  <p className="text-sm text-slate-500">
                    Product ID : #{product.id}
                  </p>

                  {product.productCode && (
                    <p className="text-xs text-slate-400">
                      Code: {product.productCode}
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">
                  {stock} Left
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}