'use client';

import {
  BookOpen,
  Boxes,
  ShoppingCart,
  Users,
} from "lucide-react";

import StatCard from "./StatCard";

export default function DashboardCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      <StatCard
        title="Total Books"
        value="12,846"
        subtitle="Available in inventory"
        color="bg-blue-100 text-blue-600"
        icon={<BookOpen size={28} />}
      />

      <StatCard
        title="Inventory Items"
        value="8,920"
        subtitle="Current stock"
        color="bg-emerald-100 text-emerald-600"
        icon={<Boxes size={28} />}
      />

      <StatCard
        title="Today's Sales"
        value="Rs. 58,320"
        subtitle="Today's revenue"
        color="bg-amber-100 text-amber-600"
        icon={<ShoppingCart size={28} />}
      />

      <StatCard
        title="Customers"
        value="2,531"
        subtitle="Registered customers"
        color="bg-purple-100 text-purple-600"
        icon={<Users size={28} />}
      />

    </div>
  );
}