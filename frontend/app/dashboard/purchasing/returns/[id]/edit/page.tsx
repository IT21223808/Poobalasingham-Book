"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  XCircle,
  Package,
  RefreshCw,
  ChevronRight
} from "lucide-react";

import {
  purchasingService,
  PurchaseReturn,
  PurchaseOrder,
  PurchaseInvoice,
  Product,
  Location,
} from "@/services/purchasing.service";

interface ReturnItemForm {
  productId: string;
  quantity: number;
}

export default function EditPurchaseReturnPage() {
  const params = useParams();
  const router = useRouter();

  const returnId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [purchaseReturn, setPurchaseReturn] =
    useState<PurchaseReturn | null>(null);

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [purchaseOrderId, setPurchaseOrderId] =
    useState<number | "">("");

  const [invoiceId, setInvoiceId] =
    useState<number | "">("");

  const [locationId, setLocationId] =
    useState<string>("");

  const [reason, setReason] =
    useState("");

  const [items, setItems] = useState<ReturnItemForm[]>([]);

  // =========================================================
  // ERROR HANDLER
  // =========================================================

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error && err.message) {
      return err.message;
    }

    if (typeof err === "string") {
      return err;
    }

    if (typeof err === "object" && err !== null) {
      const obj = err as any;

      const message =
        obj?.response?.data?.message ??
        obj?.response?.data?.error ??
        obj?.message ??
        obj?.error;

      if (Array.isArray(message)) {
        return message.join(", ");
      }

      if (typeof message === "string") {
        return message;
      }

      if (message && typeof message === "object") {
        if (Array.isArray(message.message)) {
          return message.message.join(", ");
        }

        if (typeof message.message === "string") {
          return message.message;
        }

        if (typeof message.error === "string") {
          return message.error;
        }
      }
    }

    return "Something went wrong. Please try again.";
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    if (!returnId || Number.isNaN(returnId)) {
      setError("Invalid purchase return ID.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          returnData,
          ordersData,
          invoicesData,
          locationsData,
        ] = await Promise.all([
          purchasingService.getReturn(returnId),
          purchasingService.getOrders(),
          purchasingService.getInvoices(),
          purchasingService.getLocations(),
        ]);

        setPurchaseReturn(returnData);
        setOrders(ordersData || []);
        setInvoices(invoicesData || []);
        setLocations(locationsData || []);

        setPurchaseOrderId(
          returnData.purchaseOrderId ?? ""
        );

        setInvoiceId(
          returnData.invoiceId ?? ""
        );

        const returnDataAny = returnData as any;

        setLocationId(
          returnDataAny.locationId
            ? String(returnDataAny.locationId)
            : ""
        );

        setReason(returnData.reason || "");

        setItems(
          (returnData.items || []).map((item) => ({
            productId: String(item.productId),
            quantity: Number(item.quantity),
          }))
        );
      } catch (err) {
        console.error(
          "Load purchase return error:",
          err
        );

        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [returnId]);

  // =========================================================
  // PRODUCTS
  // =========================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products`
        );

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setProducts(productList);
      } catch (err) {
        console.error(
          "Load products error:",
          err
        );
      }
    };

    loadProducts();
  }, []);

  // =========================================================
  // SELECTED ORDER
  // =========================================================

  const selectedOrder = useMemo(() => {
    if (!purchaseOrderId) {
      return null;
    }

    return (
      orders.find(
        (order) =>
          Number(order.id) ===
          Number(purchaseOrderId)
      ) || null
    );
  }, [orders, purchaseOrderId]);

  // =========================================================
  // AVAILABLE INVOICES
  // =========================================================

  const availableInvoices = useMemo(() => {
    if (!purchaseOrderId) {
      return [];
    }

    return invoices.filter(
      (invoice) =>
        Number(invoice.purchaseOrderId) ===
        Number(purchaseOrderId)
    );
  }, [invoices, purchaseOrderId]);

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addItem = () => {
    setError("");

    setItems((prev) => [
      ...prev,
      {
        productId: "",
        quantity: 1,
      },
    ]);
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeItem = (index: number) => {
    setItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  // =========================================================
  // UPDATE ITEM
  // =========================================================

  const updateItem = (
    index: number,
    field: keyof ReturnItemForm,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]:
            field === "quantity"
              ? Number(value)
              : value,
        };
      })
    );
  };

  // =========================================================
  // CHANGE PURCHASE ORDER
  // =========================================================

  const handlePurchaseOrderChange = (
    value: string
  ) => {
    const id = value ? Number(value) : "";

    setPurchaseOrderId(id);

    /*
     * Existing invoice is only valid for the selected PO.
     */
    if (id === "") {
      setInvoiceId("");
    } else {
      const validInvoice = invoices.find(
        (invoice) =>
          Number(invoice.id) ===
            Number(invoiceId) &&
          Number(invoice.purchaseOrderId) ===
            Number(id)
      );

      if (!validInvoice) {
        setInvoiceId("");
      }
    }

    /*
     * Product list will be cleared because products
     * should belong to the selected PO.
     */
    setItems((prev) => prev);
  };

  // =========================================================
  // VALIDATE
  // =========================================================

  const validateForm = (): string | null => {
    if (!purchaseOrderId) {
      return "Purchase order is required.";
    }

    if (!locationId) {
      return "Location is required.";
    }

    if (!items.length) {
      return "At least one return item is required.";
    }

    const productIds = items.map(
      (item) => item.productId
    );

    if (productIds.some((id) => !id)) {
      return "Please select a product for every item.";
    }

    const duplicateProducts = new Set<string>();

    for (const productId of productIds) {
      if (duplicateProducts.has(productId)) {
        return "Duplicate products are not allowed.";
      }

      duplicateProducts.add(productId);
    }

    for (const item of items) {
      if (
        !Number.isFinite(item.quantity) ||
        item.quantity < 1
      ) {
        return "Return quantity must be at least 1.";
      }
    }

    return null;
  };

  // =========================================================
  // UPDATE RETURN
  // =========================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        purchaseOrderId: Number(purchaseOrderId),

        ...(invoiceId
          ? {
              invoiceId: Number(invoiceId),
            }
          : {}),

        locationId: String(locationId),

        ...(reason.trim()
          ? {
              reason: reason.trim(),
            }
          : {}),

        items: items.map((item) => ({
          productId: String(item.productId),
          quantity: Number(item.quantity),
        })),
      };

      console.log(
        "UPDATE PURCHASE RETURN PAYLOAD:",
        payload
      );

      /*
       * Your current purchasingService does not have
       * updateReturn() yet.
       *
       * Once backend PUT/PATCH /purchasing/returns/:id
       * is available, add updateReturn() to the service
       * and use it here.
       */

      const service = purchasingService as any;

      if (
        typeof service.updateReturn !==
        "function"
      ) {
        throw new Error(
          "updateReturn API is not available in purchasing.service.ts. Add the backend PUT/PATCH returns/:id endpoint first."
        );
      }

      await service.updateReturn(
        returnId,
        payload
      );

      setSuccess(
        "Purchase return updated successfully."
      );

      setTimeout(() => {
        router.push(
          `/dashboard/purchasing/returns/${returnId}`
        );
      }, 800);
    } catch (err) {
      console.error(
        "Update purchase return error:",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="mr-3 h-6 w-6 animate-spin text-gray-500" />
            <span className="text-gray-600">
              Loading purchase return...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!purchaseReturn) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">
              {error || "Purchase return not found."}
            </p>

            <Link
              href="/dashboard/purchasing/returns"
              className="mt-4 inline-flex items-center text-sm font-medium text-red-700 hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Returns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // CANCELLED / COMPLETED
  // =========================================================

  const isCancelled =
    purchaseReturn.status === "CANCELLED";

  const isCompleted =
    purchaseReturn.status === "COMPLETED";

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* HEADER */}
<div className="mb-6">
  {/* BREADCRUMB */}
  <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
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
      Purchase Returns
    </Link>

    <ChevronRight className="h-4 w-4 text-gray-400" />

    <span className="font-medium text-gray-900">
      Edit Return
    </span>
  </div>

  {/* TITLE + STATUS */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Edit Purchase Return
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        Return Number:{" "}
        <span className="font-medium text-gray-700">
          {purchaseReturn.returnNumber}
        </span>
      </p>
    </div>

    <div
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        isCancelled
          ? "bg-red-100 text-red-700"
          : isCompleted
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {purchaseReturn.status}
    </div>
  </div>
</div>

        {/* ALERT */}
        {error && (
          <div className="mb-5 flex items-start rounded-lg border border-red-200 bg-red-50 p-4">
            <XCircle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-red-600" />

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

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* RETURN INFORMATION */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  Return Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update purchase return details.
                </p>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                {/* RETURN NUMBER */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Return Number
                  </label>

                  <input
                    type="text"
                    value={purchaseReturn.returnNumber}
                    disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-600"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <input
                    type="text"
                    value={purchaseReturn.status}
                    disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-600"
                  />
                </div>

                {/* PURCHASE ORDER */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Purchase Order{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={purchaseOrderId}
                    onChange={(e) =>
                      handlePurchaseOrderChange(
                        e.target.value
                      )
                    }
                    disabled={isCancelled}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
                  >
                    <option value="">
                      Select purchase order
                    </option>

                    {orders.map((order) => (
                      <option
                        key={order.id}
                        value={order.id}
                      >
                        {order.poNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INVOICE */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Invoice
                  </label>

                  <select
                    value={invoiceId}
                    onChange={(e) =>
                      setInvoiceId(
                        e.target.value
                          ? Number(e.target.value)
                          : ""
                      )
                    }
                    disabled={
                      isCancelled ||
                      !purchaseOrderId
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {purchaseOrderId
                        ? "Select invoice (optional)"
                        : "Select purchase order first"}
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

                {/* LOCATION */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={locationId}
                    onChange={(e) =>
                      setLocationId(
                        e.target.value
                      )
                    }
                    disabled={isCancelled}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500"
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

                {/* REASON */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Reason
                  </label>

                  <textarea
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value)
                    }
                    disabled={isCancelled}
                    rows={3}
                    placeholder="Enter return reason..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* ORDER INFO */}
            {selectedOrder && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center border-b border-gray-200 px-6 py-4">
                  <Package className="mr-2 h-5 w-5 text-gray-600" />

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Purchase Order Items
                    </h2>

                    <p className="text-sm text-gray-500">
                      {selectedOrder.poNumber}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-gray-600">
                          Product
                        </th>

                        <th className="px-6 py-3 text-right font-medium text-gray-600">
                          Ordered Qty
                        </th>

                        <th className="px-6 py-3 text-right font-medium text-gray-600">
                          Unit Price
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items.map(
                        (item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-3">
                              <div className="font-medium text-gray-900">
                                {item.product
                                  ?.productName ||
                                  item.product
                                    ?.name ||
                                  item.productId}
                              </div>

                              {item.product
                                ?.productCode && (
                                <div className="text-xs text-gray-500">
                                  {
                                    item.product
                                      .productCode
                                  }
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-3 text-right">
                              {item.quantity}
                            </td>

                            <td className="px-6 py-3 text-right">
                              {Number(
                                item.unitPrice
                              ).toFixed(2)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RETURN ITEMS */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Return Items
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select products and enter return quantities.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  disabled={isCancelled}
                  className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </button>
              </div>

              <div className="p-6">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                    <Package className="mx-auto h-10 w-10 text-gray-400" />

                    <p className="mt-3 text-sm text-gray-500">
                      No return items added.
                    </p>

                    <button
                      type="button"
                      onClick={addItem}
                      disabled={isCancelled}
                      className="mt-4 text-sm font-medium text-gray-900 hover:underline"
                    >
                      Add an item
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map(
                      (item, index) => {
                        const selectedProduct =
                          products.find(
                            (product) =>
                              String(
                                product.id
                              ) ===
                              String(
                                item.productId
                              )
                          );

                        return (
                          <div
                            key={index}
                            className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_180px_auto]"
                          >
                            {/* PRODUCT */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Product
                              </label>

                              <select
                                value={
                                  item.productId
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "productId",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isCancelled
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                              >
                                <option value="">
                                  Select product
                                </option>

                                {products.map(
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
                                      {product.productName ||
                                        product.name ||
                                        product.productCode ||
                                        product.id}
                                    </option>
                                  )
                                )}
                              </select>

                              {selectedProduct && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {selectedProduct.productCode ||
                                    selectedProduct.id}
                                </p>
                              )}
                            </div>

                            {/* QUANTITY */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Return Quantity
                              </label>

                              <input
                                type="number"
                                min={1}
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  isCancelled
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                              />
                            </div>

                            {/* REMOVE */}
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                                disabled={
                                  isCancelled
                                }
                                className="inline-flex h-[42px] items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <Link
                href={`/dashboard/purchasing/returns/${returnId}`}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  saving ||
                  isCancelled
                }
                className="inline-flex items-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Return
                  </>
                )}
              </button>
            </div>

            {isCancelled && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Cancelled purchase returns cannot be edited.
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}