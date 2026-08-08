"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  Search,
} from "lucide-react";

import NotificationDropdown from "@/components/ui/NotificationDropdown";
import ProfileDropdown from "@/components/ui/ProfileDropdown";

interface HeaderProps {
  userName?: string;
}

export default function Header({
  userName = "Jathu",
}: HeaderProps) {
  const router = useRouter();

  const [openNotification, setOpenNotification] =
    useState(false);

  const [openProfile, setOpenProfile] =
    useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();

    router.push("/login");
  };

  const handleNotification = () => {
    setOpenNotification(
      (previous) => !previous
    );

    setOpenProfile(false);
  };

  const handleProfile = () => {
    setOpenProfile(
      (previous) => !previous
    );

    setOpenNotification(false);
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">

      {/* ================= LEFT ================= */}

      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Welcome, {userName} 👋
        </h1>

        <p className="mt-0.5 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your bookstore today.
        </p>
      </div>

      {/* ================= RIGHT ================= */}

      <div className="flex items-center gap-2 md:gap-4">

        {/* Search */}

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

        {/* Notification */}

        <div className="relative">

          <button
            onClick={handleNotification}
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={21} />

            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {openNotification && (
            <NotificationDropdown />
          )}

        </div>

        {/* Divider */}

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Profile */}

        <div className="relative">

          <button
            onClick={handleProfile}
            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-100"
            aria-label="Profile"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="hidden text-left md:block">

              <p className="text-sm font-semibold text-slate-800">
                {userName}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>

            </div>

          </button>

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