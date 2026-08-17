"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Search,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import {
  getMovements,
  StockMovement,
} from "@/services/inventory.service";

export default function MovementHistoryPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState("ALL");

  // ========================================
  // LOAD MOVEMENTS
  // ========================================

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
  // SEARCH + FILTER
  // ========================================

  const filteredMovements = movements.filter(
    (movement) => {
      const value = search
        .toLowerCase()
        .trim();

      const productName =
        movement.product?.productName
          ?.toLowerCase() ?? "";

      const productCode =
        movement.product?.productCode
          ?.toLowerCase() ?? "";

      const movementTypeValue =
        movement.movementType
          ?.toLowerCase() ?? "";

      const fromLocation =
        movement.fromLocation?.name
          ?.toLowerCase() ?? "";

      const toLocation =
        movement.toLocation?.name
          ?.toLowerCase() ?? "";

      const matchesSearch =
        productName.includes(value) ||
        productCode.includes(value) ||
        movementTypeValue.includes(value) ||
        fromLocation.includes(value) ||
        toLocation.includes(value);

      const matchesType =
        movementType === "ALL"
          ? true
          : movement.movementType ===
            movementType;

      return (
        matchesSearch &&
        matchesType
      );
    },
  );

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

  // ========================================
  // MOVEMENT LABEL
  // ========================================

  const getMovementLabel = (
    type: string,
  ) => {
    switch (type) {
      case "IN":
        return "Stock In";

      case "OUT":
        return "Stock Out";

      case "TRANSFER_IN":
        return "Transfer In";

      case "TRANSFER_OUT":
        return "Transfer Out";

      case "ADJUSTMENT_IN":
        return "Adjustment In";

      case "ADJUSTMENT_OUT":
        return "Adjustment Out";

      case "PHYSICAL_COUNT":
        return "Physical Count";

      case "DAMAGED":
        return "Damaged";

      case "LOST":
        return "Lost";

      default:
        return type;
    }
  };

  // ========================================
  // MOVEMENT STYLE
  // ========================================

  const getMovementStyle = (
    type: string,
  ) => {
    switch (type) {
      case "IN":
      case "TRANSFER_IN":
      case "ADJUSTMENT_IN":
        return {
          badge:
            "bg-green-50 text-green-600",
          icon:
            "bg-green-50 text-green-600",
        };

      case "OUT":
      case "TRANSFER_OUT":
      case "ADJUSTMENT_OUT":
      case "DAMAGED":
      case "LOST":
        return {
          badge:
            "bg-red-50 text-red-600",
          icon:
            "bg-red-50 text-red-600",
        };

      default:
        return {
          badge:
            "bg-blue-50 text-blue-600",
          icon:
            "bg-blue-50 text-blue-600",
        };
    }
  };

  // ========================================
  // POSITIVE / NEGATIVE QUANTITY
  // ========================================

  const isIncomingMovement = (
    type: string,
  ) => {
    return (
      type === "IN" ||
      type === "TRANSFER_IN" ||
      type === "ADJUSTMENT_IN"
    );
  };

  // ========================================
  // EXPORT CSV
  // ========================================

  const exportCSV = () => {
    const headers = [
      "Product",
      "Code",
      "Type",
      "From Location",
      "To Location",
      "Quantity",
      "Previous Stock",
      "New Stock",
      "Date",
    ];

    const rows =
      filteredMovements.map(
        (movement) => [
          movement.product
            ?.productName ?? "",

          movement.product
            ?.productCode ?? "",

          getMovementLabel(
            movement.movementType,
          ),

          movement.fromLocation
            ?.name ?? "",

          movement.toLocation
            ?.name ?? "",

          `${
            isIncomingMovement(
              movement.movementType,
            )
              ? "+"
              : "-"
          }${movement.quantity}`,

          movement.previousStock,

          movement.newStock,

          formatDate(
            movement.createdAt,
          ),
        ],
      );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "inventory-movements.csv";

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

          <Link
            href="/dashboard/inventory"
            className="hover:text-indigo-600"
          >
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
          SEARCH / FILTER
      ======================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-1 flex-col gap-3 md:flex-row">

            {/* SEARCH */}

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search product, code or location..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />

            </div>

            {/* MOVEMENT TYPE */}

            <select
              value={movementType}
              onChange={(e) =>
                setMovementType(
                  e.target.value,
                )
              }
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
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

              <option value="ADJUSTMENT_IN">
                Adjustment In
              </option>

              <option value="ADJUSTMENT_OUT">
                Adjustment Out
              </option>

              <option value="PHYSICAL_COUNT">
                Physical Count
              </option>

              <option value="DAMAGED">
                Damaged
              </option>

              <option value="LOST">
                Lost
              </option>

            </select>

          </div>

          {/* EXPORT */}

          <button
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Download size={18} />

            Export CSV
          </button>

        </div>
      </div>

      {/* ========================================
          RESULT COUNT
      ======================================== */}

      <div className="flex items-center justify-between">

        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredMovements.length}
          </span>{" "}
          movement
          {filteredMovements.length !== 1
            ? "s"
            : ""}
        </p>

      </div>

      {/* ========================================
          TABLE
      ======================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1250px]">

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Product
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Type
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  From
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  To
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Quantity
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Previous
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

              {/* ========================================
                  LOADING
              ======================================== */}

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading movement history...
                  </td>

                </tr>

              ) : filteredMovements.length ===
                0 ? (

                /* ========================================
                    EMPTY
                ======================================== */

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No movement records found
                  </td>

                </tr>

              ) : (

                filteredMovements.map(
                  (movement) => {

                    const incoming =
                      isIncomingMovement(
                        movement.movementType,
                      );

                    const styles =
                      getMovementStyle(
                        movement.movementType,
                      );

                    return (
                      <tr
                        key={
                          movement.id
                        }
                        className="transition hover:bg-gray-50"
                      >

                        {/* ========================================
                            PRODUCT
                        ======================================== */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
                            >

                              {incoming ? (
                                <ArrowDownToLine
                                  size={19}
                                />
                              ) : (
                                <ArrowUpFromLine
                                  size={19}
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

                        {/* ========================================
                            TYPE
                        ======================================== */}

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
                          >
                            {getMovementLabel(
                              movement.movementType,
                            )}
                          </span>

                        </td>

                        {/* ========================================
                            FROM LOCATION
                        ======================================== */}

                        <td className="px-5 py-4">

                          {movement
                            .fromLocation ? (

                            <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
                              {
                                movement
                                  .fromLocation
                                  .name
                              }
                            </span>

                          ) : (

                            <span className="text-sm text-gray-400">
                              —
                            </span>

                          )}

                        </td>

                        {/* ========================================
                            TO LOCATION
                        ======================================== */}

                        <td className="px-5 py-4">

                          {movement
                            .toLocation ? (

                            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">

                              {
                                movement
                                  .toLocation
                                  .name
                              }

                            </span>

                          ) : (

                            <span className="text-sm text-gray-400">
                              —
                            </span>

                          )}

                        </td>

                        {/* ========================================
                            QUANTITY
                        ======================================== */}

                        <td className="px-5 py-4">

                          <span
                            className={`text-sm font-semibold ${
                              incoming
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >

                            {incoming
                              ? "+"
                              : "-"}

                            {
                              movement.quantity
                            }

                          </span>

                        </td>

                        {/* ========================================
                            PREVIOUS STOCK
                        ======================================== */}

                        <td className="px-5 py-4">

                          <span className="text-sm text-gray-700">
                            {
                              movement.previousStock
                            }
                          </span>

                        </td>

                        {/* ========================================
                            NEW STOCK
                        ======================================== */}

                        <td className="px-5 py-4">

                          <span className="text-sm font-semibold text-gray-900">
                            {
                              movement.newStock
                            }
                          </span>

                        </td>

                        {/* ========================================
                            DATE
                        ======================================== */}

                        <td className="px-5 py-4">

                          <span className="whitespace-nowrap text-sm text-gray-600">
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