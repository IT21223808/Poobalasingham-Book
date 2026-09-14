"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  Menu,
  Search,
  X,
} from "lucide-react";

import NotificationDropdown from "@/components/ui/NotificationDropdown";
import ProfileDropdown from "@/components/ui/ProfileDropdown";

interface StoredUser {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;

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

interface HeaderProps {
  userName?: string;
  onMenuClick?: () => void;
  mobileMenuOpen?: boolean;
}

export default function Header({
  userName = "User",
  onMenuClick,
  mobileMenuOpen = false,
}: HeaderProps) {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [openNotification, setOpenNotification] =
    useState(false);

  const [openProfile, setOpenProfile] =
    useState(false);

  /* =========================================================
     LOAD LOGGED-IN USER
  ========================================================= */

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser =
          localStorage.getItem("user");

        if (!storedUser) {
          setUser(null);
          return;
        }

        const parsedUser: StoredUser =
          JSON.parse(storedUser);

        setUser(parsedUser);
      } catch (error) {
        console.error(
          "Failed to load logged-in user:",
          error,
        );

        setUser(null);
      }
    };

    loadUser();

    window.addEventListener(
      "userUpdated",
      loadUser,
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        loadUser,
      );
    };
  }, []);

  /* =========================================================
     USER NAME
  ========================================================= */

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${
          user?.lastName ?? ""
        }`.trim()
      : userName;

  /* =========================================================
     INITIALS
  ========================================================= */

  const initials =
    `${user?.firstName?.charAt(0) ?? ""}${
      user?.lastName?.charAt(0) ?? ""
    }`.toUpperCase() ||
    fullName.charAt(0).toUpperCase() ||
    "U";

  /* =========================================================
     ROLE
  ========================================================= */

  const roleLabel = (() => {
    switch (user?.role) {
      case "ADMIN":
        return "Shop Owner";

      case "OWNER":
        return "Shop Owner";

      case "MANAGER":
        return "Branch Manager";

      case "CASHIER":
        return "Cashier";

      case "STAFF":
        return "Cashier";

      default:
        return "User";
    }
  })();

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("authToken");

    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("loggedInUserType");

    sessionStorage.clear();

    router.push("/login");
  };

  /* =========================================================
     NOTIFICATION
  ========================================================= */

  const handleNotification = () => {
    setOpenNotification(
      (previous) => !previous,
    );

    setOpenProfile(false);
  };

  /* =========================================================
     PROFILE DROPDOWN
  ========================================================= */

  const handleProfile = () => {
    setOpenProfile(
      (previous) => !previous,
    );

    setOpenNotification(false);
  };

  /* =========================================================
     MOBILE MENU
  ========================================================= */

  const handleMenuClick = () => {
    onMenuClick?.();
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 md:px-6">

      {/* =====================================================
          LEFT
      ===================================================== */}

      <div className="flex min-w-0 items-center gap-3">

        {/* ===================================================
            MOBILE MENU BUTTON
        =================================================== */}

        <button
          type="button"
          onClick={handleMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden"
          aria-label={
            mobileMenuOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

        {/* ===================================================
            WELCOME TEXT
        =================================================== */}

        <div className="min-w-0">

          <h1 className="truncate text-base font-semibold text-slate-800 sm:text-xl">
            Welcome, {fullName} 👋
          </h1>

          <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
            Here&apos;s what&apos;s happening with your bookstore today.
          </p>

        </div>

      </div>

      {/* =====================================================
          RIGHT
      ===================================================== */}

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-4">

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">

          <Search
            size={18}
            className="text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />

        </div>

        {/* ===================================================
            NOTIFICATION
        =================================================== */}

        <div className="relative">

          <button
            type="button"
            onClick={handleNotification}
            className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 sm:p-2.5"
            aria-label="Notifications"
            aria-expanded={openNotification}
          >
            <Bell size={20} />

            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white sm:right-1 sm:top-1">
              3
            </span>
          </button>

          {openNotification && (
            <NotificationDropdown />
          )}

        </div>

        {/* ===================================================
            DIVIDER
        =================================================== */}

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* ===================================================
            PROFILE
        =================================================== */}

        <div className="relative">

          <button
            type="button"
            onClick={handleProfile}
            className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100 sm:gap-3 sm:p-1.5"
            aria-label="Profile menu"
            aria-expanded={openProfile}
          >

            {/* Avatar */}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white sm:h-10 sm:w-10">
              {initials}
            </div>

            {/* User Information */}

            <div className="hidden text-left md:block">

              <p className="max-w-32 truncate text-sm font-semibold text-slate-800">
                {fullName}
              </p>

              <p className="text-xs text-slate-500">
                {roleLabel}
              </p>

            </div>

          </button>

          {/* =================================================
              PROFILE DROPDOWN
          ================================================= */}

          {openProfile && (
            <ProfileDropdown
              onLogout={logout}
            />
          )}

        </div>

      </div>

    </header>
  );
}