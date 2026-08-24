"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  purchasingService,
  GRN,
  PurchaseOrder,
  CreateGRNPayload,
} from "@/services/purchasing.service";

interface EditItem {
  productId: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
}

export default function EditGRNPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [grn, setGrn] =
    useState<GRN | null>(null);

  const [orders, setOrders] =
    useState<PurchaseOrder[]>([]);

  const [purchaseOrderId, setPurchaseOrderId] =
    useState("");

  const [locationId, setLocationId] =
    useState("");

  const [items, setItems] =
    useState<EditItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [grnData, ordersData] =
          await Promise.all([
            purchasingService.getGRN(id),
            purchasingService.getOrders(),
          ]);

        setGrn(grnData);
        setOrders(ordersData);

        setPurchaseOrderId(
          String(
            grnData.purchaseOrderId
          )
        );

        setItems(
          grnData.items.map(
            (item) => ({
              productId:
                item.productId,

              productName:
                item.product
                  ?.productName ||
                item.product?.name ||
                item.product
                  ?.productCode ||
                item.productId,

              orderedQuantity:
                item.orderedQuantity,

              receivedQuantity:
                item.receivedQuantity,
            })
          )
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const updateQuantity = (
    index: number,
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              receivedQuantity:
                value,
            }
          : item
      )
    );
  };

  const removeItem = (
    index: number
  ) => {
    setItems((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!purchaseOrderId) {
      alert(
        "Purchase order is required"
      );
      return;
    }

    if (!locationId) {
      alert("Location ID is required");
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.receivedQuantity > 0
    );

    if (validItems.length === 0) {
      alert(
        "At least one item is required"
      );
      return;
    }

    try {
      setSaving(true);

      const payload: CreateGRNPayload = {
        purchaseOrderId:
          Number(purchaseOrderId),

        locationId,

        items: validItems.map(
          (item) => ({
            productId:
              item.productId,

            receivedQuantity:
              item.receivedQuantity,
          })
        ),
      };

      await purchasingService.updateGRN(
        id,
        payload
      );

      router.push(
        `/dashboard/purchasing/grn/${id}`
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Failed to update GRN"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading GRN...
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-6">
        GRN not found
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* HEADER */}

      <button
        onClick={() =>
          router.push(
            `/dashboard/purchasing/grn/${id}`
          )
        }
        className="flex items-center gap-2 text-sm text-gray-600 mb-5"
      >
        <ArrowLeft size={18} />
        Back to GRN
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Edit {grn.grnNumber}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Update received quantities
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* DETAILS */}

        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-5">
            GRN Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Purchase Order
              </label>

              <select
                value={purchaseOrderId}
                onChange={(e) =>
                  setPurchaseOrderId(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg px-3 py-2.5"
              >
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Location ID
              </label>

              <input
                value={locationId}
                onChange={(e) =>
                  setLocationId(
                    e.target.value
                  )
                }
                placeholder="Enter location UUID"
                className="w-full border rounded-lg px-3 py-2.5"
                required
              />
            </div>
          </div>
        </div>

        {/* ITEMS */}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold">
              Received Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm">
                    Product
                  </th>

                  <th className="text-left px-6 py-3 text-sm">
                    Ordered
                  </th>

                  <th className="text-left px-6 py-3 text-sm">
                    Received
                  </th>

                  <th className="px-6 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y">
                {items.map(
                  (item, index) => (
                    <tr
                      key={item.productId}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {
                            item.productName
                          }
                        </div>

                        <div className="text-xs text-gray-500">
                          {
                            item.productId
                          }
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {
                          item.orderedQuantity
                        }
                      </td>

                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max={
                            item.orderedQuantity
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
                          className="w-32 border rounded-lg px-3 py-2"
                        />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              index
                            )
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/purchasing/grn/${id}`
              )
            }
            className="px-5 py-2.5 border rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}