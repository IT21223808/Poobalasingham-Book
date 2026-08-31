"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import {
  purchasingService,
  GRN,
  PurchaseOrder,
  Location,
  CreateGRNPayload,
} from "@/services/purchasing.service";

interface EditItem {
  productId: string;
  productName: string;
  productCode?: string;

  orderedQuantity: number;
  receivedQuantity: number;
  alreadyReceivedQuantity: number;
  maxReceivableQuantity: number;
}

export default function EditGRNPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [grn, setGrn] = useState<GRN | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [items, setItems] = useState<EditItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // LIST PAGE ROUTE
  // =========================================================

  const grnListRoute =
    "/dashboard/purchasing/grn";

  // =========================================================
  // LOAD GRN + ORDERS + LOCATIONS
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [
          grnData,
          ordersData,
          locationsData,
        ] = await Promise.all([
          purchasingService.getGRN(id),
          purchasingService.getOrders(),
          purchasingService.getLocations(),
        ]);

        setGrn(grnData);

        setOrders(
          Array.isArray(ordersData)
            ? ordersData
            : []
        );

        const activeLocations =
          Array.isArray(locationsData)
            ? locationsData.filter(
                (location) =>
                  location.isActive !== false
              )
            : [];

        setLocations(activeLocations);

        // =====================================================
        // PURCHASE ORDER
        // =====================================================

        setPurchaseOrderId(
          String(grnData.purchaseOrderId)
        );

        // =====================================================
        // LOCATION
        // =====================================================

        const grnLocationId =
          (grnData as any).locationId;

        if (
          grnLocationId !== undefined &&
          grnLocationId !== null
        ) {
          setLocationId(
            String(grnLocationId)
          );
        } else {
          setLocationId("");
        }

        // =====================================================
        // FIND PURCHASE ORDER
        // =====================================================

        const order =
          ordersData.find(
            (order) =>
              Number(order.id) ===
              Number(
                grnData.purchaseOrderId
              )
          );

        if (!order) {
          throw new Error(
            "Purchase order not found"
          );
        }

        // =====================================================
        // BUILD ITEMS
        // =====================================================

        const newItems: EditItem[] =
          await Promise.all(
            order.items.map(
              async (orderItem) => {
                const currentGRNItem =
                  grnData.items.find(
                    (grnItem) =>
                      String(
                        grnItem.productId
                      ) ===
                      String(
                        orderItem.productId
                      )
                  );

                const currentGRNQuantity =
                  Number(
                    currentGRNItem?.receivedQuantity ||
                      0
                  );

                let alreadyReceivedQuantity =
                  0;

                try {
                  const itemWithExtraData =
                    currentGRNItem as any;

                  if (
                    itemWithExtraData
                      ?.alreadyReceivedQuantity !==
                    undefined
                  ) {
                    alreadyReceivedQuantity =
                      Number(
                        itemWithExtraData
                          .alreadyReceivedQuantity
                      );
                  }
                } catch {
                  alreadyReceivedQuantity = 0;
                }

                const orderedQuantity =
                  Number(
                    orderItem.quantity || 0
                  );

                const maxReceivableQuantity =
                  Math.max(
                    0,
                    orderedQuantity -
                      alreadyReceivedQuantity
                  );

                return {
                  productId:
                    orderItem.productId,

                  productName:
                    orderItem.product
                      ?.productName ||
                    orderItem.product?.name ||
                    "Unknown Product",

                  productCode:
                    orderItem.product
                      ?.productCode,

                  orderedQuantity,

                  receivedQuantity:
                    currentGRNQuantity,

                  alreadyReceivedQuantity,

                  maxReceivableQuantity,
                };
              }
            )
          );

        // =====================================================
        // CALCULATE OTHER GRNs
        // =====================================================

        try {
          const allGRNs =
            await purchasingService.getGRNs();

          const correctedItems =
            newItems.map((item) => {
              const otherGRNReceived =
                allGRNs
                  .filter(
                    (otherGRN) =>
                      Number(
                        otherGRN.id
                      ) !==
                        Number(
                          grnData.id
                        ) &&
                      Number(
                        otherGRN.purchaseOrderId
                      ) ===
                        Number(
                          grnData.purchaseOrderId
                        ) &&
                      otherGRN.status !==
                        "CANCELLED" &&
                      otherGRN.status !==
                        "REJECTED"
                  )
                  .reduce(
                    (
                      total,
                      otherGRN
                    ) => {
                      const matchingItem =
                        otherGRN.items?.find(
                          (grnItem) =>
                            String(
                              grnItem.productId
                            ) ===
                            String(
                              item.productId
                            )
                        );

                      return (
                        total +
                        Number(
                          matchingItem?.receivedQuantity ||
                            0
                        )
                      );
                    },
                    0
                  );

              const maxReceivableQuantity =
                Math.max(
                  0,
                  item.orderedQuantity -
                    otherGRNReceived
                );

              return {
                ...item,

                alreadyReceivedQuantity:
                  otherGRNReceived,

                maxReceivableQuantity,
              };
            });

          setItems(
            correctedItems
          );
        } catch (error) {
          console.error(
            "Failed to calculate other GRNs:",
            error
          );

          setItems(newItems);
        }
      } catch (error) {
        console.error(
          "Failed to load GRN:",
          error
        );

        alert(
          "Failed to load GRN details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (
      id &&
      !Number.isNaN(id)
    ) {
      loadData();
    }
  }, [id]);

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
        String(location.id) ===
        String(locationId)
    );
  }, [
    locations,
    locationId,
  ]);

  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  const updateQuantity = (
    index: number,
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
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
              item.maxReceivableQuantity
            )
          );

        return {
          ...item,
          receivedQuantity:
            safeValue,
        };
      })
    );
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeItem = (
    index: number
  ) => {
    setItems((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
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

  const totalAlreadyReceived =
    items.reduce(
      (total, item) =>
        total +
        item.alreadyReceivedQuantity,
      0
    );

  const totalCurrentGRNReceived =
    items.reduce(
      (total, item) =>
        total +
        item.receivedQuantity,
      0
    );

  const totalReceivedQuantity =
    totalAlreadyReceived +
    totalCurrentGRNReceived;

  const totalRemainingQuantity =
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
        "Purchase order is required"
      );
      return;
    }

    const numericPurchaseOrderId =
      Number(purchaseOrderId);

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

    if (
      !locationId ||
      locationId.trim() === ""
    ) {
      alert(
        "Please select a receiving location"
      );
      return;
    }

    const selectedLocationExists =
      locations.some(
        (location) =>
          String(location.id) ===
          String(locationId)
      );

    if (!selectedLocationExists) {
      alert(
        "Please select a valid receiving location"
      );
      return;
    }

    // =======================================================
    // ITEMS VALIDATION
    // =======================================================

    if (items.length === 0) {
      alert(
        "At least one item is required"
      );
      return;
    }

    const validItems =
      items.filter(
        (item) =>
          item.receivedQuantity > 0
      );

    if (
      validItems.length === 0
    ) {
      alert(
        "At least one item must have a received quantity"
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
          item.maxReceivableQuantity
      );

    if (invalidItem) {
      alert(
        `${invalidItem.productName}: maximum receivable quantity is ${invalidItem.maxReceivableQuantity}. Already received in other GRNs: ${invalidItem.alreadyReceivedQuantity}.`
      );
      return;
    }

    // =======================================================
    // INTEGER VALIDATION
    // =======================================================

    const invalidQuantity =
      validItems.find(
        (item) =>
          !Number.isInteger(
            item.receivedQuantity
          ) ||
          item.receivedQuantity <= 0
      );

    if (invalidQuantity) {
      alert(
        `${invalidQuantity.productName}: received quantity must be a positive whole number`
      );
      return;
    }

    // =======================================================
    // TOTAL VALIDATION
    // =======================================================

    const hasOverReceived =
      items.some(
        (item) =>
          item.alreadyReceivedQuantity +
            item.receivedQuantity >
          item.orderedQuantity
      );

    if (hasOverReceived) {
      const invalid =
        items.find(
          (item) =>
            item.alreadyReceivedQuantity +
              item.receivedQuantity >
            item.orderedQuantity
        );

      alert(
        `${
          invalid?.productName ||
          "Product"
        } exceeds the purchase order quantity.`
      );

      return;
    }

    // =======================================================
    // SAVE
    // =======================================================

    try {
      setSaving(true);

      const payload: CreateGRNPayload = {
        purchaseOrderId:
          numericPurchaseOrderId,

        locationId:
          locationId.trim(),

        items: validItems.map(
          (item) => ({
            productId:
              item.productId,

            receivedQuantity:
              Number(
                item.receivedQuantity
              ),
          })
        ),
      };

      console.log(
        "========== UPDATE GRN =========="
      );

      console.log(
        "GRN ID:",
        id
      );

      console.log(
        "Purchase Order ID:",
        numericPurchaseOrderId
      );

      console.log(
        "Location ID:",
        locationId,
        "Type:",
        typeof locationId
      );

      console.log(
        "Selected Location:",
        selectedLocation
      );

      console.log(
        "Payload:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      // =====================================================
      // API UPDATE
      // =====================================================

      await purchasingService.updateGRN(
        id,
        payload
      );

      alert(
        "GRN updated successfully"
      );

      // =====================================================
      // GO TO GRN LIST PAGE
      // =====================================================

      router.push(
        grnListRoute
      );

      router.refresh();
    } catch (error: any) {
      console.error(
        "Failed to update GRN:",
        error
      );

      const message =
        error?.response?.data
          ?.message ||
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
            "Failed to update GRN"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    router.push(
      grnListRoute
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex max-w-6xl items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Loading GRN...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!grn) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="font-semibold text-red-600">
            GRN not found
          </p>

          <button
            type="button"
            onClick={
              handleCancel
            }
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to GRN List
          </button>
        </div>
      </div>
    );
  }

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
            onClick={
              handleCancel
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft
              size={17}
            />
            Back to Goods Received
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Package
                    size={21}
                  />
                </div>

                <div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Edit{" "}
                    {
                      grn.grnNumber
                    }
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Update received quantities
                  </p>

                </div>

              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Package
                size={16}
              />
              Edit Goods Received Note
            </div>

          </div>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >

          {/* ================================================= */}
          {/* GRN DETAILS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <h2 className="font-semibold text-slate-900">
                GRN Details
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Purchase order and receiving location
              </p>

            </div>

            <div className="p-6">

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* PURCHASE ORDER */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Purchase Order
                  </label>

                  <select
                    value={
                      purchaseOrderId
                    }
                    onChange={(e) =>
                      setPurchaseOrderId(
                        e.target
                          .value
                      )
                    }
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
                  >

                    {orders.map(
                      (order) => (
                        <option
                          key={
                            order.id
                          }
                          value={
                            order.id
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

                {/* LOCATION */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Receiving Location
                  </label>

                  <div className="relative">

                    <MapPin
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={
                        locationId
                      }
                      onChange={(e) =>
                        setLocationId(
                          e.target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
                    >

                      <option value="">
                        Select receiving location
                      </option>

                      {locations.map(
                        (
                          location
                        ) => (
                          <option
                            key={
                              location.id
                            }
                            value={String(
                              location.id
                            )}
                          >
                            {
                              location.name
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

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

                  {!selectedLocation &&
                    !loading &&
                    locations.length >
                      0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Select the location where the received stock will be stored.
                      </p>
                    )}

                  {locations.length ===
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
          {/* SUMMARY */}
          {/* ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Receiving Summary
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {
                    grn.grnNumber
                  }

                  {selectedOrder &&
                    ` • ${selectedOrder.poNumber}`}
                </p>

              </div>

              <span className="text-sm font-semibold text-blue-600">
                {
                  progress
                }
                % received
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
                  {
                    totalItems
                  }
                </p>

              </div>

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

              <div className="rounded-xl bg-green-50 p-4">

                <p className="text-xs text-green-600">
                  Received
                </p>

                <p className="mt-1 text-xl font-bold text-green-700">
                  {
                    totalReceivedQuantity
                  }
                </p>

              </div>

              <div className="rounded-xl bg-orange-50 p-4">

                <p className="text-xs text-orange-600">
                  Remaining
                </p>

                <p className="mt-1 text-xl font-bold text-orange-700">
                  {
                    totalRemainingQuantity
                  }
                </p>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* ITEMS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <h2 className="font-semibold text-slate-900">
                Received Items
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Other GRN quantities are shown separately
              </p>

            </div>

            {items.length ===
            0 ? (

              <div className="px-6 py-16 text-center">

                <Package
                  size={30}
                  className="mx-auto mb-3 text-slate-400"
                />

                <p className="font-semibold text-slate-900">
                  No items
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
                        Other GRNs
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        This GRN
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Remaining
                      </th>

                      <th className="px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {items.map(
                      (
                        item,
                        index
                      ) => {

                        const remaining =
                          Math.max(
                            0,
                            item.orderedQuantity -
                              item.alreadyReceivedQuantity -
                              item.receivedQuantity
                          );

                        return (
                          <tr
                            key={`${item.productId}-${index}`}
                            className="hover:bg-slate-50/70"
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

                            {/* OTHER GRNS */}

                            <td className="px-4 py-5 text-center">

                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                {
                                  item.alreadyReceivedQuantity
                                }
                              </span>

                            </td>

                            {/* THIS GRN */}

                            <td className="px-4 py-5">

                              <div className="flex justify-center">

                                <input
                                  type="number"
                                  min="0"
                                  max={
                                    item.maxReceivableQuantity
                                  }
                                  value={
                                    item.receivedQuantity
                                  }
                                  onChange={(e) =>
                                    updateQuantity(
                                      index,
                                      Number(
                                        e
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="h-10 w-24 rounded-lg border border-slate-300 text-center text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100"
                                />

                              </div>

                              <p className="mt-1 text-center text-[11px] text-slate-400">
                                Max:{" "}
                                {
                                  item.maxReceivableQuantity
                                }
                              </p>

                            </td>

                            {/* REMAINING */}

                            <td className="px-4 py-5 text-center">

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                  remaining ===
                                  0
                                    ? "bg-green-50 text-green-700"
                                    : "bg-orange-50 text-orange-700"
                                }`}
                              >

                                {remaining ===
                                  0 && (
                                  <CheckCircle2
                                    size={
                                      13
                                    }
                                  />
                                )}

                                {
                                  remaining
                                }

                              </span>

                            </td>

                            {/* DELETE */}

                            <td className="px-4 py-5 text-center">

                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                                disabled={
                                  saving
                                }
                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >

                                <Trash2
                                  size={
                                    17
                                  }
                                />

                              </button>

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
          {/* INFO */}
          {/* ================================================= */}

          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <div>

              <p className="text-sm font-semibold text-blue-800">
                GRN quantity calculation
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Remaining =
                Ordered − Other GRNs −
                This GRN. The quantity
                received by other GRNs
                cannot be changed from
                this page.
              </p>

            </div>

          </div>

          {/* ================================================= */}
          {/* ACTIONS */}
          {/* ================================================= */}

          <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs text-slate-500">
                  This GRN received
                </p>

                <p className="text-lg font-bold text-slate-900">

                  {
                    totalCurrentGRNReceived
                  }

                  <span className="ml-1 text-sm font-normal text-slate-500">
                    units
                  </span>

                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Other GRNs:{" "}
                  <span className="font-semibold text-slate-700">
                    {
                      totalAlreadyReceived
                    }
                  </span>
                </p>

              </div>

              <div className="flex items-center gap-3">

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                {/* SAVE */}

                <button
                  type="submit"
                  disabled={
                    saving ||
                    validItemsDisabled(
                      items
                    ) ||
                    !locationId ||
                    !selectedLocation
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </div>

          </div>

        </form>
      </div>
    </div>
  );
}

// =========================================================
// SUBMIT BUTTON HELPER
// =========================================================

function validItemsDisabled(
  items: EditItem[]
) {
  return (
    items.length === 0 ||
    !items.some(
      (item) =>
        item.receivedQuantity > 0
    )
  );
}