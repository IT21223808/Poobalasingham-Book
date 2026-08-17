"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import {physicalStockCount} from "@/services/inventory.service";
import {getProducts,Product} from "@/services/product.service";

export default function PhysicalStockCountPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const [search, setSearch] = useState("");
  const [physicalQuantity, setPhysicalQuantity] = useState("");
  const [note, setNote] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) => product.id === selectedProductId,
    );
  }, [products, selectedProductId]);

  const systemStock = selectedProduct?.stockQuantity ?? 0;

  const physicalStock =
    physicalQuantity === ""
      ? null
      : Number(physicalQuantity);

  const difference =
    physicalStock === null
      ? 0
      : physicalStock - systemStock;

  // ============================================
  // LOAD PRODUCTS
  // ============================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");

        const data = await getProducts();

        setProducts(data);
      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load products.",
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // ============================================
  // FILTER PRODUCTS
  // ============================================

  const filteredProducts = products.filter((product) => {
    const value = search.toLowerCase();

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

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (physicalQuantity === "") {
      setError("Please enter the physical quantity.");
      return;
    }

    const quantity = Number(physicalQuantity);

    if (!Number.isInteger(quantity)) {
      setError("Physical quantity must be a whole number.");
      return;
    }

    if (quantity < 0) {
      setError("Physical quantity cannot be negative.");
      return;
    }

    if (!selectedProduct) {
      setError("Selected product was not found.");
      return;
    }

    const confirmed = window.confirm(
      `Apply physical stock count for "${selectedProduct.productName}"?\n\n` +
        `System Stock: ${systemStock}\n` +
        `Physical Stock: ${quantity}\n` +
        `Difference: ${quantity - systemStock}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await physicalStockCount({
        productId: selectedProductId,
        physicalQuantity: quantity,
        note: note.trim() || undefined,
      });

      setSuccess(
        response?.message ||
          "Physical stock count applied successfully.",
      );

      // Update product stock locally
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === selectedProductId
            ? {
                ...product,
                stockQuantity:
                  response?.data?.newStock ?? quantity,
              }
            : product,
        ),
      );

      setPhysicalQuantity("");
      setNote("");
    } catch (err: any) {
      console.error(err);

      const apiMessage =
        err?.response?.data?.message;

      if (Array.isArray(apiMessage)) {
        setError(apiMessage.join(", "));
      } else {
        setError(
          apiMessage ||
            err?.message ||
            "Failed to apply physical stock count.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // RESET
  // ============================================

  const handleReset = () => {
    setSelectedProductId("");
    setSearch("");
    setPhysicalQuantity("");
    setNote("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ========================================
          BREADCRUMB
      ======================================== */}

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/inventory"
            className="transition hover:text-blue-600"
          >
            Inventory
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-900">
            Physical Stock Count
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Physical Stock Count
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Compare physical stock with system stock and update
          inventory.
        </p>
      </div>

      {/* ========================================
          ALERTS
      ======================================== */}

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="font-medium text-emerald-800">
              Success
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {success}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="font-medium text-red-800">
              Error
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ========================================
          MAIN CARD
      ======================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}

        <div className="flex items-center gap-4 border-b border-slate-100 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardCheck size={24} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Physical Count
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the actual quantity counted in the store.
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* ====================================
              PRODUCT SEARCH
          ==================================== */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search Product
            </label>

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
                placeholder="Search by product name, code or barcode..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* ====================================
              PRODUCT SELECT
          ==================================== */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Product
            </label>

            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(
                  e.target.value,
                );
                setPhysicalQuantity("");
                setError("");
                setSuccess("");
              }}
              disabled={loadingProducts}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                {loadingProducts
                  ? "Loading products..."
                  : "Select a product"}
              </option>

              {filteredProducts.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.productCode} -{" "}
                  {product.productName}{" "}
                  (Stock: {product.stockQuantity ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* ====================================
              PRODUCT INFO
          ==================================== */}

          {selectedProduct && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Package size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Product
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedProduct.productName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {selectedProduct.productCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                  System Stock
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {systemStock}
                </p>

                <p className="mt-1 text-xs text-blue-600">
                  Current quantity in system
                </p>
              </div>
            </div>
          )}

          {/* ====================================
              PHYSICAL QUANTITY
          ==================================== */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Physical Count
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={physicalQuantity}
              onChange={(e) =>
                setPhysicalQuantity(
                  e.target.value,
                )
              }
              placeholder="Enter counted quantity"
              disabled={!selectedProduct}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {/* ====================================
              DIFFERENCE PREVIEW
          ==================================== */}

          {selectedProduct &&
            physicalQuantity !== "" && (
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-4 text-sm font-semibold text-slate-700">
                  Stock Count Preview
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      System Stock
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {systemStock}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Physical Stock
                    </p>

                    <p className="mt-1 text-xl font-bold text-blue-600">
                      {physicalStock}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Difference
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        difference > 0
                          ? "text-emerald-600"
                          : difference < 0
                            ? "text-red-600"
                            : "text-slate-600"
                      }`}
                    >
                      {difference > 0
                        ? `+${difference}`
                        : difference}
                    </p>
                  </div>
                </div>

                {difference === 0 && (
                  <p className="mt-4 text-sm text-emerald-600">
                    Physical count matches the system stock.
                  </p>
                )}

                {difference < 0 && (
                  <p className="mt-4 text-sm text-red-600">
                    Physical stock is lower than system stock.
                  </p>
                )}

                {difference > 0 && (
                  <p className="mt-4 text-sm text-emerald-600">
                    Physical stock is higher than system stock.
                  </p>
                )}
              </div>
            )}

          {/* ====================================
              NOTE
          ==================================== */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Note
              <span className="ml-1 font-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <textarea
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              rows={4}
              placeholder="Enter any notes about the physical count..."
              disabled={!selectedProduct}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {/* ====================================
              ACTIONS
          ==================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                loadingProducts ||
                !selectedProduct
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Applying...
                </>
              ) : (
                <>
                  <ClipboardCheck size={17} />
                  Submit Count
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BACK */}

      <div className="mt-5">
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Inventory
        </Link>
      </div>
    </div>
  );
}