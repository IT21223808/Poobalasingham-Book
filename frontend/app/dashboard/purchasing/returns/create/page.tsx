"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
  Plus,
  Package,
  MapPin,
  FileText,
  ShoppingCart,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";

import {
  purchasingService,
  PurchaseOrder,
  PurchaseInvoice,
  GRN,
  Location,
  CreateReturnPayload,
} from "@/services/purchasing.service";

// =========================================================
// TYPES
// =========================================================

interface ReturnItem {
  id: string;
  productId: string;
  quantity: number;
}

interface ProductOption {
  id: string;
  productCode: string;
  productName: string;
}

// =========================================================
// ERROR HELPER
// =========================================================

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const err = error as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
        };
      };
      message?: unknown;
    };

    const responseMessage =
      err.response?.data?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (
            typeof item === "object" &&
            item !== null
          ) {
            return JSON.stringify(item);
          }

          return String(item);
        })
        .join(", ");
    }

    if (
      typeof responseMessage === "string"
    ) {
      return responseMessage;
    }

    if (
      typeof err.response?.data?.error ===
      "string"
    ) {
      return err.response.data.error;
    }

    if (
      typeof err.message === "string"
    ) {
      return err.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "Something went wrong";
    }
  }

  return "Something went wrong";
}

// =========================================================
// PAGE
// =========================================================

