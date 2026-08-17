"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  PackageX,
  RefreshCw,
  Search,
  ChevronRight,
} from "lucide-react";

import {
  getProducts,
  Product,
} from "@/services/product.service";

export default function OutOfStockPage() {
  const [products, setProducts] = useState<Product[]>(
    [],
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ======================================================
  // LOAD PRODUCTS
  // ======================================================

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();

      setProducts(data);
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ======================================================
  // OUT OF STOCK PRODUCTS
  // ======================================================

  const outOfStockProducts = useMemo(() => {
    return products.filter(
      (product) =>
        Number(product.stockQuantity ?? 0) === 0,
    );
  }, [products]);

  // ======================================================
  // SEARCH
  // ======================================================

  const filteredProducts = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return outOfStockProducts;
    }

    return outOfStockProducts.filter(
      (product) => {
        return (
          product.productName
            .toLowerCase()
            .includes(value) ||
          product.productCode
            .toLowerCase()
            .includes(value) ||
          product.barcode
            ?.toLowerCase()
            .includes(value) ||
          product.isbn
            ?.toLowerCase()
            .includes(value)
        );
      },
    );
  }, [outOfStockProducts, search]);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading out-of-stock products...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-6">

        {/* BREADCRUMB */}

        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">

          <Link
            href="/dashboard/inventory"
            className="transition hover:text-blue-600"
          >
            Inventory
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-900">
            Out of Stock
          </span>

        </div>

        {/* TITLE */}

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <PackageX size={22} />
              </div>

              <div>

                <h1 className="text-3xl font-bold text-slate-900">
                  Out of Stock
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Products that currently have zero stock.
                </p>

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <AlertCircle size={18} />

          <span>{error}</span>

        </div>
      )}

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Out of Stock Products
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {outOfStockProducts.length}
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <PackageX size={21} />
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500">
                Products in System
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {products.length}
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <PackageX size={21} />
            </div>

          </div>

        </div>

      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search product by name, code, barcode or ISBN..."
            className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        </div>

      </div>

      {/* ==================================================
          PRODUCT TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <div>

            <h2 className="font-semibold text-slate-900">
              Out-of-Stock Products
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Products requiring stock replenishment
            </p>

          </div>

          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            {filteredProducts.length} Products
          </span>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px] text-sm">

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                <th className="px-5 py-3 font-medium">
                  Product
                </th>

                <th className="px-5 py-3 font-medium">
                  Product Code
                </th>

                <th className="px-5 py-3 font-medium">
                  Barcode
                </th>

                <th className="px-5 py-3 font-medium">
                  Category
                </th>

                <th className="px-5 py-3 font-medium">
                  Reorder Level
                </th>

                <th className="px-5 py-3 text-right font-medium">
                  Stock
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredProducts.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center"
                  >

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                      <PackageX
                        size={21}
                        className="text-emerald-600"
                      />
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {search
                        ? "No matching out-of-stock products."
                        : "No out-of-stock products."}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {search
                        ? "Try a different search term."
                        : "All products currently have available stock."}
                    </p>

                  </td>

                </tr>

              ) : (

                filteredProducts.map(
                  (product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >

                      {/* PRODUCT */}

                      <td className="px-5 py-4">

                        <div>

                          <p className="font-medium text-slate-800">
                            {
                              product.productName
                            }
                          </p>

                          {product.author && (
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                product.author
                              }
                            </p>
                          )}

                        </div>

                      </td>

                      {/* CODE */}

                      <td className="px-5 py-4 text-slate-600">
                        {
                          product.productCode
                        }
                      </td>

                      {/* BARCODE */}

                      <td className="px-5 py-4 text-slate-500">
                        {product.barcode ||
                          "—"}
                      </td>

                      {/* CATEGORY */}

                      <td className="px-5 py-4 text-slate-600">
                        {
                          product.category
                            ?.name || "—"
                        }
                      </td>

                      {/* REORDER */}

                      <td className="px-5 py-4 text-slate-600">
                        {Number(
                          product.reorderLevel ??
                            0,
                        )}
                      </td>

                      {/* STOCK */}

                      <td className="px-5 py-4 text-right">

                        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                          0
                        </span>

                      </td>

                    </tr>
                  ),
                )

              )}

            </tbody>

          </table>

        </div>

        {/* FOOTER */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">

          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View Products
            <ChevronRight size={16} />
          </Link>

          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Inventory
          </Link>

        </div>

      </div>

    </div>
  );
}