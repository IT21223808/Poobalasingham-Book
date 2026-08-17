"use client";

import { useEffect, useMemo, useState } from "react";
import {AlertCircle,CheckCircle2,Package,RefreshCw,Save,Search,ArrowLeft} from "lucide-react";
import {stockAdjustment,AdjustmentType,} from "@/services/inventory.service";
import {getProducts,Product,} from "@/services/product.service";
import Link from "next/link";

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [search, setSearch] = useState("");

  const [adjustmentType, setAdjustmentType] =
    useState<AdjustmentType>("INCREASE");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ======================================================
  // LOAD PRODUCTS
  // ======================================================

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      setErrorMessage("");

      const data = await getProducts();

      setProducts(data);
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to load products.",
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ======================================================
  // SELECTED PRODUCT
  // ======================================================

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        product.id === selectedProductId,
    );
  }, [products, selectedProductId]);

  // ======================================================
  // FILTER PRODUCTS
  // ======================================================

  const filteredProducts = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.productName
          .toLowerCase()
          .includes(value) ||
        product.productCode
          .toLowerCase()
          .includes(value) ||
        product.barcode
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [products, search]);

  // ======================================================
  // STOCK PREVIEW
  // ======================================================

  const currentStock =
    Number(selectedProduct?.stockQuantity ?? 0);

  const adjustmentQuantity =
    Number(quantity || 0);

  const newStock =
    adjustmentType === "INCREASE"
      ? currentStock + adjustmentQuantity
      : currentStock - adjustmentQuantity;

  // ======================================================
  // RESET
  // ======================================================

  const resetForm = () => {
    setSelectedProductId("");
    setSearch("");
    setAdjustmentType("INCREASE");
    setQuantity("");
    setReason("");
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    // Product validation
    if (!selectedProductId) {
      setErrorMessage(
        "Please select a product.",
      );
      return;
    }

    // Quantity validation
    if (!quantity || adjustmentQuantity <= 0) {
      setErrorMessage(
        "Quantity must be greater than 0.",
      );
      return;
    }

    // Prevent negative stock
    if (
      adjustmentType === "DECREASE" &&
      adjustmentQuantity > currentStock
    ) {
      setErrorMessage(
        `Insufficient stock. Available stock: ${currentStock}`,
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await stockAdjustment({
          productId: selectedProductId,
          adjustmentType,
          quantity: adjustmentQuantity,
          reason: reason.trim() || undefined,
        });

      setSuccessMessage(
        response.message ||
          "Stock adjusted successfully.",
      );

      // Refresh product data
      await loadProducts();

      // Clear adjustment fields
      setQuantity("");
      setReason("");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.message?.message ||
          "Failed to adjust stock.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="space-y-6 p-6">
         {/* BREADCRUMB */}
    <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
      <Link
        href="/dashboard/inventory"
        className="transition-colors hover:text-blue-600"
      >
        Inventory
      </Link>

      <span>/</span>

      <span className="font-medium text-slate-900">
        Stock Adjustment
      </span>
    </div>
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Package className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Stock Adjustment
            </h1>

            <p className="text-sm text-gray-500">
              Manually increase or decrease product
              stock.
            </p>
          </div>
        </div>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5" />

          <span>{successMessage}</span>
        </div>
      )}

      {/* ERROR */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />

          <span>
            {typeof errorMessage === "string"
              ? errorMessage
              : "Something went wrong."}
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* ==================================================
            LEFT - FORM
        ================================================== */}

        <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          {/* PRODUCT */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search product by name, code or barcode..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200">
              {loadingProducts ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No products found.
                </div>
              ) : (
                filteredProducts.map(
                  (product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(
                          product.id,
                        );
                        setSearch(
                          product.productName,
                        );
                        setSuccessMessage("");
                        setErrorMessage("");
                      }}
                      className={`flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                        selectedProductId ===
                        product.id
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {product.productCode}
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-gray-700">
                        {Number(
                          product.stockQuantity ?? 0,
                        )}
                      </span>
                    </button>
                  ),
                )
              )}
            </div>
          </div>

          {/* SELECTED PRODUCT */}
          {selectedProduct && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600">
                    Selected Product
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedProduct.productName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {selectedProduct.productCode}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Current Stock
                  </p>

                  <p className="text-2xl font-bold text-blue-600">
                    {currentStock}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ADJUSTMENT TYPE */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Adjustment Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setAdjustmentType("INCREASE")
                }
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  adjustmentType === "INCREASE"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                + Increase Stock
              </button>

              <button
                type="button"
                onClick={() =>
                  setAdjustmentType("DECREASE")
                }
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  adjustmentType === "DECREASE"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                − Decrease Stock
              </button>
            </div>
          </div>

          {/* QUANTITY */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Adjustment Quantity
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              placeholder="Enter quantity"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* REASON */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reason
            </label>

            <input
              type="text"
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              placeholder="e.g. Stock correction"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Adjusting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Submit Adjustment
                </>
              )}
            </button>
          </div>
        </div>

        {/* ==================================================
            RIGHT - PREVIEW
        ================================================== */}

        <div className="h-fit rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">
            Stock Preview
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Review the stock change before submitting.
          </p>

          <div className="mt-6 space-y-4">
            {/* CURRENT */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <span className="text-sm text-gray-600">
                Previous Stock
              </span>

              <span className="text-lg font-semibold text-gray-900">
                {currentStock}
              </span>
            </div>

            {/* ADJUSTMENT */}
            <div
              className={`flex items-center justify-between rounded-lg p-4 ${
                adjustmentType === "INCREASE"
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <span className="text-sm text-gray-600">
                Adjustment
              </span>

              <span
                className={`text-lg font-semibold ${
                  adjustmentType === "INCREASE"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {adjustmentType === "INCREASE"
                  ? "+"
                  : "-"}
                {adjustmentQuantity}
              </span>
            </div>

            {/* NEW */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  New Stock
                </span>

                <span className="text-2xl font-bold text-blue-700">
                  {newStock < 0 ? 0 : newStock}
                </span>
              </div>
            </div>

            {/* PRODUCT */}
            {selectedProduct && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500">
                  Product
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {selectedProduct.productName}
                </p>

                <p className="text-xs text-gray-500">
                  {selectedProduct.productCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
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