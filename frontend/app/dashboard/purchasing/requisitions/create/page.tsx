"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  ClipboardList,
  Package,
  ChevronRight,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface Product {
  id: string;
  productCode: string;
  productName: string;
}

interface RequisitionItem {
  productId: string;
  quantity: number;
}

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const REQUISITION_API =
  `${API_URL}/purchasing/requisitions`;

const PRODUCTS_API =
  `${API_URL}/products`;

/* =========================================================
   PAGE
========================================================= */

export default function CreatePurchaseRequisitionPage() {
  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [requestedDate, setRequestedDate] =
    useState("");

  const [requiredDate, setRequiredDate] =
    useState("");

  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<
    RequisitionItem[]
  >([
    {
      productId: "",
      quantity: 1,
    },
  ]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await fetch(
          PRODUCTS_API,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load products (${response.status})`
          );
        }

        const data = await response.json();

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setProducts(result);
      } catch (err) {
        console.error(
          "Products loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load products"
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  /* =======================================================
     ADD ITEM
  ======================================================= */

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: "",
        quantity: 1,
      },
    ]);
  };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const removeItem = (index: number) => {
    if (items.length === 1) return;

    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  /* =======================================================
     UPDATE PRODUCT
  ======================================================= */

  const updateProduct = (
    index: number,
    productId: string
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
            }
          : item
      )
    );
  };

  /* =======================================================
     UPDATE QUANTITY
  ======================================================= */

  const updateQuantity = (
    index: number,
    quantity: number
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              quantity:
                quantity < 1
                  ? 1
                  : quantity,
            }
          : item
      )
    );
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError(null);

    /* Validation */

    if (!requestedDate) {
      setError(
        "Please select the requested date."
      );
      return;
    }

    if (!requiredDate) {
      setError(
        "Please select the required date."
      );
      return;
    }

    if (requiredDate < requestedDate) {
      setError(
        "Required date cannot be earlier than requested date."
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Please add at least one product."
      );
      return;
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.productId ||
        item.quantity <= 0
    );

    if (hasInvalidItem) {
      setError(
        "Please select a product and enter a valid quantity for every item."
      );
      return;
    }

    /* Duplicate product validation */

    const productIds = items.map(
      (item) => item.productId
    );

    const hasDuplicateProducts =
      new Set(productIds).size !==
      productIds.length;

    if (hasDuplicateProducts) {
      setError(
        "The same product cannot be added more than once."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        requestedDate,
        requiredDate,
        notes: notes.trim() || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      };

      const response = await fetch(
        REQUISITION_API,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let message =
          "Failed to create requisition.";

        try {
          const data =
            await response.json();

          if (Array.isArray(data?.message)) {
            message =
              data.message.join(", ");
          } else if (data?.message) {
            message = data.message;
          }
        } catch {
          // Ignore invalid JSON response
        }

        throw new Error(message);
      }

      window.location.href =
        "/dashboard/purchasing/requisitions";
    } catch (err) {
      console.error(
        "Create requisition error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create requisition."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     TOTAL QUANTITY
  ======================================================= */

  const totalQuantity = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className=" w-full ">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="mb-5 flex items-center gap-2 text-sm">

          <Link
            href="/dashboard/purchasing"
            className="font-medium text-gray-500 transition hover:text-gray-900"
          >
            Purchasing
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <Link
            href="/dashboard/purchasing/requisitions"
            className="font-medium text-gray-500 transition hover:text-gray-900"
          >
            Requisitions
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <span className="font-medium text-gray-900">
            Create Requisition
          </span>

        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ClipboardList size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Create Purchase Requisition
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create a new request for purchasing products.
              </p>
            </div>

          </div>

          <Link
            href="/dashboard/purchasing/requisitions"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Requisitions
          </Link>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              GENERAL INFORMATION
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">
                Requisition Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the basic requisition details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

              {/* Requested Date */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Requested Date
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="date"
                  value={requestedDate}
                  onChange={(event) =>
                    setRequestedDate(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Required Date */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Required Date
                  <span className="text-red-500">
                    {" "}*
                  </span>
                </label>

                <input
                  type="date"
                  min={requestedDate || undefined}
                  value={requiredDate}
                  onChange={(event) =>
                    setRequiredDate(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Notes */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Enter any additional notes or requirements..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>
          </div>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-semibold text-gray-900">
                  Requested Products
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add products and required quantities.
                </p>

              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
              >
                <Plus size={16} />
                Add Product
              </button>

            </div>

            <div className="p-6">

              {/* Table Header */}

              <div className="mb-3 hidden grid-cols-[1fr_180px_80px] gap-4 px-3 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">
                <span>Product</span>
                <span>Quantity</span>
                <span></span>
              </div>

              <div className="space-y-3">

                {items.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1fr_180px_80px] md:items-center md:bg-white"
                    >

                      {/* Product */}

                      <div>

                        <label className="mb-1.5 block text-xs font-medium text-gray-500 md:hidden">
                          Product
                        </label>

                        <div className="relative">

                          <Package
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                          <select
                            value={
                              item.productId
                            }
                            onChange={(event) =>
                              updateProduct(
                                index,
                                event.target.value
                              )
                            }
                            disabled={
                              loadingProducts
                            }
                            className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >

                            <option value="">
                              {loadingProducts
                                ? "Loading products..."
                                : "Select product"}
                            </option>

                            {products.map(
                              (product) => (
                                <option
                                  key={
                                    product.id
                                  }
                                  value={
                                    product.id
                                  }
                                >
                                  {product.productCode
                                    ? `${product.productCode} - `
                                    : ""}
                                  {
                                    product.productName
                                  }
                                </option>
                              )
                            )}

                          </select>

                        </div>
                      </div>

                      {/* Quantity */}

                      <div>

                        <label className="mb-1.5 block text-xs font-medium text-gray-500 md:hidden">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            item.quantity
                          }
                          onChange={(event) =>
                            updateQuantity(
                              index,
                              Number(
                                event.target.value
                              )
                            )
                          }
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                      </div>

                      {/* Remove */}

                      <div className="flex justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(index)
                          }
                          disabled={
                            items.length === 1
                          }
                          title="Remove product"
                          className="rounded-lg p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>

              {/* Summary */}

              <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">

                <span className="text-sm text-gray-500">
                  Total Requested Quantity
                </span>

                <span className="text-lg font-semibold text-gray-900">
                  {totalQuantity}
                </span>

              </div>

            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/dashboard/purchasing/requisitions"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Create Requisition
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}