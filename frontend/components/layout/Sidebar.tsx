"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
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
  MapPin,
  BookOpen,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  onLogoClick: () => void;
}

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "ADMIN"
  | "STAFF"
  | "USER";

type MenuPermission =
  | "dashboard"
  | "catalog"
  | "products"
  | "inventory"
  | "locations"
  | "purchasing"
  | "orders"
  | "customers"
  | "suppliers"
  | "finance"
  | "reports"
  | "pos"
  | "settings";

interface StoredUser {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;

  locationId?: string | null;
  tillId?: number | null;

  location?: {
    id: string;
    name: string;
  } | null;

  till?: {
    id: number;
    name: string;
    code: string;
  } | null;
}

/* =========================================================
   ROLE NORMALIZATION
========================================================= */

const normalizeRole = (
  role?: UserRole,
): "OWNER" | "MANAGER" | "CASHIER" | "USER" => {
  switch (role) {
    case "ADMIN":
      return "OWNER";

    case "STAFF":
      return "CASHIER";

    case "OWNER":
      return "OWNER";

    case "MANAGER":
      return "MANAGER";

    case "CASHIER":
      return "CASHIER";

    default:
      return "USER";
  }
};

/* =========================================================
   ROLE PERMISSIONS
========================================================= */

const ROLE_PERMISSIONS: Record<
  "OWNER" | "MANAGER" | "CASHIER" | "USER",
  MenuPermission[]
> = {
  OWNER: [
    "dashboard",
    "catalog",
    "products",
    "inventory",
    "locations",
    "purchasing",
    "orders",
    "customers",
    "suppliers",
    "finance",
    "reports",
    "pos",
    "settings",
  ],

  MANAGER: [
    "dashboard",
    "catalog",
    "products",
    "inventory",
    "orders",
    "customers",
    "reports",
    "pos",
  ],

  CASHIER: [
    "dashboard",
    "catalog",
    "products",
    "orders",
    "customers",
    "pos",
  ],

  USER: [],
};

/* =========================================================
   MENU ITEMS
========================================================= */

const menuItems: {
  title: string;
  href: string;
  icon: React.ElementType;
  permission: MenuPermission;
}[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },

  {
    title: "Catalog",
    href: "/dashboard/catalog",
    icon: BookOpen,
    permission: "catalog",
  },

  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
    permission: "products",
  },

  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
    permission: "inventory",
  },

  {
    title: "Locations",
    href: "/dashboard/inventory/locations",
    icon: MapPin,
    permission: "locations",
  },

  {
    title: "Purchasing",
    href: "/dashboard/purchasing",
    icon: ShoppingCart,
    permission: "purchasing",
  },

  {
    title: "Orders",
    href: "/dashboard/orders",
    icon: FolderOpen,
    permission: "orders",
  },

  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    permission: "customers",
  },

  {
    title: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Truck,
    permission: "suppliers",
  },

  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: Wallet,
    permission: "finance",
  },

  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    permission: "reports",
  },

  {
    title: "POS Billing",
    href: "/pos",
    icon: CreditCard,
    permission: "pos",
  },
];

/* =========================================================
   ROLE LABEL
========================================================= */

