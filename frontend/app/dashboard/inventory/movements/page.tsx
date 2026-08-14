"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Download,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  getMovements,
  StockMovement,
} from "@/services/inventory.service";

export default function MovementHistoryPage() {
  const [movements, setMovements] = useState<
    StockMovement[]
  >([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState("ALL");
  const loadMovements = async () => {
    try {
      setLoading(true);

      const data = await getMovements();

      setMovements(data);
    } catch (error) {
      console.error(
        "Failed to load movement history:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  // ========================================
  // SEARCH
  // ========================================

  const filteredMovements = movements.filter((movement) => {
  const value = search.toLowerCase().trim();

  const matchesSearch =
    movement.product?.productName
      ?.toLowerCase()
      .includes(value) ||
    movement.product?.productCode
      ?.toLowerCase()
      .includes(value) ||
    movement.movementType
      ?.toLowerCase()
      .includes(value);

  const matchesType =
    movementType === "ALL"
      ? true
      : movement.movementType === movementType;

  return matchesSearch && matchesType;
});

  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(
      "en-LK",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  };

  const exportCSV = () => {
    const headers = [
      "Product",
      "Code",
      "Type",
      "Quantity",
      "Previous Stock",
      "New Stock",
      "Date",
    ];

    const rows = filteredMovements.map((movement) => [
      movement.product?.productName ?? "",
      movement.product?.productCode ?? "",
      movement.movementType,
      movement.quantity,
      movement.previousStock,
      movement.newStock,
      formatDate(movement.createdAt),
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory-movements.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">

          <Link href="/dashboard/inventory">
            Inventory
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-900">
            Movement History
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Movement History
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View all inventory movement records.
        </p>
      </div>

      {/* ========================================
          SEARCH
      ======================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4">

  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

    <div className="flex flex-1 flex-col gap-3 md:flex-row">

      <div className="relative flex-1">

        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search product, code or movement type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm"
        />

      </div>

      <select
        value={movementType}
        onChange={(e) =>
          setMovementType(e.target.value)
        }
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
      >
        <option value="ALL">
          All Movements
        </option>

        <option value="IN">
          Stock In
        </option>

        <option value="OUT">
          Stock Out
        </option>

        <option value="TRANSFER_IN">
          Transfer In
        </option>

        <option value="TRANSFER_OUT">
          Transfer Out
        </option>

      </select>

    </div>

    <button
      onClick={exportCSV}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
    >
      <Download size={18} />
      Export CSV
    </button>

  </div>

</div>

      {/* ========================================
          TABLE
      ======================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Product
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Type
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Quantity
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Previous Stock
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  New Stock
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Date
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading movement history...
                  </td>

                </tr>

              ) : filteredMovements.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No movement records found
                  </td>

                </tr>

              ) : (

                filteredMovements.map(
                  (movement) => {

                    const isStockIn =
                      movement.movementType ===
                      "IN";

                    return (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* PRODUCT */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${isStockIn
                                  ? "bg-green-50"
                                  : "bg-red-50"
                                }`}
                            >

                              {isStockIn ? (
                                <ArrowDownToLine
                                  size={19}
                                  className="text-green-600"
                                />
                              ) : (
                                <ArrowUpFromLine
                                  size={19}
                                  className="text-red-600"
                                />
                              )}

                            </div>

                            <div>

                              <p className="font-medium text-gray-900">
                                {
                                  movement
                                    .product
                                    ?.productName
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {
                                  movement
                                    .product
                                    ?.productCode
                                }
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* TYPE */}

                        <td className="px-5 py-4">

                          {isStockIn ? (

                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                              Stock In
                            </span>

                          ) : movement.movementType ===
                            "OUT" ? (

                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                              Stock Out
                            </span>

                          ) : (

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                              {
                                movement.movementType
                              }
                            </span>

                          )}

                        </td>

                        {/* QUANTITY */}

                        <td className="px-5 py-4">

                          <span
                            className={`text-sm font-semibold ${isStockIn
                                ? "text-green-600"
                                : "text-red-600"
                              }`}
                          >
                            {isStockIn
                              ? "+"
                              : "-"}
                            {movement.quantity}
                          </span>

                        </td>

                        {/* PREVIOUS STOCK */}

                        <td className="px-5 py-4">

                          <span className="text-sm text-gray-700">
                            {
                              movement.previousStock
                            }
                          </span>

                        </td>

                        {/* NEW STOCK */}

                        <td className="px-5 py-4">

                          <span className="text-sm font-semibold text-gray-900">
                            {movement.newStock}
                          </span>

                        </td>

                        {/* DATE */}

                        <td className="px-5 py-4">

                          <span className="text-sm text-gray-600">
                            {formatDate(
                              movement.createdAt,
                            )}
                          </span>

                        </td>

                      </tr>
                    );
                  },
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}