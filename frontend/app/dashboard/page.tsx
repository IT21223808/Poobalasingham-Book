"use client";

import { useEffect, useState } from "react";

import DashboardCards from "@/components/dashboard/DashboardCards";
import SalesChart from "@/components/dashboard/SalesChart";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentSales from "@/components/dashboard/RecentSales";
import LowStock from "@/components/dashboard/LowStock";
import ProfitSummary from "@/components/dashboard/ProfitSummary";
import InventoryStatus from "@/components/dashboard/InventoryStatus";
import Breadcrumb from "@/components/ui/Breadcrumb";

import {
  getDashboard,
  DashboardData,
} from "@/components/dashboard/dashboard-api";

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getDashboard();

        setData(result);
      } catch (error: any) {
        console.error(
          "Dashboard loading failed:",
          error,
        );

        setError(
          error?.response?.data?.message ||
            "Failed to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="hidden md:block">
          <Breadcrumb />
        </div>

        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="hidden md:block">
          <Breadcrumb />
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-700">
            Dashboard Error
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error ||
              "Unable to load dashboard."}
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* =====================================================
          TOP STAT CARDS
      ===================================================== */}

      <DashboardCards
        summary={data.summary}
      />

      {/* =====================================================
          SALES + RIGHT SIDEBAR
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Sales Chart */}
          <SalesChart
            data={data.salesChart}
          />

          {/* Profit + Inventory */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ProfitSummary
              todayProfit={
                data.summary.todayProfit
              }
              monthlyProfit={
                data.summary.monthlyProfit
              }
              grossProfit={
                data.summary.grossProfit
              }
              profitMargin={
                data.summary.profitMargin
              }
            />

            <InventoryStatus
              totalStock={
                data.summary.totalStock
              }
              lowStock={
                data.summary.lowStock
              }
              outOfStock={
                data.summary.outOfStock
              }
              stockValue={
                data.summary.stockValue
              }
            />
          </div>

          {/* Recent Sales */}
          <RecentSales
            sales={data.recentSales}
          />
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="space-y-6">
          <QuickActions />

          <LowStock
            products={
              data.lowStockProducts
            }
          />
        </div>
      </div>
    </div>
  );
}