const getRoleLabel = (
  role: "OWNER" | "MANAGER" | "CASHIER" | "USER",
) => {
  switch (role) {
    case "OWNER":
      return "Shop Owner";

    case "MANAGER":
      return "Branch Manager";

    case "CASHIER":
      return "Cashier";

    default:
      return "User";
  }
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Sidebar({
  collapsed,
  onLogoClick,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(
    null,
  );

  const [branchName, setBranchName] =
    useState<string>("");

  const [tillName, setTillName] =
    useState<string>("");

  /* =======================================================
     LOAD LOGGED-IN USER
  ======================================================= */

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("user");

      let parsedUser: StoredUser | null = null;

      if (storedUser) {
        try {
          parsedUser =
            JSON.parse(storedUser);
        } catch (error) {
          console.error(
            "Failed to parse logged-in user:",
            error,
          );
        }
      }

      setUser(parsedUser);

      /* ---------------------------------------------------
         Branch
      --------------------------------------------------- */

      const storedBranchName =
        parsedUser?.location?.name ||
        localStorage.getItem(
          "userLocationName",
        ) ||
        "";

      setBranchName(
        storedBranchName.trim(),
      );

      /* ---------------------------------------------------
         Till
      --------------------------------------------------- */

      const storedTillName =
        parsedUser?.till?.name ||
        localStorage.getItem(
          "userTillName",
        ) ||
        "";

      setTillName(
        storedTillName.trim(),
      );
    } catch (error) {
      console.error(
        "Failed to load logged-in user:",
        error,
      );

      setUser(null);
      setBranchName("");
      setTillName("");
    }
  }, []);

  /* =======================================================
     CURRENT ROLE
  ======================================================= */

  const currentRole = useMemo(() => {
    return normalizeRole(user?.role);
  }, [user?.role]);

  /* =======================================================
     ALLOWED MENU ITEMS
  ======================================================= */

  const allowedPermissions =
    ROLE_PERMISSIONS[currentRole];

  const visibleMenuItems = useMemo(() => {
    return menuItems.filter((item) =>
      allowedPermissions.includes(
        item.permission,
      ),
    );
  }, [allowedPermissions]);

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    /* ---------------------------------------------------
       Authentication tokens
    --------------------------------------------------- */

    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");

    /* ---------------------------------------------------
       User/session data
    --------------------------------------------------- */

    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem(
      "loggedInUserType",
    );

    /* ---------------------------------------------------
       Branch / Till data
    --------------------------------------------------- */

    localStorage.removeItem(
      "userLocationId",
    );

    localStorage.removeItem(
      "userLocationName",
    );

    localStorage.removeItem(
      "userTillId",
    );

    localStorage.removeItem(
      "userTillName",
    );

    /* ---------------------------------------------------
       Session storage
    --------------------------------------------------- */

    sessionStorage.removeItem("token");
    sessionStorage.removeItem(
      "accessToken",
    );
    sessionStorage.removeItem(
      "access_token",
    );

    sessionStorage.clear();

    /* ---------------------------------------------------
       Go to login
    --------------------------------------------------- */

    router.push("/login");
  };

  /* =======================================================
     ACTIVE MENU
  ======================================================= */

  const isActive = (href: string) => {
    /* Dashboard exact match */

    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    /* Inventory main menu exact match */

    if (href === "/dashboard/inventory") {
      return pathname ===
        "/dashboard/inventory";
    }

    /* Other menu items */

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  /* =======================================================
     USER DISPLAY
  ======================================================= */

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${
          user?.lastName ?? ""
        }`.trim()
      : "User";

  const initials =
    `${user?.firstName?.charAt(0) ?? ""}${
      user?.lastName?.charAt(0) ?? ""
    }`.toUpperCase() || "U";

  const roleLabel =
    getRoleLabel(currentRole);

  /* =======================================================
     BRANCH / TILL DISPLAY
  ======================================================= */

  const displayBranch =
    branchName || "No Branch Assigned";

  const displayTill =
    tillName || "";

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed
          ? "w-20"
          : "w-72"
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
        className="flex w-full justify-center border-b border-gray-200 px-4 py-5 transition hover:bg-slate-50"
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
          {visibleMenuItems.map(
            (item) => {
              const Icon = item.icon;
              const active =
                isActive(item.href);

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
                  {/* Active indicator */}

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
                    <span>
                      {item.title}
                    </span>
                  )}
                </Link>
              );
            },
          )}
        </div>

        {/* ================= GENERAL ================= */}

        {!collapsed && (
          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            General
          </p>
        )}

        <div className="mt-2 space-y-1">
          {/* ================= SETTINGS ================= */}

          {allowedPermissions.includes(
            "settings",
          ) && (
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
                pathname ===
                "/dashboard/settings"
                  ? "bg-blue-50 font-semibold text-blue-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <Settings
                size={20}
                className={
                  pathname ===
                  "/dashboard/settings"
                    ? "text-blue-600"
                    : "text-gray-500 group-hover:text-gray-700"
                }
              />

              {!collapsed && (
                <span>
                  Settings
                </span>
              )}
            </Link>
          )}

          {/* ================= LOGOUT ================= */}

          <button
            type="button"
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
          {/* Avatar */}

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            {initials}
          </div>

          {!collapsed && (
            <div className="min-w-0">
              {/* Name */}

              <p className="truncate font-semibold text-gray-800">
                {fullName}
              </p>

              {/* Role */}

              <p className="text-xs text-gray-500">
                {roleLabel}
              </p>

              {/* Branch + Till */}

              <p className="truncate text-[11px] text-gray-400">
                {displayBranch}

                {displayTill
                  ? ` • ${displayTill}`
                  : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}