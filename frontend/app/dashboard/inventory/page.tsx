"use client";

import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  History,
} from "lucide-react";

export default function InventoryPage() {
  const router = useRouter();

  const inventoryActions = [
    {
      title: "Stock In",
      description: "Add incoming stock to inventory",
      icon: ArrowDownToLine,
      href: "/dashboard/inventory/stock-in",
    },
    {
      title: "Stock Out",
      description: "Remove stock from inventory",
      icon: ArrowUpFromLine,
      href: "/dashboard/inventory/stock-out",
    },
    {
      title: "Stock Transfer",
      description: "Transfer stock between locations",
      icon: ArrowLeftRight,
      href: "/dashboard/inventory/transfer",
    },
    {
      title: "Movement History",
      description: "View all inventory movements",
      icon: History,
      href: "/dashboard/inventory/movements",
    },
  ];

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Inventory
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage stock movements and inventory operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {inventoryActions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              type="button"
              onClick={() => router.push(action.href)}
              className="group rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:border-gray-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">

                <div className="rounded-xl bg-gray-100 p-3 transition group-hover:bg-gray-900">
                  <Icon
                    size={24}
                    className="text-gray-700 group-hover:text-white"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    {action.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>

              </div>
            </button>
          );
        })}

      </div>
    </div>
  );
}