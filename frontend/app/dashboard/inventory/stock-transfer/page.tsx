"use client";

import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
   ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getLocations,
  getLocationStock,
  stockTransfer,
  Location,
  InventoryStock,
} from "@/services/inventory.service";

import {
  getProducts,
  Product,
} from "@/services/product.service";

export default function StockTransferPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromStock, setFromStock] = useState<
    InventoryStock[]
  >([]);

  const [productId, setProductId] = useState("");
  const [fromLocationId, setFromLocationId] =
    useState("");
  const [toLocationId, setToLocationId] =
    useState("");
  const [quantity, setQuantity] = useState("");

  const [loadingData, setLoadingData] =
    useState(true);
  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState("");
const router = useRouter();

  // LOAD PRODUCTS + LOCATIONS
  
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
  // LOAD SOURCE LOCATION STOCK
  // ========================================

  useEffect(() => {
    if (!fromLocationId) {
      setFromStock([]);
      return;
    }

    const loadStock = async () => {
      try {
        const data =
          await getLocationStock(
            fromLocationId,
          );

        setFromStock(data);
      } catch (error) {
        console.error(error);
        setFromStock([]);
      }
    };

    loadStock();
  }, [fromLocationId]);

  // ========================================
  // SELECTED PRODUCT
  // ========================================

  const selectedProduct = products.find(
    (product) => product.id === productId,
  );

  const sourceStockItem =
    fromStock.find(
      (item) =>
        item.product.id === productId,
    );

  const availableStock = Number(
    sourceStockItem?.quantity ?? 0,
  );

  const transferQuantity = Number(
    quantity || 0,
  );

  const remainingSourceStock =
    availableStock - transferQuantity;

  const insufficientStock =
    transferQuantity > availableStock;

  // ========================================
  // TRANSFER
  // ========================================

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!productId) {
      setErrorMessage(
        "Please select a product.",
      );
      return;
    }

    if (!fromLocationId) {
      setErrorMessage(
        "Please select the source location.",
      );
      return;
    }

    if (!toLocationId) {
      setErrorMessage(
        "Please select the destination location.",
      );
      return;
    }

    if (
      fromLocationId === toLocationId
    ) {
      setErrorMessage(
        "Source and destination locations must be different.",
      );
      return;
    }

    if (transferQuantity <= 0) {
      setErrorMessage(
        "Quantity must be greater than 0.",
      );
      return;
    }

    if (
      transferQuantity > availableStock
    ) {
      setErrorMessage(
        `Insufficient stock. Available stock: ${availableStock}`,
      );
      return;
    }

    try {
      setLoading(true);

      await stockTransfer({
        productId,
        fromLocationId,
        toLocationId,
        quantity: transferQuantity,
      });

      setSuccessMessage(
        "Stock transferred successfully.",
      );

      setQuantity("");

      const updatedStock =
        await getLocationStock(
          fromLocationId,
        );

      setFromStock(updatedStock);

      const updatedProducts =
        await getProducts();

      setProducts(updatedProducts);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to transfer stock.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="mb-6">
  {/* Breadcrumb */}
  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">

    <Link
      href="/dashboard/inventory"
      className="hover:text-blue-600 transition-colors"
    >
      Inventory
    </Link>

    <span>/</span>

    <span className="font-medium text-slate-900">
      Stock Transfer
    </span>
  </div>

  {/* Page Title */}
  <h1 className="text-3xl font-bold text-slate-900">
    Stock Transfer
  </h1>

  <p className="mt-1 text-sm text-slate-500">
    Transfer inventory between locations.
  </p>
</div>
      {/* MAIN */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* FORM */}

        <div className="xl:col-span-2">

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white"
          >

            {/* FORM HEADER */}

            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <ArrowRightLeft
                  size={22}
                />
              </div>

              <div>

                <h2 className="font-semibold text-slate-900">
                  Transfer Stock
                </h2>

                <p className="text-xs text-slate-500">
                  Move products from one
                  location to another
                </p>

              </div>

            </div>

            {/* BODY */}

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
                  onChange={(e) =>
                    setProductId(
                      e.target.value,
                    )
                  }
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
                        {
                          product.productName
                        }{" "}
                        —{" "}
                        {
                          product.productCode
                        }
                      </option>
                    ),
                  )}

                </select>

              </div>

              {/* LOCATIONS */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* FROM */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    From Location
                  </label>

                  <select
                    value={
                      fromLocationId
                    }
                    onChange={(e) =>
                      setFromLocationId(
                        e.target.value,
                      )
                    }
                    disabled={loadingData}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >

                    <option value="">
                      Select source
                    </option>

                    {locations
                      .filter(
                        (location) =>
                          location.isActive,
                      )
                      .map(
                        (location) => (
                          <option
                            key={
                              location.id
                            }
                            value={
                              location.id
                            }
                          >
                            {
                              location.name
                            }
                          </option>
                        ),
                      )}

                  </select>

                </div>

                {/* TO */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    To Location
                  </label>

                  <select
                    value={
                      toLocationId
                    }
                    onChange={(e) =>
                      setToLocationId(
                        e.target.value,
                      )
                    }
                    disabled={loadingData}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  >

                    <option value="">
                      Select destination
                    </option>

                    {locations
                      .filter(
                        (location) =>
                          location.isActive &&
                          location.id !==
                            fromLocationId,
                      )
                      .map(
                        (location) => (
                          <option
                            key={
                              location.id
                            }
                            value={
                              location.id
                            }
                          >
                            {
                              location.name
                            }
                          </option>
                        ),
                      )}

                  </select>

                </div>

              </div>

              {/* AVAILABLE STOCK */}

              {productId &&
                fromLocationId && (
                  <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">

                    <p className="text-xs text-purple-600">
                      Available stock at
                      source location
                    </p>

                    <p className="mt-1 text-2xl font-bold text-purple-800">
                      {availableStock}
                    </p>

                  </div>
                )}

              {/* QUANTITY */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value,
                    )
                  }
                  placeholder="Enter quantity"
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2 ${
                    insufficientStock
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 focus:border-purple-500 focus:ring-purple-100"
                  }`}
                />

                {insufficientStock && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Quantity cannot exceed
                    available stock.
                  </p>
                )}

              </div>

              {/* PRODUCT INFO */}

              {selectedProduct && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-purple-600 shadow-sm">
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

                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={
                  loading ||
                  insufficientStock
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <ArrowRightLeft
                  size={18}
                />

                {loading
                  ? "Transferring..."
                  : "Transfer Stock"}

              </button>

            </div>

          </form>

        </div>

        {/* ================================= */}
        {/* PREVIEW */}
        {/* ================================= */}

        <div className="rounded-xl border border-slate-200 bg-white p-6">

          <h2 className="font-semibold text-slate-900">
            Transfer Preview
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Review the transfer before
            submitting
          </p>

          <div className="mt-6 space-y-5">

            {/* FROM */}

            <div className="rounded-lg bg-slate-50 p-4">

              <p className="text-xs text-slate-400">
                From
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {locations.find(
                  (location) =>
                    location.id ===
                    fromLocationId,
                )?.name || "—"}
              </p>

            </div>

            <div className="flex justify-center">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <ArrowRight size={18} />
              </div>

            </div>

            {/* TO */}

            <div className="rounded-lg bg-slate-50 p-4">

              <p className="text-xs text-slate-400">
                To
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {locations.find(
                  (location) =>
                    location.id ===
                    toLocationId,
                )?.name || "—"}
              </p>

            </div>

            {/* QUANTITY */}

            <div className="border-t border-slate-200 pt-5">

              <p className="text-xs text-slate-500">
                Quantity
              </p>

              <p className="mt-1 text-3xl font-bold text-purple-600">
                {transferQuantity > 0
                  ? transferQuantity
                  : "—"}
              </p>

            </div>

            {/* REMAINING */}

            <div className="rounded-lg bg-purple-50 p-4">

              <p className="text-xs font-medium text-purple-700">
                Remaining Source Stock
              </p>

              <p className="mt-1 text-lg font-bold text-purple-800">
                {fromLocationId
                  ? remainingSourceStock
                  : "—"}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}