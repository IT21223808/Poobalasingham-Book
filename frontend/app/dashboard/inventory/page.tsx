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
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  PackageX,
  Calculator,
} from "lucide-react";
import Cookies from "js-cookie";

interface Product {
  id: string;
  productName: string;
  stockQuantity: number;
  reorderLevel: number;
  imageUrl?: string | null;
  image?: string | null;
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

  // =====================================================
  // FETCH INVENTORY DASHBOARD
  // =====================================================

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
            "Failed to fetch inventory dashboard.",
          );
        }

        const result = await response.json();

        setDashboard(result.data);
      } catch (err: any) {
        console.error(err);

        setError(
          err?.message ||
          "Failed to load inventory dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

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

  // =====================================================
  // ERROR
  // =====================================================

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

  // =====================================================
  // SUMMARY CARDS
  // =====================================================

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

  // =====================================================
  // PRIMARY OPERATIONS
  // =====================================================

  const primaryActions = [
    {
      title: "Stock In",
      description: "Add new stock to your inventory",
      href: "/dashboard/inventory/stock-in",
      icon: ArrowDownToLine,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      buttonColor: "text-emerald-600",
    },
    {
      title: "Stock Out",
      description: "Remove stock from inventory",
      href: "/dashboard/inventory/stock-out",
      icon: ArrowUpFromLine,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      buttonColor: "text-orange-600",
    },
    {
      title: "Stock Transfer",
      description: "Transfer stock between locations",
      href: "/dashboard/inventory/stock-transfer",
      icon: ArrowRightLeft,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      buttonColor: "text-purple-600",
    },
  ];

  // =====================================================
  // SECONDARY OPERATIONS
  // =====================================================

  const secondaryActions = [
    {
      title: "Movement History",
      description: "View inventory movements",
      href: "/dashboard/inventory/movements",
      icon: History,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Stock Adjustment",
      description: "Increase or decrease stock",
      href: "/dashboard/inventory/stock-adjustment",
      icon: Boxes,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Physical Stock Count",
      description: "Compare physical and system stock",
      href: "/dashboard/inventory/physical-stock-count",
      icon: ClipboardCheck,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
    {
      title: "Damaged / Lost",
      description: "Record damaged or lost stock",
      href: "/dashboard/inventory/damaged-lost",
      icon: PackageX,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Out of Stock",
      description: "View products with zero stock",
      href: "/dashboard/inventory/out-of-stock",
      icon: AlertOctagon,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      title: "Stock Valuation",
      description: "Calculate current inventory value",
      href: "/dashboard/inventory/stock-valuation",
      icon: Calculator,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  // =====================================================
  // MOVEMENT TYPE
  // =====================================================

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
          label: "Transfer Out",
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

  // =====================================================
  // DATE FORMAT
  // Fixed locale/timezone to avoid hydration mismatch
  // =====================================================

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(date));
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Boxes size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your stock, locations and inventory
              operations
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-1.5 text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================
          INVENTORY OPERATIONS
      ================================================= */}

      <div className="mb-8">

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Inventory Operations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quickly manage your inventory activities
          </p>
        </div>

        {/* =================================================
            PRIMARY 3 CARDS
        ================================================= */}

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {primaryActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${action.iconBg} ${action.iconColor}`}
                  >
                    <Icon size={22} />
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
                  />
                </div>

                <h3 className="mt-5 text-base font-semibold text-slate-900">
                  {action.title}
                </h3>

                <p className="mt-1.5 text-sm text-slate-500">
                  {action.description}
                </p>

                <div
                  className={`mt-4 text-sm font-medium ${action.buttonColor}`}
                >
                  Open →
                </div>
              </Link>
            );
          })}
        </div>

        {/* =================================================
            SECONDARY 6 CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.iconBg} ${action.iconColor}`}
                >
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {action.title}
                  </h3>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {action.description}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* =================================================
          LOWER SECTION
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* =================================================
            RECENT MOVEMENTS
        ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

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
            <table className="w-full min-w-[620px] text-sm">

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
                {dashboard.recentMovements.length ===
                  0 ? (
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
                            {
                              movement.product
                                .productName
                            }
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${type.className}`}
                            >
                              {type.label}
                            </span>
                          </td>

                          <td
                            className={`px-5 py-4 font-semibold ${movement.movementType ===
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
                            {formatDate(
                              movement.createdAt,
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

        {/* =================================================
    LOW STOCK PRODUCTS
================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>
              <h2 className="font-semibold text-slate-900">
                Low Stock Products
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Products that need attention
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <AlertTriangle
                size={17}
                className="text-orange-500"
              />
            </div>

          </div>

          {/* PRODUCTS */}
          <div className="divide-y divide-slate-100">

            {dashboard.lowStockProducts.length === 0 ? (

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
                  No products are below reorder level.
                </p>

              </div>

            ) : (

              dashboard.lowStockProducts.map((product) => {

                const productImage =
                  product.imageUrl || product.image;

                return (
                  <div
                    key={product.id}
                    className="px-5 py-4 transition hover:bg-slate-50"
                  >

                    <div className="flex items-center gap-3">

                      {/* BOOK IMAGE */}
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">

                        {productImage ? (

                          <img
                            src={productImage}
                            alt={product.productName}
                            className="h-full w-full object-cover"
                          />

                        ) : (

                          <div className="flex h-full w-full items-center justify-center">
                            <Package
                              size={20}
                              className="text-slate-400"
                            />
                          </div>

                        )}

                      </div>

                      {/* PRODUCT DETAILS */}
                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold text-slate-800">
                          {product.productName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Reorder level:{" "}
                          {product.reorderLevel}
                        </p>

                      </div>

                      {/* STOCK */}
                      <div className="text-right">

                        <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                          {product.stockQuantity} left
                        </span>

                      </div>

                    </div>

                  </div>
                );
              })

            )}

          </div>

          {/* FOOTER */}
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