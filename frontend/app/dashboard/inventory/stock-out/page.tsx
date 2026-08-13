"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpFromLine,
  CheckCircle,
  Package,
  Search,
} from "lucide-react";

import {
  getProducts,
  Product,
} from "@/services/product.service";

import { stockOut } from "@/services/inventory.service";

export default function StockOutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ========================================
  // Load Products
  // ========================================

  const loadProducts = async () => {
    try {
      setLoading(true);

      setErrorMessage("");

      const data = await getProducts();

      setProducts(data);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error,
      );

      setErrorMessage(
        "Failed to load products. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ========================================
  // Selected Product
  // ========================================

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) =>
        product.id === selectedProductId,
    );
  }, [products, selectedProductId]);

  // ========================================
  // Product Search
  // ========================================

  const filteredProducts = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim();

    if (!searchValue) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.productName
          ?.toLowerCase()
          .includes(searchValue) ||
        product.productCode
          ?.toLowerCase()
          .includes(searchValue) ||
        product.barcode
          ?.toLowerCase()
          .includes(searchValue) ||
        product.isbn
          ?.toLowerCase()
          .includes(searchValue)
      );
    });
  }, [products, search]);

  // ========================================
  // Submit Stock Out
  // ========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
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
    const parsedQuantity = Number(quantity);

    if (
      !quantity ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setErrorMessage(
        "Quantity must be a positive whole number.",
      );
      return;
    }

    // Available stock validation
    const currentStock = Number(
      selectedProduct?.stockQuantity ?? 0,
    );

    if (parsedQuantity > currentStock) {
      setErrorMessage(
        `Insufficient stock. Available stock: ${currentStock}.`,
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await stockOut({
        productId: selectedProductId,
        quantity: parsedQuantity,
      });

      setSuccessMessage(
        `${response.data.productName}: ${response.data.quantityRemoved} units removed successfully. Stock ${response.data.previousStock} → ${response.data.newStock}.`,
      );

      // Reset form
      setSelectedProductId("");
      setSearch("");
      setQuantity("");

      // Refresh product data
      await loadProducts();
    } catch (error: any) {
      console.error(
        "Stock Out failed:",
        error,
      );

      const message =
        error?.response?.data?.message;

      if (Array.isArray(message)) {
        setErrorMessage(
          message.join(", "),
        );
      } else if (typeof message === "string") {
        setErrorMessage(message);
      } else {
        setErrorMessage(
          "Failed to remove stock. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <div className="space-y-6">

      {/* ========================================
          Header
      ======================================== */}

      <div>
        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-red-50 p-3">
            <ArrowUpFromLine
              size={24}
              className="text-red-600"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Stock Out
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Remove stock from your inventory
            </p>
          </div>

        </div>
      </div>

      {/* ========================================
          Success
      ======================================== */}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">

          <CheckCircle
            size={20}
            className="mt-0.5 shrink-0 text-green-600"
          />

          <div>
            <p className="font-medium text-green-800">
              Stock Out Successful
            </p>

            <p className="mt-1 text-sm text-green-700">
              {successMessage}
            </p>
          </div>

        </div>
      )}

      {/* ========================================
          Error
      ======================================== */}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="font-medium text-red-800">
              Stock Out Failed
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>

        </div>
      )}

      {/* ========================================
          Form
      ======================================== */}

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6"
      >

        <div className="space-y-6">

          {/* Search */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search Product
            </label>

            <div className="relative">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedProductId("");
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                placeholder="Search by name, code, barcode or ISBN..."
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
              />

            </div>
          </div>

          {/* Select Product */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Product
            </label>

            <select
              value={selectedProductId}
              onChange={(event) => {
                setSelectedProductId(
                  event.target.value,
                );

                setSuccessMessage("");
                setErrorMessage("");
              }}
              disabled={
                loading || submitting
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300 disabled:bg-gray-100"
            >
              <option value="">
                {loading
                  ? "Loading products..."
                  : "Select a product"}
              </option>

              {filteredProducts.map(
                (product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.productName} —{" "}
                    {product.productCode}
                  </option>
                ),
              )}
            </select>

            {!loading &&
              filteredProducts.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No products found.
                </p>
              )}
          </div>

          {/* Product Info */}

          {selectedProduct && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white">

                  <Package
                    size={22}
                    className="text-gray-500"
                  />

                </div>

                <div className="flex-1">

                  <p className="font-semibold text-gray-900">
                    {selectedProduct.productName}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Code:{" "}
                    {selectedProduct.productCode}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs text-gray-500">
                    Available Stock
                  </p>

                  <p className="text-2xl font-bold text-gray-900">
                    {Number(
                      selectedProduct.stockQuantity ?? 0,
                    )}
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* Quantity */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantity
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => {
                setQuantity(
                  event.target.value,
                );

                setSuccessMessage("");
                setErrorMessage("");
              }}
              placeholder="Enter quantity"
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300 disabled:bg-gray-100"
            />

            <p className="mt-2 text-xs text-gray-500">
              Quantity cannot exceed available stock.
            </p>
          </div>

          {/* Stock Preview */}

          {selectedProduct &&
            Number(quantity) > 0 && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-orange-700">
                      Stock after Stock Out
                    </p>

                    <p className="mt-1 text-2xl font-bold text-orange-900">
                      {Math.max(
                        0,
                        Number(
                          selectedProduct.stockQuantity ?? 0,
                        ) -
                          Number(quantity),
                      )}
                    </p>

                  </div>

                  <ArrowUpFromLine
                    size={28}
                    className="text-orange-600"
                  />

                </div>

              </div>
            )}

          {/* Submit */}

          <div className="flex justify-end border-t border-gray-200 pt-5">

            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                !selectedProductId ||
                !quantity
              }
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <ArrowUpFromLine size={18} />

              {submitting
                ? "Removing Stock..."
                : "Remove Stock"}

            </button>

          </div>

        </div>

      </form>
    </div>
  );
}