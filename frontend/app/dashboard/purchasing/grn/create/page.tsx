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
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  purchasingService,
  PurchaseOrder,
  CreateGRNPayload,
  GRN,
  Location,
} from "@/services/purchasing.service";

// =========================================================
// TYPES
// =========================================================

interface GRNFormItem {
  productId: string;
  productName: string;
  productCode?: string;

  orderedQuantity: number;
  alreadyReceivedQuantity: number;
  receivedQuantity: number;
  remainingBeforeCurrent: number;
}

// =========================================================
// PAGE
// =========================================================

export default function CreateGRNPage() {
  const router = useRouter();

  // =========================================================
  // STATE
  // =========================================================

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [purchaseOrderId, setPurchaseOrderId] =
    useState("");

  // IMPORTANT:
  // locationId is STRING because CreateGRNPayload expects string
  const [locationId, setLocationId] =
    useState("");

  const [items, setItems] =
    useState<GRNFormItem[]>([]);

  const [loadingOrders, setLoadingOrders] =
    useState(true);

  const [loadingGRNs, setLoadingGRNs] =
    useState(true);

  const [loadingLocations, setLoadingLocations] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  // =========================================================
  // LOAD PURCHASE ORDERS
  // =========================================================

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);

        const data =
          await purchasingService.getOrders();

        setOrders(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load purchase orders:",
          error
        );

        alert(
          "Failed to load purchase orders"
        );
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, []);

  // =========================================================
  // LOAD EXISTING GRNs
  // =========================================================

  useEffect(() => {
    const loadGRNs = async () => {
      try {
        setLoadingGRNs(true);

        const data =
          await purchasingService.getGRNs();

        setGrns(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load existing GRNs:",
          error
        );

        alert(
          "Failed to load existing GRNs"
        );
      } finally {
        setLoadingGRNs(false);
      }
    };

    loadGRNs();
  }, []);

  // =========================================================
  // LOAD LOCATIONS
  // =========================================================

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoadingLocations(true);

        const data =
          await purchasingService.getLocations();

        console.log(
          "========== LOCATIONS API =========="
        );

        console.log(
          "Raw locations:",
          data
        );

        const activeLocations =
          Array.isArray(data)
            ? data.filter(
                (location) =>
                  location.isActive !== false
              )
            : [];

        console.log(
          "Active locations:",
          activeLocations
        );

        console.log(
          "Location IDs:",
          activeLocations.map(
            (location) => ({
              id: location.id,
              idAsString:
                String(location.id),
              name: location.name,
              type:
                typeof location.id,
            })
          )
        );

        setLocations(
          activeLocations
        );
      } catch (error) {
        console.error(
          "Failed to load locations:",
          error
        );

        alert(
          "Failed to load receiving locations"
        );
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
  }, []);

  // =========================================================
  // SELECTED ORDER
  // =========================================================

  const selectedOrder = useMemo(() => {
    return orders.find(
      (order) =>
        String(order.id) ===
        purchaseOrderId
    );
  }, [
    orders,
    purchaseOrderId,
  ]);

  // =========================================================
  // SELECTED LOCATION
  // =========================================================

  const selectedLocation = useMemo(() => {
    if (!locationId) {
      return undefined;
    }

    return locations.find(
      (location) =>
        String(location.id).trim() ===
        String(locationId).trim()
    );
  }, [
    locations,
    locationId,
  ]);

  // =========================================================
  // GET ALREADY RECEIVED QUANTITY
  // =========================================================

  const getAlreadyReceivedQuantity = (
    poId: number,
    productId: string
  ): number => {
    let totalReceived = 0;

    for (const grn of grns) {
      // Different PO
      if (
        Number(grn.purchaseOrderId) !==
        Number(poId)
      ) {
        continue;
      }

      // Ignore cancelled/rejected GRNs
      if (
        grn.status === "CANCELLED" ||
        grn.status === "REJECTED"
      ) {
        continue;
      }

      if (
        !Array.isArray(grn.items)
      ) {
        continue;
      }

      for (const grnItem of grn.items) {
        if (
          String(
            grnItem.productId
          ) ===
          String(productId)
        ) {
          totalReceived +=
            Number(
              grnItem.receivedQuantity || 0
            );
        }
      }
    }

    return totalReceived;
  };

  // =========================================================
  // CHECK ORDER REMAINING QUANTITY
  // =========================================================

  const getOrderRemainingQuantity = (
    order: PurchaseOrder
  ): number => {
    let remaining = 0;

    for (const item of order.items) {
      const orderedQuantity =
        Number(
          item.quantity || 0
        );

      const alreadyReceived =
        getAlreadyReceivedQuantity(
          Number(order.id),
          item.productId
        );

      remaining += Math.max(
        0,
        orderedQuantity -
          alreadyReceived
      );
    }

    return remaining;
  };

  // =========================================================
  // ORDER CHANGE
  // =========================================================

  const handleOrderChange = (
    value: string
  ) => {
    setPurchaseOrderId(value);

    const order =
      orders.find(
        (item) =>
          String(item.id) ===
          value
      );

    if (!order) {
      setItems([]);
      return;
    }

    const newItems: GRNFormItem[] =
      order.items.map(
        (item) => {
          const orderedQuantity =
            Number(
              item.quantity || 0
            );

          const alreadyReceivedQuantity =
            getAlreadyReceivedQuantity(
              Number(order.id),
              item.productId
            );

          const remainingBeforeCurrent =
            Math.max(
              0,
              orderedQuantity -
                alreadyReceivedQuantity
            );

          return {
            productId:
              item.productId,

            productName:
              item.product?.productName ||
              item.product?.name ||
              "Unknown Product",

            productCode:
              item.product?.productCode,

            orderedQuantity,

            alreadyReceivedQuantity,

            remainingBeforeCurrent,

            receivedQuantity: 0,
          };
        }
      );

    setItems(newItems);
  };

  // =========================================================
  // LOCATION CHANGE
  // =========================================================

  const handleLocationChange = (
    value: string
  ) => {
    console.log(
      "========== LOCATION CHANGED =========="
    );

    console.log(
      "Selected value:",
      value
    );

    console.log(
      "Value type:",
      typeof value
    );

    const matchedLocation =
      locations.find(
        (location) =>
          String(location.id).trim() ===
          String(value).trim()
      );

    console.log(
      "Matched location:",
      matchedLocation
    );

    setLocationId(
      String(value)
    );
  };

  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  const updateQuantity = (
    index: number,
    value: number
  ) => {
    setItems((current) =>
      current.map(
        (item, i) => {
          if (i !== index) {
            return item;
          }

          const numericValue =
            Number.isFinite(value)
              ? value
              : 0;

          const safeValue =
            Math.max(
              0,
              Math.min(
                numericValue,
                item.remainingBeforeCurrent
              )
            );

          return {
            ...item,
            receivedQuantity:
              safeValue,
          };
        }
      )
    );
  };

  // =========================================================
  // INCREMENT
  // =========================================================

  const incrementQuantity = (
    index: number
  ) => {
    const item =
      items[index];

    if (!item) {
      return;
    }

    updateQuantity(
      index,
      item.receivedQuantity + 1
    );
  };

  // =========================================================
  // DECREMENT
  // =========================================================

  const decrementQuantity = (
    index: number
  ) => {
    const item =
      items[index];

    if (!item) {
      return;
    }

    updateQuantity(
      index,
      item.receivedQuantity - 1
    );
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalItems =
    items.length;

  const receivedItems =
    items.filter(
      (item) =>
        item.receivedQuantity > 0
    ).length;

  const totalOrderedQuantity =
    items.reduce(
      (total, item) =>
        total +
        item.orderedQuantity,
      0
    );

  const totalAlreadyReceivedQuantity =
    items.reduce(
      (total, item) =>
        total +
        item.alreadyReceivedQuantity,
      0
    );

  const totalCurrentReceivedQuantity =
    items.reduce(
      (total, item) =>
        total +
        item.receivedQuantity,
      0
    );

  const totalReceivedQuantity =
    totalAlreadyReceivedQuantity +
    totalCurrentReceivedQuantity;

  const remainingQuantity =
    Math.max(
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

  const allFullyReceived =
    items.length > 0 &&
    items.every(
      (item) =>
        item.remainingBeforeCurrent ===
        0
    );

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    // =======================================================
    // PURCHASE ORDER VALIDATION
    // =======================================================

    if (!purchaseOrderId) {
      alert(
        "Please select a purchase order"
      );
      return;
    }

    const numericPurchaseOrderId =
      Number(
        purchaseOrderId
      );

    if (
      !Number.isInteger(
        numericPurchaseOrderId
      ) ||
      numericPurchaseOrderId <= 0
    ) {
      alert(
        "Please select a valid purchase order"
      );
      return;
    }

    // =======================================================
    // LOCATION VALIDATION
    // =======================================================

    console.log(
      "=========================================="
    );

    console.log(
      "LOCATION VALIDATION"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "locationId:",
      locationId
    );

    console.log(
      "locationId type:",
      typeof locationId
    );

    console.log(
      "locations:",
      locations
    );

    console.log(
      "selectedLocation:",
      selectedLocation
    );

    // -------------------------------------------------------
    // 1. Check empty
    // -------------------------------------------------------

    if (
      !locationId ||
      locationId.trim() === ""
    ) {
      console.error(
        "❌ Location ID is empty"
      );

      alert(
        "Please select a receiving location"
      );

      return;
    }

    // -------------------------------------------------------
    // 2. Find location from loaded locations
    // -------------------------------------------------------

    const selectedLocationForSubmit =
      locations.find(
        (location) =>
          String(
            location.id
          ).trim() ===
          String(
            locationId
          ).trim()
      );

    console.log(
      "Selected location for submit:",
      selectedLocationForSubmit
    );

    // -------------------------------------------------------
    // 3. Check location exists
    // -------------------------------------------------------

    if (
      !selectedLocationForSubmit
    ) {
      console.error(
        "❌ Location does not exist in locations list"
      );

      console.error(
        "Selected locationId:",
        locationId
      );

      console.error(
        "Available location IDs:",
        locations.map(
          (location) =>
            String(
              location.id
            )
        )
      );

      alert(
        "Please select a valid receiving location"
      );

      return;
    }

    // -------------------------------------------------------
    // 4. Check active
    // -------------------------------------------------------

    if (
      selectedLocationForSubmit.isActive ===
      false
    ) {
      console.error(
        "❌ Selected location is inactive"
      );

      alert(
        "Selected receiving location is inactive"
      );

      return;
    }

    console.log(
      "✅ Location validation passed"
    );

    console.log(
      "Location ID:",
      String(
        selectedLocationForSubmit.id
      )
    );

    console.log(
      "Location Name:",
      selectedLocationForSubmit.name
    );

    // =======================================================
    // ITEMS VALIDATION
    // =======================================================

    if (items.length === 0) {
      alert(
        "No items available for this purchase order"
      );
      return;
    }

    // =======================================================
    // FULLY RECEIVED VALIDATION
    // =======================================================

    if (allFullyReceived) {
      alert(
        "This purchase order is already fully received"
      );
      return;
    }

    // =======================================================
    // VALID ITEMS
    // =======================================================

    const validItems =
      items.filter(
        (item) =>
          item.receivedQuantity > 0
      );

    if (
      validItems.length === 0
    ) {
      alert(
        "Please enter received quantity for at least one item"
      );
      return;
    }

    // =======================================================
    // QUANTITY VALIDATION
    // =======================================================

    const invalidItem =
      validItems.find(
        (item) =>
          item.receivedQuantity >
          item.remainingBeforeCurrent
      );

    if (invalidItem) {
      alert(
        `${invalidItem.productName}: only ${invalidItem.remainingBeforeCurrent} units remaining`
      );

      return;
    }

    // =======================================================
    // POSITIVE INTEGER VALIDATION
    // =======================================================

    const invalidQuantity =
      validItems.find(
        (item) =>
          !Number.isInteger(
            item.receivedQuantity
          ) ||
          item.receivedQuantity <=
            0
      );

    if (invalidQuantity) {
      alert(
        `${invalidQuantity.productName}: received quantity must be a positive whole number`
      );

      return;
    }

    // =======================================================
    // CREATE GRN
    // =======================================================

    try {
      setLoading(true);

      // IMPORTANT:
      // CreateGRNPayload.locationId = string
      const payload: CreateGRNPayload = {
        purchaseOrderId:
          numericPurchaseOrderId,

        locationId:
          String(
            selectedLocationForSubmit.id
          ),

        items:
          validItems.map(
            (item) => ({
              productId:
                item.productId,

              receivedQuantity:
                item.receivedQuantity,
            })
          ),
      };

      // =====================================================
      // FINAL DEBUG
      // =====================================================

      console.log(
        "=========================================="
      );

      console.log(
        "CREATE GRN PAYLOAD"
      );

      console.log(
        "=========================================="
      );

      console.log(
        "Purchase Order ID:",
        payload.purchaseOrderId,
        "Type:",
        typeof payload.purchaseOrderId
      );

      console.log(
        "Location ID:",
        payload.locationId,
        "Type:",
        typeof payload.locationId
      );

      console.log(
        "Location Name:",
        selectedLocationForSubmit.name
      );

      console.log(
        "Items:",
        payload.items
      );

      console.log(
        "Full Payload:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      // =====================================================
      // API CALL
      // =====================================================

      await purchasingService.createGRN(
        payload
      );

      alert(
        "GRN created successfully"
      );

      // =====================================================
      // REDIRECT
      // =====================================================

      router.push(
        "/dashboard/purchasing/grn"
      );

      router.refresh();

    } catch (error: any) {
      console.error(
        "Failed to create GRN:",
        error
      );

      console.error(
        "GRN error response:",
        error?.response?.data
      );

      const message =
        error?.response?.data?.message ||
        error?.message;

      if (
        Array.isArray(message)
      ) {
        alert(
          message.join("\n")
        );
      } else if (
        typeof message ===
          "object" &&
        message !== null
      ) {
        alert(
          JSON.stringify(
            message
          )
        );
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
          {/* GRN DETAILS */}
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
                      loadingGRNs ||
                      loading
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
                    required
                  >

                    <option value="">

                      {loadingOrders ||
                      loadingGRNs
                        ? "Loading purchase orders..."
                        : "Select purchase order"}

                    </option>

                    {orders
                      .filter(
                        (order) =>
                          order.status !==
                            "CANCELLED" &&
                          order.status !==
                            "RECEIVED" &&
                          getOrderRemainingQuantity(
                            order
                          ) > 0
                      )
                      .map(
                        (order) => (
                          <option
                            key={
                              order.id
                            }
                            value={
                              String(
                                order.id
                              )
                            }
                          >
                            {
                              order.poNumber
                            }
                          </option>
                        )
                      )}

                  </select>

                  {selectedOrder && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">

                      <span>
                        Status:
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        {
                          selectedOrder.status
                        }
                      </span>

                    </div>
                  )}

                </div>

                {/* RECEIVING LOCATION */}

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
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={locationId}
                      onChange={(e) =>
                        handleLocationChange(
                          e.target.value
                        )
                      }
                      disabled={
                        loadingLocations ||
                        loading
                      }
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
                      required
                    >

                      <option value="">

                        {loadingLocations
                          ? "Loading locations..."
                          : locations.length ===
                              0
                          ? "No locations available"
                          : "Select receiving location"}

                      </option>

                      {locations.map(
                        (location) => (
                          <option
                            key={
                              String(
                                location.id
                              )
                            }
                            value={
                              String(
                                location.id
                              )
                            }
                          >
                            {
                              location.name
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* SELECTED LOCATION */}

                  {selectedLocation && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600">

                      <CheckCircle2
                        size={14}
                      />

                      <span>
                        Stock will be received at{" "}
                        <strong>
                          {
                            selectedLocation.name
                          }
                        </strong>
                      </span>

                    </div>
                  )}

                  {/* NO SELECTION */}

                  {!selectedLocation &&
                    !loadingLocations &&
                    locations.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Select the location where the received stock will be stored.
                      </p>
                    )}

                  {/* NO LOCATIONS */}

                  {!loadingLocations &&
                    locations.length ===
                      0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No active inventory locations found.
                      </p>
                    )}

                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* RECEIVING SUMMARY */}
          {/* ================================================= */}

          {selectedOrder && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h2 className="font-semibold text-slate-900">
                    Receiving Summary
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      selectedOrder.poNumber
                    }
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

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

                {/* PRODUCTS */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-500">
                    Products
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {
                      totalItems
                    }
                  </p>

                </div>

                {/* ORDERED */}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-500">
                    Ordered
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {
                      totalOrderedQuantity
                    }
                  </p>

                </div>

                {/* PREVIOUSLY RECEIVED */}

                <div className="rounded-xl bg-blue-50 p-4">

                  <p className="text-xs text-blue-600">
                    Previously Received
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-700">
                    {
                      totalAlreadyReceivedQuantity
                    }
                  </p>

                </div>

                {/* CURRENT */}

                <div className="rounded-xl bg-green-50 p-4">

                  <p className="text-xs text-green-600">
                    Receiving Now
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-700">
                    {
                      totalCurrentReceivedQuantity
                    }
                  </p>

                </div>

                {/* REMAINING */}

                <div className="rounded-xl bg-orange-50 p-4">

                  <p className="text-xs text-orange-600">
                    Remaining
                  </p>

                  <p className="mt-1 text-xl font-bold text-orange-700">
                    {
                      remainingQuantity
                    }
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

                  {
                    receivedItems
                  }{" "}
                  of{" "}
                  {
                    totalItems
                  }{" "}
                  receiving now

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

                <table className="w-full min-w-[950px]">

                  <thead className="bg-slate-50">

                    <tr>

                      <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Product
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Ordered
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Already Received
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Receive Now
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Remaining
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {items.map(
                      (
                        item,
                        index
                      ) => {

                        const remainingAfterCurrent =
                          Math.max(
                            0,
                            item.remainingBeforeCurrent -
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
                                    {
                                      item.productName
                                    }
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

                            {/* ALREADY RECEIVED */}

                            <td className="px-4 py-5 text-center">

                              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                {
                                  item.alreadyReceivedQuantity
                                }
                              </span>

                            </td>

                            {/* RECEIVE NOW */}

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
                                        0 ||
                                      item.remainingBeforeCurrent ===
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
                                      item.remainingBeforeCurrent
                                    }
                                    value={
                                      item.receivedQuantity
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateQuantity(
                                        index,
                                        Number(
                                          e.target
                                            .value
                                        )
                                      )
                                    }
                                    disabled={
                                      loading ||
                                      item.remainingBeforeCurrent ===
                                        0
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
                                        item.remainingBeforeCurrent
                                    }
                                    className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                                  >

                                    <Plus
                                      size={15}
                                    />

                                  </button>

                                </div>

                              </div>

                              {item.remainingBeforeCurrent ===
                                0 && (
                                <p className="mt-2 text-center text-xs font-medium text-green-600">
                                  Fully received
                                </p>
                              )}

                            </td>

                            {/* REMAINING */}

                            <td className="px-4 py-5 text-center">

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                  remainingAfterCurrent ===
                                  0
                                    ? "bg-green-50 text-green-700"
                                    : "bg-orange-50 text-orange-700"
                                }`}
                              >

                                {remainingAfterCurrent ===
                                  0 && (
                                  <CheckCircle2
                                    size={13}
                                  />
                                )}

                                {
                                  remainingAfterCurrent
                                }

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
            totalCurrentReceivedQuantity ===
              0 && (
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
          {/* FULLY RECEIVED */}
          {/* ================================================= */}

          {items.length > 0 &&
            allFullyReceived && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">

                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-green-600"
                />

                <div>

                  <p className="text-sm font-semibold text-green-800">
                    Purchase order fully received
                  </p>

                  <p className="mt-1 text-xs text-green-700">
                    All ordered quantities have already been received. No additional GRN can be created for this purchase order.
                  </p>

                </div>

              </div>
            )}

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs text-slate-500">
                  Receiving now
                </p>

                <p className="text-lg font-bold text-slate-900">

                  {
                    totalCurrentReceivedQuantity
                  }{" "}

                  <span className="text-sm font-normal text-slate-500">
                    units
                  </span>

                </p>

                <p className="mt-1 text-xs text-slate-500">

                  Total received after this GRN:{" "}

                  <span className="font-semibold text-slate-700">
                    {
                      totalReceivedQuantity
                    }
                  </span>

                  {" / "}

                  {
                    totalOrderedQuantity
                  }

                </p>

              </div>

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  disabled={loading}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    items.length ===
                      0 ||
                    totalCurrentReceivedQuantity ===
                      0 ||
                    !purchaseOrderId ||
                    !locationId ||
                    allFullyReceived
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {loading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

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