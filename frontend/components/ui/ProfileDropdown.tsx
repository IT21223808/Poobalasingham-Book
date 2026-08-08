"use client";

import Link from "next/link";
import {
  User,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface Props {
  onLogout: () => void;
}

export default function ProfileDropdown({
  onLogout,
}: Props) {
  return (
    <div className="absolute right-0 top-14 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

      {/* User */}

      <div className="border-b p-5">

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
            A
          </div>

          <div>

            <h3 className="font-semibold text-slate-800">
              Admin User
            </h3>

            <p className="text-sm text-slate-500">
              admin@bookdepot.com
            </p>

            <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
              Administrator
            </span>

          </div>

        </div>

      </div>

      {/* Menu */}

      <div className="py-2">

        <Link
          href="/profile"
          className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
        >
          <User size={18} />
          My Profile
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
        >
          <Settings size={18} />
          Settings
        </Link>

        <Link
          href="/security"
          className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
        >
          <ShieldCheck size={18} />
          Security
        </Link>

      </div>

      {/* Logout */}

      <div className="border-t p-3">

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={18} />

          Logout
        </button>

      </div>

    </div>
  );
}