"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  History,
  Boxes,
  MapPin,
  Package,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import Cookies from "js-cookie";

interface Product {
  id: string;
  productName: string;
  stockQuantity: number;
  reorderLevel: number;
}

interface Movement {
  id: string;

  product: {
    id: string;
    productName: string;
  };

  movementType:
    | "IN"
    | "OUT"
    | "TRANSFER_IN"
    | "TRANSFER_OUT";

  quantity: number;
  previousStock: number;
  newStock: number;
  userId: string | null;
  createdAt: string;
}

interface DashboardData {
  summary: {
    totalProducts: number;
    totalStock: number;
    lowStock: number;
    locations: number;
  };

  recentMovements: Movement[];

  lowStockProducts: Product[];
}

export default function InventoryPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ========================================
  // FETCH DASHBOARD DATA
  // ========================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = Cookies.get("access_token");

        if (!token) {
          setError(
            "Authentication token not found. Please login again.",
          );
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/inventory/dashboard",
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },

            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch inventory dashboard",
          );
        }

        const result = await response.json();

        setDashboard(result.data);
      } catch (err: any) {
        console.error(err);

        setError(
          err?.message ||
            "Failed to load inventory dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

            <p className="text-sm text-slate-500">
              Loading inventory...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  // ========================================
  // SUMMARY CARDS
  // ========================================

  const summaryCards = [
    {
      title: "Total Products",
      value: dashboard.summary.totalProducts,
      icon: Package,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },

    {
      title: "Total Stock",
      value: dashboard.summary.totalStock,
      icon: Boxes,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },

    {
      title: "Low Stock",
      value: dashboard.summary.lowStock,
      icon: AlertTriangle,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },

    {
      title: "Locations",
      value: dashboard.summary.locations,
      icon: MapPin,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  // ========================================
  // INVENTORY OPERATIONS
  // ========================================

  const inventoryActions = [
    {
      title: "Stock In",
      description:
        "Add new stock to your inventory",
      href: "/dashboard/inventory/stock-in",
      icon: ArrowDownToLine,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },

    {
      title: "Stock Out",
      description:
        "Remove stock from inventory",
      href: "/dashboard/inventory/stock-out",
      icon: ArrowUpFromLine,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },

    {
      title: "Stock Transfer",
      description:
        "Transfer stock between locations",
      href: "/dashboard/inventory/stock-transfer",
      icon: ArrowRightLeft,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },

    {
      title: "Movement History",
      description:
        "View all inventory movements",
      href: "/dashboard/inventory/movements",
      icon: History,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  // ========================================
  // MOVEMENT TYPE
  // ========================================

  const getMovementType = (
    type: Movement["movementType"],
  ) => {
    switch (type) {
      case "IN":
        return {
          label: "Stock In",
          className:
            "bg-emerald-50 text-emerald-700",
        };

      case "OUT":
        return {
          label: "Stock Out",
          className:
            "bg-orange-50 text-orange-700",
        };

      case "TRANSFER_IN":
        return {
          label: "Transfer In",
          className:
            "bg-purple-50 text-purple-700",
        };

      case "TRANSFER_OUT":
        return {
          label: "Transfer",
          className:
            "bg-purple-50 text-purple-700",
        };

      default:
        return {
          label: type,
          className:
            "bg-slate-50 text-slate-700",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-6 lg:p-8">

      {/* ================= HEADER ================= */}

      <div className="mb-8">
        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Boxes size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your stock, locations and inventory operations
            </p>
          </div>

        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                >
                  <Icon size={21} />
                </div>

              </div>
            </div>
          );
        })}

      </div>

      {/* ================= INVENTORY OPERATIONS ================= */}

      <div className="mb-8">

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Inventory Operations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quickly manage your inventory activities
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {inventoryActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >

                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${action.iconBg} ${action.iconColor}`}
                >
                  <Icon size={23} />
                </div>

                <h3 className="font-semibold text-slate-900">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm leading-5 text-slate-500">
                  {action.description}
                </p>

                <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                  Open

                  <ChevronRight
                    size={16}
                    className="ml-1 transition-transform group-hover:translate-x-1"
                  />
                </div>

              </Link>
            );
          })}

        </div>
      </div>

      {/* ================= LOWER SECTION ================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ================= RECENT MOVEMENTS ================= */}

        <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>
              <h2 className="font-semibold text-slate-900">
                Recent Stock Movements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest inventory activities
              </p>
            </div>

            <Link
              href="/dashboard/inventory/movements"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-sm">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">

                  <th className="px-5 py-3 font-medium">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Type
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Quantity
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Stock
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Date
                  </th>

                </tr>
              </thead>

              <tbody>

                {dashboard.recentMovements.length === 0 ? (

                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-slate-500"
                    >
                      No stock movements found.
                    </td>
                  </tr>

                ) : (

                  dashboard.recentMovements.map(
                    (movement) => {
                      const type =
                        getMovementType(
                          movement.movementType,
                        );

                      return (
                        <tr
                          key={movement.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >

                          <td className="px-5 py-4 font-medium text-slate-800">
                            {movement.product.productName}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${type.className}`}
                            >
                              {type.label}
                            </span>

                          </td>

                          <td
                            className={`px-5 py-4 font-semibold ${
                              movement.movementType ===
                              "IN"
                                ? "text-emerald-600"
                                : movement.movementType ===
                                    "OUT"
                                  ? "text-orange-600"
                                  : "text-purple-600"
                            }`}
                          >
                            {movement.movementType ===
                            "IN"
                              ? `+${movement.quantity}`
                              : movement.movementType ===
                                  "OUT"
                                ? `-${movement.quantity}`
                                : movement.quantity}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {movement.newStock}
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {new Date(
                              movement.createdAt,
                            ).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
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

        {/* ================= LOW STOCK ================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>
              <h2 className="font-semibold text-slate-900">
                Low Stock Products
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Products that need attention
              </p>
            </div>

            <AlertTriangle
              size={19}
              className="text-orange-500"
            />

          </div>

          <div className="divide-y divide-slate-100">

            {dashboard.lowStockProducts.length ===
            0 ? (

              <div className="px-5 py-8 text-center">

                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <Boxes
                    size={18}
                    className="text-emerald-600"
                  />
                </div>

                <p className="text-sm font-medium text-slate-700">
                  All stock levels are healthy
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  No products are below the reorder level.
                </p>

              </div>

            ) : (

              dashboard.lowStockProducts.map(
                (product) => (
                  <div
                    key={product.id}
                    className="px-5 py-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-medium text-slate-800">
                          {product.productName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Reorder level:{" "}
                          {product.reorderLevel}
                        </p>

                      </div>

                      <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        {product.stockQuantity} left
                      </span>

                    </div>

                  </div>
                ),
              )
            )}

          </div>

          <div className="border-t border-slate-100 p-4">

            <Link
              href="/dashboard/products"
              className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View Products

              <ChevronRight
                size={16}
                className="ml-1"
              />
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}