export default function CreatePurchaseReturnPage() {
  // =======================================================
  // DATA
  // =======================================================

  const [orders, setOrders] = useState<
    PurchaseOrder[]
  >([]);

  const [invoices, setInvoices] = useState<
    PurchaseInvoice[]
  >([]);

  const [grns, setGrns] = useState<GRN[]>([]);

  const [locations, setLocations] = useState<
    Location[]
  >([]);

  // =======================================================
  // FORM
  // =======================================================

  const [purchaseOrderId, setPurchaseOrderId] =
    useState("");

  const [invoiceId, setInvoiceId] =
    useState("");

  const [locationId, setLocationId] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [items, setItems] = useState<
    ReturnItem[]
  >([]);

  // =======================================================
  // UI
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =======================================================
  // LOAD INITIAL DATA
  // =======================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [
        ordersData,
        invoicesData,
        grnsData,
        locationsData,
      ] = await Promise.all([
        purchasingService.getOrders(),
        purchasingService.getInvoices(),
        purchasingService.getGRNs(),
        purchasingService.getLocations(),
      ]);

      setOrders(
        Array.isArray(ordersData)
          ? ordersData
          : []
      );

      setInvoices(
        Array.isArray(invoicesData)
          ? invoicesData
          : []
      );

      setGrns(
        Array.isArray(grnsData)
          ? grnsData
          : []
      );

      setLocations(
        Array.isArray(locationsData)
          ? locationsData
          : []
      );
    } catch (err) {
      const message =
        getErrorMessage(err);

      console.error(
        "Load purchase return data error:",
        err
      );

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // SELECTED ORDER
  // =======================================================

  const selectedOrder =
    useMemo(() => {
      if (!purchaseOrderId) {
        return null;
      }

      return (
        orders.find(
          (order) =>
            order.id ===
            Number(purchaseOrderId)
        ) ?? null
      );
    }, [
      orders,
      purchaseOrderId,
    ]);

  // =======================================================
  // FILTER INVOICES BY ORDER
  // =======================================================

  const availableInvoices =
    useMemo(() => {
      if (!purchaseOrderId) {
        return [];
      }

      return invoices.filter(
        (invoice) =>
          invoice.purchaseOrderId ===
          Number(purchaseOrderId)
      );
    }, [
      invoices,
      purchaseOrderId,
    ]);

  // =======================================================
  // FILTER GRNs BY ORDER
  // =======================================================

  const availableGrns =
    useMemo(() => {
      if (!purchaseOrderId) {
        return [];
      }

      return grns.filter(
        (grn) =>
          grn.purchaseOrderId ===
          Number(purchaseOrderId)
      );
    }, [
      grns,
      purchaseOrderId,
    ]);

  // =======================================================
  // ORDER PRODUCTS
  // =======================================================

  const productOptions =
    useMemo<ProductOption[]>(() => {
      if (!selectedOrder) {
        return [];
      }

      return selectedOrder.items.map(
        (item) => ({
          id: item.productId,
          productCode:
            item.product?.productCode ??
            "N/A",
          productName:
            item.product?.productName ??
            item.product?.name ??
            "Unknown Product",
        })
      );
    }, [selectedOrder]);

  // =======================================================
  // CHANGE PURCHASE ORDER
  // =======================================================

  function handleOrderChange(
    value: string
  ) {
    setPurchaseOrderId(value);

    // Reset dependent fields
    setInvoiceId("");
    setItems([]);
  }

  // =======================================================
  // ADD ITEM
  // =======================================================

  function addItem() {
    if (
      productOptions.length === 0
    ) {
      setError(
        "No products are available for this purchase order."
      );
      return;
    }

    const existingIds =
      items.map(
        (item) => item.productId
      );

    const availableProduct =
      productOptions.find(
        (product) =>
          !existingIds.includes(
            product.id
          )
      );

    if (!availableProduct) {
      setError(
        "All products have already been added."
      );
      return;
    }

    setError("");

    setItems((current) => [
      ...current,
      {
        id:
          `${Date.now()}-${Math.random()}`,
        productId:
          availableProduct.id,
        quantity: 1,
      },
    ]);
  }

  // =======================================================
  // REMOVE ITEM
  // =======================================================

  function removeItem(
    id: string
  ) {
    setItems((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    );
  }

  // =======================================================
  // UPDATE ITEM PRODUCT
  // =======================================================

  function updateItemProduct(
    id: string,
    productId: string
  ) {
    const duplicate =
      items.some(
        (item) =>
          item.id !== id &&
          item.productId ===
            productId
      );

    if (duplicate) {
      setError(
        "This product has already been added."
      );
      return;
    }

    setError("");

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              productId,
            }
          : item
      )
    );
  }

  // =======================================================
  // UPDATE QUANTITY
  // =======================================================

  function updateItemQuantity(
    id: string,
    value: string
  ) {
    const quantity =
      Number(value);

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                Number.isFinite(
                  quantity
                ) &&
                quantity >= 1
                  ? Math.floor(
                      quantity
                    )
                  : 1,
            }
          : item
      )
    );
  }

  // =======================================================
  // RESET FORM
  // =======================================================

  function resetForm() {
    setPurchaseOrderId("");
    setInvoiceId("");
    setLocationId("");
    setReason("");
    setItems([]);
    setError("");
    setSuccess("");
  }

  // =======================================================
  // VALIDATE FORM
  // =======================================================

  function validateForm():
    string | null {
    if (!purchaseOrderId) {
      return "Please select a purchase order.";
    }

    if (!locationId) {
      return "Please select a location.";
    }

    if (
      !items ||
      items.length === 0
    ) {
      return "Please add at least one product.";
    }

    const productIds =
      items.map(
        (item) => item.productId
      );

    const uniqueProductIds =
      new Set(productIds);

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      return "Duplicate products are not allowed.";
    }

    for (const item of items) {
      if (!item.productId) {
        return "Please select a product for every return item.";
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity < 1
      ) {
        return "Return quantity must be at least 1.";
      }
    }

    return null;
  }

  // =======================================================
  // SUBMIT
  // =======================================================

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    try {
      setSubmitting(true);

      // ===================================================
      // EXACT BACKEND DTO PAYLOAD
      // ===================================================

      const payload: CreateReturnPayload =
        {
          purchaseOrderId:
            Number(
              purchaseOrderId
            ),

          ...(invoiceId
            ? {
                invoiceId:
                  Number(
                    invoiceId
                  ),
              }
            : {}),

          locationId:
            String(locationId),

          ...(reason.trim()
            ? {
                reason:
                  reason.trim(),
              }
            : {}),

          items: items.map(
            (item) => ({
              productId:
                String(
                  item.productId
                ),
              quantity:
                Number(
                  item.quantity
                ),
            })
          ),
        };

      console.log(
        "CREATE PURCHASE RETURN PAYLOAD:",
        payload
      );

      const createdReturn =
        await purchasingService.createReturn(
          payload
        );

      console.log(
        "PURCHASE RETURN CREATED:",
        createdReturn
      );

      setSuccess(
        `Purchase return ${
          createdReturn?.returnNumber ??
          ""
        } created successfully.`
      );

      // ===================================================
      // RESET AFTER SUCCESS
      // ===================================================

      setPurchaseOrderId("");
      setInvoiceId("");
      setLocationId("");
      setReason("");
      setItems([]);

      // ===================================================
      // REDIRECT
      // ===================================================

      setTimeout(() => {
        window.location.href =
          "/dashboard/purchasing/returns";
      }, 1200);
    } catch (err) {
      console.error(
        "CREATE PURCHASE RETURN ERROR:",
        err
      );

      const message =
        getErrorMessage(err);

      console.error(
        "FINAL ERROR MESSAGE:",
        message
      );

      setError(
        message ||
          "Failed to create purchase return."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex items-center justify-center py-32">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2
                className="h-6 w-6 animate-spin"
              />
              <span>
                Loading purchase return data...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-6 py-8">
 {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="flex items-center gap-2 text-sm text-gray-500">

        <Link
          href="/dashboard/purchasing"
          className="transition-colors hover:text-orange-600"
        >
          Purchasing
        </Link>

        <ChevronRight className="h-4 w-4 text-gray-400" />

 <Link
          href="/dashboard/purchasing/returns"
          className="transition-colors hover:text-orange-600"
        >
          Purchasing Returns
        </Link>
    
        <ChevronRight className="h-4 w-4 text-gray-400" />

        <span className="font-medium text-gray-900">
          Create Purchase Returns
        </span>
      </div>
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
    
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <RotateCcw className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Create Purchase Return
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Return purchased products to the supplier.
                </p>
              </div>
            </div>
        </div>

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <div className="mt-0.5">
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <p className="text-sm font-medium">
              {success}
            </p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to create purchase return
                </p>

                <p className="mt-1 text-sm">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              RETURN INFORMATION
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <RotateCcw className="h-5 w-5 text-slate-700" />

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Return Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select the purchase order, invoice and return location.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">

              {/* PURCHASE ORDER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Purchase Order
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <ShoppingCart className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    value={
                      purchaseOrderId
                    }
                    onChange={(e) =>
                      handleOrderChange(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Select purchase order
                    </option>

                    {orders.map(
                      (order) => (
                        <option
                          key={order.id}
                          value={order.id}
                        >
                          {order.poNumber}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {!purchaseOrderId && (
                  <p className="mt-2 text-xs text-slate-500">
                    Select a purchase order first.
                  </p>
                )}
              </div>

              {/* INVOICE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Purchase Invoice
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    value={invoiceId}
                    onChange={(e) =>
                      setInvoiceId(
                        e.target.value
                      )
                    }
                    disabled={
                      !purchaseOrderId
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">
                      Select invoice
                    </option>

                    {availableInvoices.map(
                      (invoice) => (
                        <option
                          key={invoice.id}
                          value={invoice.id}
                        >
                          {invoice.invoiceNumber}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {purchaseOrderId &&
                  availableInvoices.length ===
                    0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      No invoice found for this purchase order. You can continue without an invoice.
                    </p>
                  )}
              </div>

              {/* LOCATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Return Location
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    value={locationId}
                    onChange={(e) =>
                      setLocationId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Select location
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={location.id}
                          value={location.id}
                        >
                          {location.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* REASON */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Return Reason
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <input
                  type="text"
                  value={reason}
                  onChange={(e) =>
                    setReason(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Damaged books"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          {selectedOrder && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50">
              <div className="grid gap-4 p-5 sm:grid-cols-3">

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Purchase Order
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedOrder.poNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Order Items
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedOrder.items?.length ??
                      0}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Order Status
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedOrder.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              RETURN ITEMS
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-slate-700" />

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Return Items
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select products and specify the quantity to return.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                disabled={
                  !purchaseOrderId ||
                  productOptions.length ===
                    0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            <div className="p-6">

              {!purchaseOrderId ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <Package className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-3 font-medium text-slate-700">
                    Select a purchase order
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Products from the selected purchase order will be available here.
                  </p>
                </div>
              ) : items.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <Package className="mx-auto h-10 w-10 text-slate-300" />

                  <p className="mt-3 font-medium text-slate-700">
                    No return items added
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Click “Add Item” to select a product.
                  </p>

                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Item
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          #
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Product
                        </th>

                        <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Return Quantity
                        </th>

                        <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-3 py-4 text-sm text-slate-500">
                              {index + 1}
                            </td>

                            <td className="px-3 py-4">
                              <select
                                value={
                                  item.productId
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateItemProduct(
                                    item.id,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                              >
                                {productOptions.map(
                                  (
                                    product
                                  ) => (
                                    <option
                                      key={
                                        product.id
                                      }
                                      value={
                                        product.id
                                      }
                                    >
                                      {product.productCode}{" "}
                                      -{" "}
                                      {
                                        product.productName
                                      }
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="px-3 py-4">
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateItemQuantity(
                                    item.id,
                                    e.target.value
                                  )
                                }
                                className="w-40 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                              />
                            </td>

                            <td className="px-3 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    item.id
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              GRN INFORMATION
          ================================================= */}

          {purchaseOrderId && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50">
              <div className="flex gap-3 p-5">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <div>
                  <h3 className="text-sm font-semibold text-blue-900">
                    Goods Received Information
                  </h3>

                  <p className="mt-1 text-sm text-blue-800">
                    {availableGrns.length > 0
                      ? `${availableGrns.length} GRN(s) found for this purchase order. The backend will validate the returned quantity against received stock.`
                      : "No GRN was found for this purchase order. Make sure the goods have been received before creating a return."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

            <Link
              href="/dashboard/purchasing/returns"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={resetForm}
              disabled={
                submitting
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Return
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
