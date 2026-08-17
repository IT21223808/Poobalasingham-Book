"use client";

import { useEffect, useState } from "react";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowUpFromLine,
} from "lucide-react";
import Link from "next/link";

import {
  getLocations,
  getLocationStock,
  stockOut,
  Location,
  InventoryStock,
} from "@/services/inventory.service";

import {
  getProducts,
  Product,
} from "@/services/product.service";

export default function StockOutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationStock, setLocationStock] = useState<
    InventoryStock[]
  >([]);

  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ========================================
  // LOAD PRODUCTS + LOCATIONS
  // ========================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        const [productData, locationData] =
          await Promise.all([
            getProducts(),
            getLocations(),
          ]);

        setProducts(productData);
        setLocations(locationData);
      } catch (error) {
        console.error(error);

        setErrorMessage(
          "Failed to load products or locations.",
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // ========================================
  // LOAD LOCATION STOCK
  // ========================================

  useEffect(() => {
    if (!locationId) {
      setLocationStock([]);
      return;
    }

    const loadStock = async () => {
      try {
        const data =
          await getLocationStock(locationId);

        setLocationStock(data);
      } catch (error) {
        console.error(error);

        setLocationStock([]);
      }
    };

    loadStock();
  }, [locationId]);

  // ========================================
  // SELECTED PRODUCT
  // ========================================

  const selectedProduct = products.find(
    (product) => product.id === productId,
  );

  const selectedLocationStock =
    locationStock.find(
      (item) =>
        item.product.id === productId,
    );

  const currentLocationStock = Number(
    selectedLocationStock?.quantity ?? 0,
  );

  const currentTotalStock = Number(
    selectedProduct?.stockQuantity ?? 0,
  );

  // ========================================
  // STOCK OUT CALCULATION
  // ========================================

  const removeQuantity = Number(
    quantity || 0,
  );

  const newLocationStock =
    currentLocationStock - removeQuantity;

  const newTotalStock =
    currentTotalStock - removeQuantity;

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    // Product validation
    if (!productId) {
      setErrorMessage(
        "Please select a product.",
      );
      return;
    }

    // Location validation
    if (!locationId) {
      setErrorMessage(
        "Please select a location.",
      );
      return;
    }

    // Quantity validation
    if (removeQuantity <= 0) {
      setErrorMessage(
        "Quantity must be greater than 0.",
      );
      return;
    }

    // Frontend location stock validation
    if (
      removeQuantity >
      currentLocationStock
    ) {
      setErrorMessage(
        `Insufficient stock. Available stock at this location: ${currentLocationStock}`,
      );
      return;
    }

    // Frontend total stock validation
    if (
      removeQuantity >
      currentTotalStock
    ) {
      setErrorMessage(
        `Insufficient total stock. Available stock: ${currentTotalStock}`,
      );
      return;
    }

    try {
      setLoading(true);

      // ====================================
      // STOCK OUT API
      // ====================================

      await stockOut({
        productId,
        locationId,
        quantity: removeQuantity,
      });

      setSuccessMessage(
        "Stock removed successfully.",
      );

      // Clear quantity
      setQuantity("");

      // ====================================
      // REFRESH LOCATION STOCK
      // ====================================

      const updatedStock =
        await getLocationStock(
          locationId,
        );

      setLocationStock(updatedStock);

      // ====================================
      // REFRESH PRODUCTS
      // ====================================

      const updatedProducts =
        await getProducts();

      setProducts(updatedProducts);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to remove stock.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

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
            Stock Out
          </span>

        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Stock Out
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Remove products from inventory.
        </p>

      </div>

      {/* ================================= */}
      {/* MAIN GRID */}
      {/* ================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ================================= */}
        {/* FORM */}
        {/* ================================= */}

        <div className="xl:col-span-2">

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white"
          >

            {/* FORM HEADER */}

            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">

                <ArrowUpFromLine
                  size={22}
                />

              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Remove Stock
                </h2>

                <p className="text-xs text-slate-500">
                  Select a product and
                  inventory location
                </p>

              </div>

            </div>

            {/* FORM BODY */}

            <div className="space-y-5 p-6">

              {/* SUCCESS */}

              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

                  <CheckCircle2
                    size={18}
                  />

                  {successMessage}

                </div>
              )}

              {/* ERROR */}

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">

                  <AlertCircle
                    size={18}
                  />

                  {errorMessage}

                </div>
              )}

              {/* PRODUCT */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Product
                </label>

                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(
                      e.target.value,
                    );
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  disabled={loadingData}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Select product
                  </option>

                  {products.map(
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

              </div>

              {/* LOCATION */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Location
                </label>

                <select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(
                      e.target.value,
                    );
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  disabled={loadingData}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >

                  <option value="">
                    Select location
                  </option>

                  {locations
                    .filter(
                      (location) =>
                        location.isActive,
                    )
                    .map(
                      (location) => (
                        <option
                          key={location.id}
                          value={location.id}
                        >
                          {location.name}
                        </option>
                      ),
                    )}

                </select>

              </div>

              {/* QUANTITY */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  max={
                    currentLocationStock > 0
                      ? currentLocationStock
                      : undefined
                  }
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value,
                    )
                  }
                  placeholder="Enter quantity"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {locationId &&
                  selectedProduct && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Available at this location:{" "}
                      <span className="font-semibold text-slate-700">
                        {currentLocationStock}
                      </span>
                    </p>
                  )}

              </div>

              {/* PRODUCT INFO */}

              {selectedProduct && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div className="mb-3 flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">

                      <Package
                        size={19}
                      />

                    </div>

                    <div>

                      <p className="font-semibold text-slate-800">
                        {
                          selectedProduct.productName
                        }
                      </p>

                      <p className="text-xs text-slate-500">
                        {
                          selectedProduct.productCode
                        }
                      </p>

                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                    <InfoItem
                      label="Total Stock"
                      value={
                        currentTotalStock
                      }
                    />

                    <InfoItem
                      label="Location Stock"
                      value={
                        currentLocationStock
                      }
                    />

                    <InfoItem
                      label="Reorder Level"
                      value={
                        selectedProduct.reorderLevel ??
                        10
                      }
                    />

                  </div>

                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  loading ||
                  loadingData
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <ArrowUpFromLine
                  size={18}
                />

                {loading
                  ? "Removing Stock..."
                  : "Out Stock"}

              </button>

            </div>

          </form>

          {/* BACK */}

          <div className="mt-5">

            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
            >

              <ArrowLeft
                size={16}
              />

              Back to Inventory

            </Link>

          </div>

        </div>

        {/* ================================= */}
        {/* STOCK PREVIEW */}
        {/* ================================= */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="mb-5">

            <h2 className="font-semibold text-slate-900">
              Stock Preview
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Review the stock change
              before submitting
            </p>

          </div>

          <div className="space-y-4">

            {/* LOCATION */}

            <PreviewRow
              label="Location"
              value={
                locations.find(
                  (location) =>
                    location.id ===
                    locationId,
                )?.name || "—"
              }
            />

            {/* CURRENT STOCK */}

            <PreviewRow
              label="Current Stock"
              value={
                locationId
                  ? currentLocationStock
                  : "—"
              }
            />

            {/* QUANTITY REMOVED */}

            <PreviewRow
              label="Quantity Removed"
              value={
                removeQuantity > 0
                  ? `-${removeQuantity}`
                  : "—"
              }
            />

            {/* NEW LOCATION STOCK */}

            <div className="border-t border-slate-200 pt-4">

              <p className="text-xs text-slate-500">
                New Location Stock
              </p>

              <p
                className={`mt-1 text-3xl font-bold ${
                  newLocationStock < 0
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              >
                {locationId
                  ? newLocationStock
                  : "—"}
              </p>

            </div>

            {/* TOTAL STOCK */}

            <div className="rounded-lg bg-blue-50 p-4">

              <p className="text-xs font-medium text-blue-700">
                Product Total After
                Stock Out
              </p>

              <p className="mt-1 text-lg font-bold text-blue-800">
                {selectedProduct
                  ? newTotalStock
                  : "—"}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

// ========================================
// SMALL COMPONENTS
// ========================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white p-3">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-800">
        {value}
      </span>

    </div>
  );
}