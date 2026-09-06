"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";

interface ERPLayoutProps {
  children: React.ReactNode;
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

type Permission =
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
  role?: UserRole;
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
  Permission[]
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
   ROUTE → PERMISSION
========================================================= */

const getRequiredPermission = (
  pathname: string,
): Permission | null => {
  /* ================= DASHBOARD ================= */

  if (pathname === "/dashboard") {
    return "dashboard";
  }

  /* ================= CATALOG ================= */

  if (
    pathname === "/dashboard/catalog" ||
    pathname.startsWith("/dashboard/catalog/")
  ) {
    return "catalog";
  }

  /* ================= PRODUCTS ================= */

  if (
    pathname === "/dashboard/products" ||
    pathname.startsWith("/dashboard/products/")
  ) {
    return "products";
  }

  /* ================= INVENTORY ================= */

  if (
    pathname === "/dashboard/inventory" ||
    pathname.startsWith("/dashboard/inventory/")
  ) {
    /*
      Important:
      Locations is inside /dashboard/inventory/locations.
      Check it separately before inventory.
    */

    if (
      pathname === "/dashboard/inventory/locations" ||
      pathname.startsWith(
        "/dashboard/inventory/locations/",
      )
    ) {
      return "locations";
    }

    return "inventory";
  }

  /* ================= PURCHASING ================= */

  if (
    pathname === "/dashboard/purchasing" ||
    pathname.startsWith("/dashboard/purchasing/")
  ) {
    return "purchasing";
  }

  /* ================= ORDERS ================= */

  if (
    pathname === "/dashboard/orders" ||
    pathname.startsWith("/dashboard/orders/")
  ) {
    return "orders";
  }

  /* ================= CUSTOMERS ================= */

  if (
    pathname === "/dashboard/customers" ||
    pathname.startsWith("/dashboard/customers/")
  ) {
    return "customers";
  }

  /* ================= SUPPLIERS ================= */

  if (
    pathname === "/dashboard/suppliers" ||
    pathname.startsWith("/dashboard/suppliers/")
  ) {
    return "suppliers";
  }

  /* ================= FINANCE ================= */

  if (
    pathname === "/dashboard/finance" ||
    pathname.startsWith("/dashboard/finance/")
  ) {
    return "finance";
  }

  /* ================= REPORTS ================= */

  if (
    pathname === "/dashboard/reports" ||
    pathname.startsWith("/dashboard/reports/")
  ) {
    return "reports";
  }

  /* ================= SETTINGS ================= */

  if (
    pathname === "/dashboard/settings" ||
    pathname.startsWith("/dashboard/settings/")
  ) {
    return "settings";
  }

  /* ================= POS ================= */

  if (
    pathname === "/pos" ||
    pathname.startsWith("/pos/")
  ) {
    return "pos";
  }

  return null;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ERPLayout({
  children,
}: ERPLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [accessDenied, setAccessDenied] =
    useState(false);

  /* =======================================================
     CHECK AUTH + ROUTE PERMISSION
  ======================================================= */

  useEffect(() => {
    const checkAccess = () => {
      try {
        const token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token");

        const storedUser =
          localStorage.getItem("user");

        /* ================================================
           NOT LOGGED IN
        ================================================ */

        if (!token || !storedUser) {
          router.replace("/login");
          return;
        }

        const parsedUser: StoredUser =
          JSON.parse(storedUser);

        const currentRole =
          normalizeRole(parsedUser.role);

        const requiredPermission =
          getRequiredPermission(pathname);

        /* ================================================
           UNKNOWN ROUTE

           If route is not one of our protected module
           routes, allow it.
        ================================================ */

        if (!requiredPermission) {
          setAccessDenied(false);
          setCheckingAccess(false);
          return;
        }

        const allowedPermissions =
          ROLE_PERMISSIONS[currentRole];

        const hasPermission =
          allowedPermissions.includes(
            requiredPermission,
          );

        /* ================================================
           ACCESS DENIED
        ================================================ */

        if (!hasPermission) {
          setAccessDenied(true);
          setCheckingAccess(false);
          return;
        }

        /* ================================================
           ACCESS GRANTED
        ================================================ */

        setAccessDenied(false);
        setCheckingAccess(false);
      } catch (error) {
        console.error(
          "Route access check failed:",
          error,
        );

        router.replace("/login");
      }
    };

    checkAccess();
  }, [pathname, router]);

  /* =======================================================
     SIDEBAR TOGGLE
  ======================================================= */

  const toggleSidebar = () => {
    setSidebarCollapsed(
      (previous) => !previous,
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-sm text-gray-500">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ACCESS DENIED
  ======================================================= */

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <span className="text-2xl text-red-600">
              !
            </span>
          </div>

          <h1 className="text-xl font-semibold text-gray-800">
            Access Denied
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You do not have permission to access
            this page.
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace("/dashboard")
            }
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     NORMAL ERP LAYOUT
  ======================================================= */

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ================= SIDEBAR ================= */}

      <Sidebar
        collapsed={sidebarCollapsed}
        onLogoClick={toggleSidebar}
      />

      {/* ================= RIGHT SIDE ================= */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ================= HEADER ================= */}

        <Header />

        {/* ================= CONTENT ================= */}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}