"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {AlertTriangle,Package,Search,RefreshCw,CheckCircle2,AlertCircle,ArrowLeft,Trash2} from "lucide-react";
import {recordDamagedLost} from "@/services/inventory.service";
import {getProducts,Product} from "@/services/product.service";

type DamagedLostType = "DAMAGED" | "LOST";

export default function DamagedLostPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [search, setSearch] = useState("");
  const [type, setType] =
    useState<DamagedLostType>("DAMAGED");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        product.id === selectedProductId,
    );
  }, [products, selectedProductId]);

  const currentStock =
    selectedProduct?.stockQuantity ?? 0;

  const enteredQuantity =
    quantity === "" ? 0 : Number(quantity);

  const newStock =
    currentStock - enteredQuantity;

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

  const filteredProducts = products.filter(
    (product) => {
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
    },
  );

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

    if (quantity === "") {
      setError("Please enter a quantity.");
      return;
    }

    const amount = Number(quantity);

    if (!Number.isInteger(amount)) {
      setError("Quantity must be a whole number.");
      return;
    }

    if (amount <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (!selectedProduct) {
      setError("Selected product was not found.");
      return;
    }

    if (amount > currentStock) {
      setError(
        `Insufficient stock. Available stock is ${currentStock}.`,
      );
      return;
    }

    if (!reason.trim()) {
      setError(
        "Please provide a reason or note.",
      );
      return;
    }

    const actionName =
      type === "DAMAGED"
        ? "damaged"
        : "lost";

    const confirmed = window.confirm(
      `Record ${amount} item(s) as ${actionName}?\n\n` +
        `Product: ${selectedProduct.productName}\n` +
        `Current Stock: ${currentStock}\n` +
        `Quantity: ${amount}\n` +
        `New Stock: ${newStock}`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await recordDamagedLost({
          productId: selectedProductId,
          quantity: amount,
          type,
          reason: reason.trim(),
        });

      setSuccess(
        response?.message ||
          `${type === "DAMAGED" ? "Damaged" : "Lost"} stock recorded successfully.`,
      );

      const updatedStock =
        response?.data?.newStock ?? newStock;

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === selectedProductId
            ? {
                ...product,
                stockQuantity: updatedStock,
              }
            : product,
        ),
      );

      setQuantity("");
      setReason("");
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
            "Failed to record damaged/lost stock.",
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
    setType("DAMAGED");
    setQuantity("");
    setReason("");
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
            Damaged / Lost Items
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Damaged / Lost Items
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Record damaged or lost items and update inventory stock.
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Damaged / Lost Stock
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Record inventory that is damaged or missing.
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
                setQuantity("");
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
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                  <Package size={22} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedProduct.productName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedProduct.productCode}
                  </p>
                </div>

                <div className="ml-auto text-right">
                  <p className="text-xs text-slate-500">
                    Current Stock
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {currentStock}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ====================================
              TYPE
          ==================================== */}

          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Item Type
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setType("DAMAGED")
                }
                className={`rounded-xl border p-4 text-left transition ${
                  type === "DAMAGED"
                    ? "border-red-500 bg-red-50 ring-2 ring-red-100"
                    : "border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      type === "DAMAGED"
                        ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <AlertTriangle size={19} />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Damaged
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Product damaged or unusable
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setType("LOST")
                }
                className={`rounded-xl border p-4 text-left transition ${
                  type === "LOST"
                    ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100"
                    : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      type === "LOST"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Trash2 size={19} />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Lost
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Product missing or lost
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ====================================
              QUANTITY
          ==================================== */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Quantity
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              placeholder="Enter quantity"
              disabled={!selectedProduct}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            {selectedProduct && (
              <p className="mt-2 text-xs text-slate-500">
                Available stock: {currentStock}
              </p>
            )}
          </div>

          {/* ====================================
              REASON
          ==================================== */}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Reason / Note
            </label>

            <textarea
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              rows={4}
              placeholder={
                type === "DAMAGED"
                  ? "Example: Damaged during handling..."
                  : "Example: Item missing during stock verification..."
              }
              disabled={!selectedProduct}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          {/* ====================================
              PREVIEW
          ==================================== */}

          {selectedProduct &&
            quantity !== "" && (
              <div
                className={`mb-6 rounded-xl border p-5 ${
                  newStock < 0
                    ? "border-red-200 bg-red-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle
                    size={18}
                    className={
                      newStock < 0
                        ? "text-red-600"
                        : "text-orange-600"
                    }
                  />

                  <p className="font-semibold text-slate-800">
                    Stock Preview
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Current Stock
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {currentStock}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Quantity Removed
                    </p>

                    <p className="mt-1 text-xl font-bold text-red-600">
                      -{enteredQuantity}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      New Stock
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        newStock < 0
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {newStock}
                    </p>
                  </div>
                </div>

                {newStock < 0 && (
                  <p className="mt-4 text-sm font-medium text-red-600">
                    Quantity cannot exceed available stock.
                  </p>
                )}
              </div>
            )}

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
                !selectedProduct ||
                newStock < 0
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Recording...
                </>
              ) : (
                <>
                  <AlertTriangle size={17} />
                  Record{" "}
                  {type === "DAMAGED"
                    ? "Damaged"
                    : "Lost"}{" "}
                  Stock
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