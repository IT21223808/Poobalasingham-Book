"use client";

import {
  BookOpen,
  FileText,
  ShoppingCart,
  Users,
} from "lucide-react";

import { useRouter } from "next/navigation";

const actions = [
  {
    title: "Add Product",
    icon: BookOpen,
    path: "/dashboard/products/form",
  },
  {
    title: "New Customer",
    icon: Users,
    path: "/dashboard/customers",
  },
  {
  title: "Purchase Order",
  icon: ShoppingCart,
  path: "/dashboard/purchasing/orders/create",
},
  {
  title: "Create Invoice",
  icon: FileText,
  path: "/dashboard/purchasing/invoices/create",
},
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-slate-800">
        Quick Actions
      </h2>

      <div className="space-y-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              type="button"
              onClick={() => router.push(action.path)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <Icon
                size={20}
                className="text-blue-600"
              />

              <span className="font-medium text-slate-800">
                {action.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}