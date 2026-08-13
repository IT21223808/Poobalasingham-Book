"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Boxes,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onLogoClick: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Books",
    href: "/dashboard/books",
    icon: BookOpen,
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Categories",
    href: "/dashboard/categories",
    icon: FolderOpen,
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
  },
  {
    title: "Purchasing",
    href: "/dashboard/purchasing",
    icon: ShoppingCart,
  },
  {
    title: "POS Billing",
    href: "/dashboard/pos",
    icon: CreditCard,
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Truck,
  },
  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: Wallet,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
];

export default function Sidebar({
  collapsed,
  onLogoClick,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();

    router.push("/login");
  };

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >

      {/* ================= LOGO ================= */}

      <button
        type="button"
        onClick={onLogoClick}
        title={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
        className={`border-b border-gray-200 px-4 py-5 transition hover:bg-slate-50 ${
          collapsed
            ? "flex w-full justify-center"
            : "flex w-full justify-center"
        }`}
      >
        {collapsed ? (
          <Image
            src="/images/logo2.png"
            alt="Poobalasingham Book Depot"
            width={45}
            height={45}
            priority
            className="h-10 w-10 object-contain"
          />
        ) : (
          <Image
            src="/images/logo3.png"
            alt="Poobalasingham Book Depot"
            width={210}
            height={70}
            priority
            className="h-auto max-w-[210px] object-contain"
          />
        )}
      </button>

      {/* ================= MENU ================= */}

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-6">

        {!collapsed && (
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Main Menu
          </p>
        )}

        <div className="space-y-1">

          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(
                item.href + "/"
              );

            return (
              <Link
                key={item.title}
                href={item.href}
                title={
                  collapsed
                    ? item.title
                    : undefined
                }
                className={`group relative flex items-center rounded-lg py-3 transition-all duration-200 ${
                  collapsed
                    ? "justify-center px-2"
                    : "gap-3 px-4"
                } ${
                  active
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >

                {active && (
                  <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-blue-700" />
                )}

                <Icon
                  size={20}
                  className={`shrink-0 ${
                    active
                      ? "text-blue-700"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                />

                {!collapsed && (
                  <span>{item.title}</span>
                )}

              </Link>
            );
          })}

        </div>

        {/* ================= GENERAL ================= */}

        {!collapsed && (
          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            General
          </p>
        )}

        <div className="mt-2 space-y-1">

          {/* Settings */}

          <Link
            href="/dashboard/settings"
            title={
              collapsed
                ? "Settings"
                : undefined
            }
            className={`group flex items-center rounded-lg py-3 transition ${
              collapsed
                ? "justify-center px-2"
                : "gap-3 px-4"
            } ${
              pathname === "/dashboard/settings"
                ? "bg-blue-50 font-semibold text-blue-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <Settings
              size={20}
              className={
                pathname === "/dashboard/settings"
                  ? "text-blue-600"
                  : "text-gray-500 group-hover:text-gray-700"
              }
            />

            {!collapsed && (
              <span>Settings</span>
            )}
          </Link>

          {/* Logout */}

          <button
            onClick={handleLogout}
            title={
              collapsed
                ? "Logout"
                : undefined
            }
            className={`group flex w-full items-center rounded-lg py-3 text-gray-700 transition hover:bg-red-50 hover:text-red-600 ${
              collapsed
                ? "justify-center px-2"
                : "gap-3 px-4"
            }`}
          >
            <LogOut
              size={20}
              className="text-gray-500 group-hover:text-red-600"
            />

            {!collapsed && (
              <span>Logout</span>
            )}
          </button>

        </div>

      </nav>

      {/* ================= USER ================= */}

      <div className="border-t border-gray-200 p-4">

        <div
          className={`flex items-center rounded-xl bg-gray-50 p-3 ${
            collapsed
              ? "justify-center"
              : "gap-3"
          }`}
        >

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            A
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-800">
                Admin User
              </p>

              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>
          )}

        </div>

      </div>

    </aside>
  );
}