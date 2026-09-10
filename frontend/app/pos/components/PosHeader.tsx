"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  CreditCard,
  Clock,
  Keyboard,
  DollarSign,
  ArrowLeft,
  Search,
  Barcode,
  X,
} from "lucide-react";

interface PosHeaderProps {
  onOpenShortcutGuide: () => void;
  cashierName?: string;

  // Logged-in user's branch
  branchName?: string;

  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBarcodeScan: (code: string) => void;
  onClearSearch: () => void;

  isLoadingProducts?: boolean;
  isOffline?: boolean;
  queuedSalesCount?: number;

  // Opening Balance
  openingBalance?: number;
}

export default function PosHeader({
  onOpenShortcutGuide,
  cashierName = "Admin",

  // Branch
  branchName = "Main Branch",

  searchQuery,
  onSearchChange,
  onBarcodeScan,
  onClearSearch,

  isLoadingProducts = false,
  isOffline = false,
  queuedSalesCount = 0,

  // Opening Balance
  openingBalance = 0,
}: PosHeaderProps) {
  const [currentTime, setCurrentTime] =
    useState<string>("");

  const inputRef =
    useRef<HTMLInputElement>(null);

  /* =====================================================
     LIVE CLOCK
  ====================================================== */

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
          "  " +
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
      );
    };

    updateTime();

    const interval = setInterval(
      updateTime,
      1000,
    );

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================================
     F2 → SEARCH
  ====================================================== */

  useEffect(() => {
    const handleKeyDown = (
      e: KeyboardEvent,
    ) => {
      if (e.key === "F2") {
        e.preventDefault();

        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, []);

  /* =====================================================
     SEARCH / BARCODE ENTER
  ====================================================== */

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.key === "Enter" &&
      searchQuery.trim()
    ) {
      e.preventDefault();

      onBarcodeScan(
        searchQuery.trim(),
      );
    }
  };

  /* =====================================================
     SAFE BRANCH NAME
  ====================================================== */

  const displayBranchName =
    branchName?.trim() ||
    "Main Branch";

  /* =====================================================
     UI
  ====================================================== */

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full min-w-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm">

      {/* =====================================================
          LEFT: BACK + BRAND + SEARCH
      ====================================================== */}

      <div className="flex min-w-0 flex-1 items-center gap-6">

        {/* BACK + BRAND */}

        <div className="flex shrink-0 items-center gap-3">

          <Link
            href="/dashboard"
            className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>

          <div className="flex items-center gap-3">

            {/* POS ICON */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <CreditCard size={20} />
            </div>

            {/* BRAND + BRANCH */}

            <div className="hidden lg:block">

              <h1 className="text-base font-bold leading-tight text-slate-900">
                POS Billing
              </h1>

              <p className="text-xs font-medium leading-tight text-slate-500">
                Poobalasingham Book Depot
                <span className="mx-1 text-slate-300">
                  ·
                </span>
                <span className="font-semibold text-blue-600">
                  {displayBranchName}
                </span>
              </p>

            </div>
          </div>
        </div>

        {/* =================================================
            SEARCH BAR
        ================================================== */}

        <div className="relative flex min-w-[200px] max-w-[600px] flex-1">

          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">

            <Search
              size={20}
              className={
                isLoadingProducts
                  ? "animate-pulse text-blue-600"
                  : ""
              }
            />

          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) =>
              onSearchChange(
                e.target.value,
              )
            }
            onKeyDown={
              handleSearchKeyDown
            }
            placeholder="Search product, barcode or ISBN... (F2)"
            className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-12 text-sm font-medium text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            autoFocus
          />

          <div className="absolute inset-y-0 right-2 flex items-center">

            {searchQuery ? (
              <button
                type="button"
                onClick={
                  onClearSearch
                }
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                title="Clear search"
              >
                <X size={16} />
              </button>
            ) : (
              <span className="hidden items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-sm sm:flex">
                <Barcode size={12} />
              </span>
            )}

          </div>
        </div>
      </div>

      {/* =====================================================
          STATUS + OPENING BALANCE
      ====================================================== */}

      <div className="flex shrink-0 items-center gap-2">

        {/* OPENING BALANCE */}

        <div className="hidden items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:flex">

          <DollarSign
            size={14}
            className="shrink-0"
          />

          <span className="whitespace-nowrap">
            Opening Balance: Rs.{" "}
            {Number(
              openingBalance || 0,
            ).toLocaleString(
              "en-LK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </span>

        </div>

        {/* OFFLINE / SYNC STATUS */}

        <div
          className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold sm:flex ${
            isOffline
              ? "border-red-200 bg-red-50 text-red-700"
              : queuedSalesCount > 0
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >

          <span
            className={`h-2 w-2 rounded-full ${
              isOffline
                ? "bg-red-500"
                : queuedSalesCount > 0
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
          />

          <span>
            {isOffline
              ? "Offline"
              : queuedSalesCount > 0
                ? "Syncing"
                : "Online"}
          </span>

          {queuedSalesCount > 0 && (
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px]">
              Queue:{" "}
              {queuedSalesCount}
            </span>
          )}

        </div>
      </div>

      {/* =====================================================
          RIGHT: ACTIONS + PROFILE
      ====================================================== */}

      <div className="flex shrink-0 items-center gap-4">

        {/* LIVE CLOCK */}

        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 xl:flex">

          <Clock
            size={14}
            className="shrink-0 text-blue-500"
          />

          <span className="whitespace-nowrap">
            {currentTime ||
              "Loading..."}
          </span>

        </div>

        {/* ACTION BUTTONS */}

        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">

          {/* SHORTCUTS */}

          <button
            type="button"
            onClick={
              onOpenShortcutGuide
            }
            className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 lg:flex"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={15} />

            <span>
              Shortcuts
            </span>
          </button>

          {/* CASH CLOSING */}

          <Link
            href="/pos/cash-closing"
            className="hidden items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 md:flex"
            title="Cash Closing"
          >
            <DollarSign
              size={15}
            />

            <span>
              Cash Closing
            </span>
          </Link>

        </div>

        {/* =================================================
            CASHIER PROFILE
        ================================================== */}

        <div className="flex shrink-0 items-center gap-3 border-l border-slate-200 pl-4">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white shadow-sm">
            {cashierName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="hidden text-left sm:block">

            <p className="text-sm font-bold leading-tight text-slate-800">
              {cashierName}
            </p>

            <p className="text-xs font-medium leading-tight text-slate-500">
              Cashier ·{" "}
              {displayBranchName}
            </p>

          </div>
        </div>

      </div>
    </header>
  );
}