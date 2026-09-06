"use client";

import {
  BookOpen,
  Boxes,
  ShoppingCart,
  Users,
} from "lucide-react";

import StatCard from "./StatCard";

interface DashboardSummary {
  todaySales: number;
  monthlySales: number;
  totalProducts: number;
  customers: number;
  lowStock: number;
  outOfStock: number;
}

interface DashboardCardsProps {
  summary: DashboardSummary;
}

export default function DashboardCards({
  summary,
}: DashboardCardsProps) {
  const formatCurrency = (value: number) => {
    return `Rs. ${Number(value || 0).toLocaleString(
      "en-LK",
    )}`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Books"
        value={summary.totalProducts.toLocaleString()}
        subtitle="Available in inventory"
        color="bg-blue-100 text-blue-600"
        icon={<BookOpen size={28} />}
      />

      <StatCard
        title="Inventory Items"
        value={summary.totalProducts.toLocaleString()}
        subtitle="Current stock"
        color="bg-emerald-100 text-emerald-600"
        icon={<Boxes size={28} />}
      />

      <StatCard
        title="Today's Sales"
        value={formatCurrency(summary.todaySales)}
        subtitle="Today's revenue"
        color="bg-amber-100 text-amber-600"
        icon={<ShoppingCart size={28} />}
      />

      <StatCard
        title="Customers"
        value={summary.customers.toLocaleString()}
        subtitle="Registered customers"
        color="bg-purple-100 text-purple-600"
        icon={<Users size={28} />}
      />
    </div>
  );
}