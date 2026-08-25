"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Save,
  Trash2,
  Plus,
  ClipboardList,
  Package,
  ChevronRight,
  XCircle,
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
  id?: number;
  productId: string;
  quantity: number;
  product?: Product;
}

interface PurchaseRequisition {
  id: number;
  requisitionNumber: string;
  requestedBy?: string;
  requestedDate?: string;
  requiredDate?: string;
  status: string;
  notes?: string | null;
  items: RequisitionItem[];
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

export default function EditPurchaseRequisitionPage() {
  const params = useParams();

  const id = params?.id;

  const [requisition, setRequisition] =
    useState<PurchaseRequisition | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [requestedDate, setRequestedDate] =
    useState("");

  const [requiredDate, setRequiredDate] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [items, setItems] = useState<
    RequisitionItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     TOKEN
  ======================================================= */

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);

        const token = getToken();

        const response = await fetch(
          PRODUCTS_API,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message ||
                  "Failed to load products"
          );
        }

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
     LOAD REQUISITION
  ======================================================= */

  useEffect(() => {
    if (!id) return;

    const loadRequisition = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();

        const response = await fetch(
          `${REQUISITION_API}/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : data?.message ||
                  "Failed to load requisition"
          );
        }

        const result =
          data?.data || data;

        setRequisition(result);

        setRequestedDate(
          result.requestedDate
            ? formatInputDate(
                result.requestedDate
              )
            : ""
        );

        setRequiredDate(
          result.requiredDate
            ? formatInputDate(
                result.requiredDate
              )
            : ""
        );

        setNotes(result.notes || "");

        setItems(
          Array.isArray(result.items)
            ? result.items.map(
                (item: RequisitionItem) => ({
                  id: item.id,
                  productId:
                    item.productId,
                  quantity:
                    Number(item.quantity) || 1,
                })
              )
            : []
        );
      } catch (err) {
        console.error(
          "Load requisition error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load requisition"
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequisition();
  }, [id]);

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
        Number(item.quantity) <= 0
    );

    if (hasInvalidItem) {
      setError(
        "Please select a product and enter a valid quantity for every item."
      );
      return;
    }

    const productIds = items.map(
      (item) => item.productId
    );

    if (
      new Set(productIds).size !==
      productIds.length
    ) {
      setError(
        "The same product cannot be added more than once."
      );
      return;
    }

    try {
      setSubmitting(true);

      const token = getToken();

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
        `${REQUISITION_API}/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
  let errorMessage = "Failed to update requisition";

  if (Array.isArray(data?.message)) {
    errorMessage = data.message.join(", ");
  } else if (typeof data?.message === "string") {
    errorMessage = data.message;
  } else if (
    data?.message &&
    typeof data.message === "object"
  ) {
    errorMessage =
      data.message.message ||
      JSON.stringify(data.message);
  }

  throw new Error(errorMessage);
}

      window.location.href =
        `/dashboard/purchasing/requisitions/${id}`;
    } catch (err) {
      console.error(
        "Update requisition error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update requisition."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading requisition...
            </p>

          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !requisition) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">

          <XCircle
            size={42}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Unable to Edit Requisition
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "Requisition not found."}
          </p>

          <Link
            href="/dashboard/purchasing/requisitions"
            className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Requisitions
          </Link>

        </div>
      </div>
    );
  }

  /* =======================================================
     STATUS CHECK
  ======================================================= */

  const normalizedStatus =
    requisition.status?.toUpperCase();

  if (normalizedStatus !== "PENDING") {
    return (
      <div className="min-h-full bg-gray-50 p-6">

        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-8 text-center">

          <ClipboardList
            size={42}
            className="mx-auto text-gray-400"
          />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Requisition Cannot Be Edited
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Only pending requisitions can be edited.
          </p>

          <div className="mt-5">

            <Link
              href={`/dashboard/purchasing/requisitions/${requisition.id}`}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              View Requisition
            </Link>

          </div>

        </div>

      </div>
    );
  }

  /* =======================================================
     TOTAL
  ======================================================= */

  const totalQuantity = items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-6">

      <div className="w-full">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="mb-5 flex items-center gap-2 text-sm">

          <Link
            href="/dashboard/purchasing"
            className="font-medium text-gray-500 hover:text-gray-900"
          >
            Purchasing
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <Link
            href="/dashboard/purchasing/requisitions"
            className="font-medium text-gray-500 hover:text-gray-900"
          >
            Requisitions
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <span className="font-medium text-gray-900">
            Edit{" "}
            {requisition.requisitionNumber}
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
                Edit Purchase Requisition
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {requisition.requisitionNumber}
              </p>

            </div>

          </div>

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
              INFORMATION
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">

              <h2 className="font-semibold text-gray-900">
                Requisition Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update the requisition details.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

              {/* Requisition Number */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Requisition Number
                </label>

                <input
                  type="text"
                  value={
                    requisition.requisitionNumber
                  }
                  disabled
                  className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500"
                />

              </div>

              {/* Requested By */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Requested By
                </label>

                <input
                  type="text"
                  value={
                    requisition.requestedBy ||
                    "—"
                  }
                  disabled
                  className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500"
                />

              </div>

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
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  min={
                    requestedDate ||
                    undefined
                  }
                  value={requiredDate}
                  onChange={(event) =>
                    setRequiredDate(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  Update products and quantities.
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

              {/* TABLE HEADER */}

              <div className="mb-3 hidden grid-cols-[1fr_180px_80px] gap-4 px-3 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">

                <span>Product</span>
                <span>Quantity</span>
                <span></span>

              </div>

              <div className="space-y-3">

                {items.map(
                  (item, index) => (
                    <div
                      key={
                        item.id ??
                        `new-${index}`
                      }
                      className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-[1fr_180px_80px] md:items-center md:bg-white"
                    >

                      {/* PRODUCT */}

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

                      {/* QUANTITY */}

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

                      {/* REMOVE */}

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

              {/* TOTAL */}

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
              href={`/dashboard/purchasing/requisitions/${requisition.id}`}
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
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

/* =========================================================
   DATE FOR INPUT
========================================================= */

function formatInputDate(
  date: string
) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year =
    parsedDate.getFullYear();

  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}