"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  User,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface Props {
  onLogout: () => void;
}

interface LoggedInUser {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export default function ProfileDropdown({
  onLogout,
}: Props) {
  const [user, setUser] = useState<LoggedInUser>({
    name: "Owner",
    email: "owner@poobalasingham.lk",
    role: "Owner",
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        setUser({
          ...parsedUser,
          name:
            parsedUser.fullName ||
            parsedUser.name ||
            "Owner",
          email:
            parsedUser.email ||
            "owner@poobalasingham.lk",
          role:
            parsedUser.role ||
            "Owner",
        });
      }
    } catch (error) {
      console.error(
        "Failed to load logged-in user:",
        error
      );
    }
  }, []);

  /* =========================================================
     USER DETAILS
  ========================================================= */

  const userName =
    user.fullName ||
    user.name ||
    "Owner";

  const userEmail =
    user.email ||
    "owner@poobalasingham.lk";

  const userRole =
    user.role ||
    "Owner";

  /* =========================================================
     ROLE DISPLAY
  ========================================================= */

  const roleLabels: Record<string, string> = {
    user: "Owner",
    owner: "Owner",
    admin: "Administrator",
    administrator: "Administrator",
    manager: "Manager",
    cashier: "Cashier",
    accountant: "Accountant",
    staff: "Staff",
  };

  const displayRole =
    roleLabels[userRole.toLowerCase()] ||
    userRole;

  /* =========================================================
     AVATAR
  ========================================================= */

  const avatarLetter =
    userName.trim().charAt(0).toUpperCase() || "O";

  return (
    <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

      {/* =====================================================
          USER
      ===================================================== */}

      <div className="border-b p-5">
        <div className="flex items-center gap-4">

          {/* Avatar */}

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            {avatarLetter}
          </div>

          {/* Details */}

          <div className="min-w-0 flex-1">

            <h3 className="truncate font-semibold text-slate-800">
              {userName}
            </h3>

            <p className="truncate text-sm text-slate-500">
              {userEmail}
            </p>

            <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
              {displayRole}
            </span>

          </div>
        </div>
      </div>

      {/* =====================================================
          MENU
      ===================================================== */}

      <div className="py-2">

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-5 py-3 text-slate-700 transition hover:bg-slate-50"
        >
          <User size={18} />
          <span>My Profile</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-5 py-3 text-slate-700 transition hover:bg-slate-50"
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>

        <Link
          href="/security"
          className="flex items-center gap-3 px-5 py-3 text-slate-700 transition hover:bg-slate-50"
        >
          <ShieldCheck size={18} />
          <span>Security</span>
        </Link>

      </div>

      {/* =====================================================
          LOGOUT
      ===================================================== */}

      <div className="border-t p-3">

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </div>

    </div>
  );
}
