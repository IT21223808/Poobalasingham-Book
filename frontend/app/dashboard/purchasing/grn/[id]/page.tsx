"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  purchasingService,
  GRN,
} from "@/services/purchasing.service";

export default function GRNViewPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [grn, setGrn] =
    useState<GRN | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    const loadGRN = async () => {
      try {
        const data =
          await purchasingService.getGRN(id);

        setGrn(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadGRN();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!grn) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this GRN?"
      );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await purchasingService.deleteGRN(
        grn.id
      );

      router.push(
        "/dashboard/purchasing/grn"
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Failed to delete GRN"
      );
    } finally {
      setDeleting(false);
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() =>
              router.push(
                "/dashboard/purchasing/grn"
              )
            }
            className="flex items-center gap-2 text-sm text-gray-500 mb-3"
          >
            <ArrowLeft size={17} />
            Back to Goods Received
          </button>

          <h1 className="text-2xl font-semibold">
            {grn.grnNumber}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Goods Received Note details
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(
                `/dashboard/purchasing/grn/${grn.id}/edit`
              )
            }
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Pencil size={17} />
            Edit
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={17} />
            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </div>

      {/* DETAILS */}

      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">
              GRN Number
            </p>

            <p className="font-medium mt-1">
              {grn.grnNumber}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Purchase Order
            </p>

            <p className="font-medium mt-1">
              PO-
              {String(
                grn.purchaseOrderId
              ).padStart(5, "0")}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <span className="inline-block mt-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {grn.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Created Date
            </p>

            <p className="font-medium mt-1">
              {new Date(
                grn.createdAt
              ).toLocaleString()}
            </p>
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
                  Ordered Quantity
                </th>

                <th className="text-left px-6 py-3 text-sm">
                  Received Quantity
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {grn.items?.map(
                (item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {item.product
                          ?.productName ||
                          item.product?.name ||
                          item.product
                            ?.productCode ||
                          item.productId}
                      </div>

                      <div className="text-xs text-gray-500">
                        {item.productId}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {item.orderedQuantity}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {item.receivedQuantity}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}