"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Calculator,
  Package,
  RefreshCw,
  Search,
  AlertTriangle,
} from "lucide-react";

import {
  getProducts,
  Product,
} from "@/services/product.service";

export default function StockValuationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // LOAD PRODUCTS
  // ========================================

  const loadProducts = async () => {
    try {
      setError("");

      const data = await getProducts();

      setProducts(data);
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Failed to load inventory valuation.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
  };

  // ========================================
  // FILTER PRODUCTS
  // ========================================

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.productName
          ?.toLowerCase()
          .includes(value) ||
        product.productCode
          ?.toLowerCase()
          .includes(value) ||
        product.barcode
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [products, search]);

  // ========================================
  // TOTAL VALUATION
  // ========================================

  const totalInventoryValue = useMemo(() => {
    return products.reduce((total, product) => {
      const stockQuantity = Number(
        product.stockQuantity ?? 0,
      );

      const purchasePrice = Number(
        product.purchasePrice ?? 0,
      );

      return (
        total +
        stockQuantity * purchasePrice
      );
    }, 0);
  }, [products]);

  // ========================================
  // TOTAL STOCK
  // ========================================

  const totalStock = useMemo(() => {
    return products.reduce((total, product) => {
      return (
        total +
        Number(product.stockQuantity ?? 0)
      );
    }, 0);
  }, [products]);

  // ========================================
  // PRODUCTS WITH VALUE
  // ========================================

  const productsWithValue = useMemo(() => {
    return products.filter(
      (product) =>
        Number(product.stockQuantity ?? 0) > 0,
    );
  }, [products]);

  // ========================================
  // CURRENCY FORMAT
  // ========================================

  const formatCurrency = (
    value: number,
  ) => {
    return new Intl.NumberFormat(
      "en-LK",
      {
        style: "currency",
        currency: "LKR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(value);
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />

            <p className="text-sm text-slate-500">
              Loading stock valuation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard/inventory"
              className="hover:text-blue-600"
            >
              Inventory
            </Link>

            <span>/</span>

            <span className="font-medium text-slate-900">
              Stock Valuation
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Stock Valuation
          </h1>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

      {/* ======================================== */}
      {/* HEADER + BREADCRUMB */}
      {/* ======================================== */}

      <div className="mb-8">

        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">

          <Link
            href="/dashboard/inventory"
            className="transition hover:text-blue-600"
          >
            Inventory
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-900">
            Stock Valuation
          </span>

        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calculator size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Stock Valuation
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Calculate the current inventory value using stock quantity and purchase price.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

      </div>

      {/* ======================================== */}
      {/* SUMMARY */}
      {/* ======================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL VALUE */}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-blue-700">
                Total Inventory Value
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-900">
                {formatCurrency(
                  totalInventoryValue,
                )}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
              <Calculator size={21} />
            </div>

          </div>

          <p className="mt-3 text-xs text-blue-600">
            Based on current stock and purchase price
          </p>

        </div>

        {/* TOTAL STOCK */}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-emerald-700">
                Total Stock Units
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-900">
                {totalStock.toLocaleString()}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
              <Boxes size={21} />
            </div>

          </div>

          <p className="mt-3 text-xs text-emerald-600">
            Total available units across products
          </p>

        </div>

        {/* PRODUCTS */}

        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-purple-700">
                Valued Products
              </p>

              <p className="mt-2 text-2xl font-bold text-purple-900">
                {productsWithValue.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-purple-600 shadow-sm">
              <Package size={21} />
            </div>

          </div>

          <p className="mt-3 text-xs text-purple-600">
            Products currently holding stock
          </p>

        </div>

      </div>

      {/* ======================================== */}
      {/* SEARCH */}
      {/* ======================================== */}

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

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
            placeholder="Search product by name, code or barcode..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        </div>

      </div>

      {/* ======================================== */}
      {/* TABLE */}
      {/* ======================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

          <div>
            <h2 className="font-semibold text-slate-900">
              Product Valuation
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Stock value calculated using purchase price
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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

                <th className="px-5 py-3 text-right font-medium">
                  Stock
                </th>

                <th className="px-5 py-3 text-right font-medium">
                  Purchase Price
                </th>

                <th className="px-5 py-3 text-right font-medium">
                  Stock Value
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredProducts.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center"
                  >

                    <Package className="mx-auto mb-3 h-9 w-9 text-slate-300" />

                    <p className="text-sm font-medium text-slate-700">
                      No products found
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Try changing your search.
                    </p>

                  </td>

                </tr>

              ) : (

                filteredProducts.map(
                  (product) => {

                    const stockQuantity =
                      Number(
                        product.stockQuantity ??
                          0,
                      );

                    const purchasePrice =
                      Number(
                        product.purchasePrice ??
                          0,
                      );

                    const stockValue =
                      stockQuantity *
                      purchasePrice;

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >

                        {/* PRODUCT */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <Package size={17} />
                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-medium text-slate-800">
                                {
                                  product.productName
                                }
                              </p>

                              {product.barcode && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {
                                    product.barcode
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* CODE */}

                        <td className="px-5 py-4 text-slate-600">
                          {
                            product.productCode
                          }
                        </td>

                        {/* STOCK */}

                        <td className="px-5 py-4 text-right">

                          {stockQuantity === 0 ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <AlertTriangle size={13} />
                              Out of Stock
                            </span>

                          ) : (

                            <span className="font-semibold text-slate-800">
                              {stockQuantity.toLocaleString()}
                            </span>

                          )}

                        </td>

                        {/* PURCHASE PRICE */}

                        <td className="px-5 py-4 text-right font-medium text-slate-600">
                          {formatCurrency(
                            purchasePrice,
                          )}
                        </td>

                        {/* STOCK VALUE */}

                        <td className="px-5 py-4 text-right">

                          <span className="font-semibold text-blue-700">
                            {formatCurrency(
                              stockValue,
                            )}
                          </span>

                        </td>

                      </tr>
                    );
                  },
                )

              )}

            </tbody>

            {/* TOTAL */}

            {filteredProducts.length > 0 && (
              <tfoot>

                <tr className="border-t-2 border-slate-200 bg-slate-50">

                  <td
                    colSpan={4}
                    className="px-5 py-4 text-right font-semibold text-slate-700"
                  >
                    Total Inventory Value
                  </td>

                  <td className="px-5 py-4 text-right text-lg font-bold text-blue-700">

                    {formatCurrency(
                      filteredProducts.reduce(
                        (total, product) => {
                          const stock =
                            Number(
                              product.stockQuantity ??
                                0,
                            );

                          const price =
                            Number(
                              product.purchasePrice ??
                                0,
                            );

                          return (
                            total +
                            stock * price
                          );
                        },
                        0,
                      ),
                    )}

                  </td>

                </tr>

              </tfoot>
            )}

          </table>

        </div>

      </div>

      {/* ======================================== */}
      {/* CALCULATION INFO */}
      {/* ======================================== */}

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Calculator size={18} />
          </div>

          <div>

            <h3 className="text-sm font-semibold text-slate-800">
              Valuation Calculation
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Inventory value is calculated as:
            </p>

            <p className="mt-2 rounded-lg bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              Stock Quantity × Purchase Price = Stock Value
            </p>

          </div>

        </div>

      </div>

      {/* ======================================== */}
      {/* BACK */}
      {/* ======================================== */}

      <div className="mt-5">

        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Inventory
        </Link>

      </div>

    </div>
  );
}