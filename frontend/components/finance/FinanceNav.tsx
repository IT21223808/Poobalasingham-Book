"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  ArrowDownUp,
  FileSpreadsheet,
  Receipt,
  BarChart3,
  Scale,
  Waves,
} from "lucide-react";

const navItems = [
  {
    name: "Overview",
    href: "/dashboard/finance",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Cash Book",
    href: "/dashboard/finance/cash-book",
    icon: Wallet,
  },
  {
    name: "Bank Book",
    href: "/dashboard/finance/bank-book",
    icon: Building2,
  },
  {
    name: "Income & Expenses",
    href: "/dashboard/finance/income-expenses",
    icon: ArrowDownUp,
  },
  {
    name: "Accounts Receivable",
    href: "/dashboard/finance/accounts-receivable",
    icon: Receipt,
  },
  {
    name: "Accounts Payable",
    href: "/dashboard/finance/accounts-payable",
    icon: FileSpreadsheet,
  },
  {
    name: "Profit & Loss",
    href: "/dashboard/finance/profit-loss",
    icon: BarChart3,
  },
  {
    name: "Balance Sheet",
    href: "/dashboard/finance/balance-sheet",
    icon: Scale,
  },
  {
    name: "Cash Flow",
    href: "/dashboard/finance/cash-flow",
    icon: Waves,
  },
];

export default function FinanceNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Finance & Accounting
          </h1>

          <p className="mt-0.5 text-sm text-gray-500">
            Cash, Bank, Income, Expenses, Receivables, Payables, and Financial Statements
          </p>
        </div>
      </div>

      <nav className="no-scrollbar -mb-px flex space-x-1 overflow-x-auto py-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? "rounded-t-lg border-blue-600 bg-blue-50/50 font-semibold text-blue-600"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
              />

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
