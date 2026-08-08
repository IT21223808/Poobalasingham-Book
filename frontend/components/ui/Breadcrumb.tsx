"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

const nameMap: Record<string, string> = {
  dashboard: "Dashboard",
  books: "Books",
  categories: "Categories",
  inventory: "Inventory",
  purchasing: "Purchasing",
  pos: "POS Billing",
  customers: "Customers",
  suppliers: "Suppliers",
  finance: "Finance",
  reports: "Reports",
  settings: "Settings",
};

export default function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm">

      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-slate-500 transition hover:text-blue-600"
      >
        <Home size={16} />
        <span>Home</span>
      </Link>

      {segments.map((segment, index) => {
        const href =
          "/" + segments.slice(0, index + 1).join("/");

        const label =
          nameMap[segment] ||
          segment.charAt(0).toUpperCase() +
            segment.slice(1);

        const isLast =
          index === segments.length - 1;

        return (
          <div
            key={href}
            className="flex items-center gap-2"
          >

            <ChevronRight
              size={15}
              className="text-slate-400"
            />

            {isLast ? (
              <span className="font-medium text-slate-800">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-slate-500 transition hover:text-blue-600"
              >
                {label}
              </Link>
            )}

          </div>
        );
      })}

    </div>
  );
}