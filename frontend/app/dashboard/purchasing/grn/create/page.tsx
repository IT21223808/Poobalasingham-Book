"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Package,
  Save,
  ShoppingCart,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  purchasingService,
  PurchaseOrder,
  CreateGRNPayload,
} from "@/services/purchasing.service";

interface GRNFormItem {
  productId: string;
  productName: string;
  productCode?: string;
  orderedQuantity: number;
  receivedQuantity: number;
}

export default function CreateGRNPage() {
  const router = useRouter();

  // =========================================================
  // STATE
  // =========================================================

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [items, setItems] = useState<GRNFormItem[]>([]);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loading, setLoading] = useState(false);

  // =========================================================
  // LOAD PURCHASE ORDERS
  // =========================================================

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);

        const data = await purchasingService.getOrders();

        setOrders(data);
      } catch (error) {
        console.error("Failed to load purchase orders:", error);
        alert("Failed to load purchase orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  // =========================================================
  // SELECTED ORDER
  // =========================================================

  const selectedOrder = useMemo(() => {
    return orders.find(
      (order) => String(order.id) === purchaseOrderId
    );
  }, [orders, purchaseOrderId]);

  // =========================================================
  // ORDER CHANGE
  // =========================================================

  const handleOrderChange = (value: string) => {
    setPurchaseOrderId(value);

    const order = orders.find(
      (item) => String(item.id) === value
    );

    if (!order) {
      setItems([]);
      return;
    }

    const newItems: GRNFormItem[] = order.items.map((item) => ({
      productId: item.productId,

      productName:
        item.product?.productName ||
        item.product?.name ||
        "Unknown Product",

      productCode: item.product?.productCode,

      orderedQuantity: Number(item.quantity),

      receivedQuantity: 0,
    }));

    setItems(newItems);
  };

  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  const updateQuantity = (
    index: number,
    value: number
  ) => {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item;

        const safeValue = Math.max(
          0,
          Math.min(value, item.orderedQuantity)
        );

        return {
          ...item,
          receivedQuantity: safeValue,
        };
      })
    );
  };

  const incrementQuantity = (index: number) => {
    const item = items[index];

    if (!item) return;

    updateQuantity(
      index,
      item.receivedQuantity + 1
    );
  };

  const decrementQuantity = (index: number) => {
    const item = items[index];

    if (!item) return;

    updateQuantity(
      index,
      item.receivedQuantity - 1
    );
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalItems = items.length;

  const receivedItems = items.filter(
    (item) => item.receivedQuantity > 0
  ).length;

  const totalOrderedQuantity = items.reduce(
    (total, item) =>
      total + item.orderedQuantity,
    0
  );

  const totalReceivedQuantity = items.reduce(
    (total, item) =>
      total + item.receivedQuantity,
    0
  );

  const remainingQuantity = Math.max(
    0,
    totalOrderedQuantity -
      totalReceivedQuantity
  );

  const progress =
    totalOrderedQuantity > 0
      ? Math.min(
          100,
          Math.round(
            (totalReceivedQuantity /
              totalOrderedQuantity) *
              100
          )
        )
      : 0;

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!purchaseOrderId) {
      alert("Please select a purchase order");
      return;
    }

    if (!locationId.trim()) {
      alert("Please enter location ID");
      return;
    }

    if (items.length === 0) {
      alert("No items available for this purchase order");
      return;
    }

    const validItems = items.filter(
      (item) => item.receivedQuantity > 0
    );

    if (validItems.length === 0) {
      alert(
        "Please enter received quantity for at least one item"
      );
      return;
    }

    const invalidItem = validItems.find(
      (item) =>
        item.receivedQuantity >
        item.orderedQuantity
    );

    if (invalidItem) {
      alert(
        `Received quantity cannot exceed ordered quantity for ${invalidItem.productName}`
      );
      return;
    }

    try {
      setLoading(true);

      const payload: CreateGRNPayload = {
        purchaseOrderId: Number(purchaseOrderId),

        locationId: locationId.trim(),

        items: validItems.map((item) => ({
          productId: item.productId,
          receivedQuantity:
            item.receivedQuantity,
        })),
      };

      // IMPORTANT:
      // Frontend -> purchasing.service.ts -> backend
      await purchasingService.createGRN(payload);

      alert("GRN created successfully");

      router.push(
        "/dashboard/purchasing/grn"
      );

      router.refresh();
    } catch (error: any) {
      console.error(
        "Failed to create GRN:",
        error
      );

      const message =
        error?.response?.data?.message;

      if (Array.isArray(message)) {
        alert(message.join("\n"));
      } else {
        alert(
          message ||
            "Failed to create GRN"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    router.push(
      "/dashboard/purchasing/grn"
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleCancel}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Goods Received
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Package size={21} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Create GRN
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Record goods received against a purchase order
                  </p>
                </div>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Package size={16} />
              New Goods Received Note
            </div>

          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* ================================================= */}
          {/* STEP 1 - GRN DETAILS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ShoppingCart size={18} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    GRN Details
                  </h2>

                  <p className="text-xs text-slate-500">
                    Select the purchase order and receiving location
                  </p>
                </div>

              </div>
            </div>

            <div className="p-6">

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* PURCHASE ORDER */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Purchase Order
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={purchaseOrderId}
                    onChange={(e) =>
                      handleOrderChange(
                        e.target.value
                      )
                    }
                    disabled={
                      loadingOrders ||
                      loading
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
                    required
                  >
                    <option value="">
                      {loadingOrders
                        ? "Loading purchase orders..."
                        : "Select purchase order"}
                    </option>

                    {orders
                      .filter(
                        (order) =>
                          order.status !==
                            "CANCELLED" &&
                          order.status !==
                            "RECEIVED"
                      )
                      .map((order) => (
                        <option
                          key={order.id}
                          value={order.id}
                        >
                          {order.poNumber}
                        </option>
                      ))}
                  </select>

                  {selectedOrder && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span>Status:</span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        {selectedOrder.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* LOCATION */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Receiving Location
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <MapPin
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={locationId}
                      onChange={(e) =>
                        setLocationId(
                          e.target.value
                        )
                      }
                      placeholder="Enter location UUID"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
                      required
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Stock will be added to this inventory location.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* ORDER SUMMARY */}
          {/* ================================================= */}

          {selectedOrder && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Receiving Summary
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedOrder.poNumber}
                  </p>
                </div>

                <span className="text-sm font-semibold text-blue-600">
                  {progress}% received
                </span>
              </div>

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Products
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {totalItems}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Ordered
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {totalOrderedQuantity}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-xs text-green-600">
                    Received
                  </p>
                  <p className="mt-1 text-xl font-bold text-green-700">
                    {totalReceivedQuantity}
                  </p>
                </div>

                <div className="rounded-xl bg-orange-50 p-4">
                  <p className="text-xs text-orange-600">
                    Remaining
                  </p>
                  <p className="mt-1 text-xl font-bold text-orange-700">
                    {remainingQuantity}
                  </p>
                </div>

              </div>
            </section>
          )}

          {/* ================================================= */}
          {/* ITEMS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Received Items
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the actual quantity received for each product
                </p>
              </div>

              {items.length > 0 && (
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  {receivedItems} of {totalItems} received
                </div>
              )}

            </div>

            {items.length === 0 ? (

              <div className="px-6 py-16 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Package
                    size={25}
                    className="text-slate-400"
                  />
                </div>

                <h3 className="font-semibold text-slate-900">
                  No items to receive
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  Select a purchase order above and its products will appear here.
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[760px]">

                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Product
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Ordered
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Received
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Remaining
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {items.map(
                      (item, index) => {
                        const remaining =
                          Math.max(
                            0,
                            item.orderedQuantity -
                              item.receivedQuantity
                          );

                        return (
                          <tr
                            key={`${item.productId}-${index}`}
                            className="transition hover:bg-slate-50/70"
                          >

                            {/* PRODUCT */}

                            <td className="px-6 py-5">

                              <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <Package
                                    size={18}
                                  />
                                </div>

                                <div>
                                  <p className="font-medium text-slate-900">
                                    {item.productName}
                                  </p>

                                  {item.productCode && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Code:{" "}
                                      {
                                        item.productCode
                                      }
                                    </p>
                                  )}
                                </div>

                              </div>
                            </td>

                            {/* ORDERED */}

                            <td className="px-4 py-5 text-center">
                              <span className="font-semibold text-slate-800">
                                {
                                  item.orderedQuantity
                                }
                              </span>
                            </td>

                            {/* RECEIVED */}

                            <td className="px-4 py-5">

                              <div className="flex items-center justify-center">

                                <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      decrementQuantity(
                                        index
                                      )
                                    }
                                    disabled={
                                      loading ||
                                      item.receivedQuantity <=
                                        0
                                    }
                                    className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Minus
                                      size={15}
                                    />
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    max={
                                      item.orderedQuantity
                                    }
                                    value={
                                      item.receivedQuantity
                                    }
                                    onChange={(e) =>
                                      updateQuantity(
                                        index,
                                        Number(
                                          e.target
                                            .value
                                        )
                                      )
                                    }
                                    disabled={
                                      loading
                                    }
                                    className="h-9 w-16 border-x border-slate-200 text-center text-sm font-semibold text-slate-900 outline-none"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      incrementQuantity(
                                        index
                                      )
                                    }
                                    disabled={
                                      loading ||
                                      item.receivedQuantity >=
                                        item.orderedQuantity
                                    }
                                    className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Plus
                                      size={15}
                                    />
                                  </button>

                                </div>

                              </div>
                            </td>

                            {/* REMAINING */}

                            <td className="px-4 py-5 text-center">

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                  remaining === 0
                                    ? "bg-green-50 text-green-700"
                                    : "bg-orange-50 text-orange-700"
                                }`}
                              >
                                {remaining === 0 && (
                                  <CheckCircle2
                                    size={13}
                                  />
                                )}

                                {remaining}
                              </span>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* WARNING */}
          {/* ================================================= */}

          {items.length > 0 &&
            totalReceivedQuantity === 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Received quantity required
                  </p>

                  <p className="mt-1 text-xs text-amber-700">
                    Enter the quantity received for at least one product before creating the GRN.
                  </p>
                </div>

              </div>
            )}

          {/* ================================================= */}
          {/* FOOTER ACTIONS */}
          {/* ================================================= */}

          <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-xs text-slate-500">
                  Total received
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {totalReceivedQuantity}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    units
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    items.length === 0 ||
                    totalReceivedQuantity === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />

                  {loading
                    ? "Creating..."
                    : "Create GRN"}
                </button>

              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
} 