"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Banknote,
  CreditCard,
  QrCode,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Loader2,
  Wallet,
  Lock,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import posService from "@/services/pos.service";
import { CashClosingSummary } from "@/types/pos";

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CashClosingPage() {
  const [selectedDate, setSelectedDate] =
    useState<string>(getLocalDate());

  const [summary, setSummary] =
    useState<CashClosingSummary | null>(null);

  const [actualCash, setActualCash] =
    useState<string>("");

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [isClosing, setIsClosing] =
    useState<boolean>(false);

  const [branchName, setBranchName] =
    useState<string>("Main Branch");

  const [closed, setClosed] =
    useState<boolean>(false);

  const [closingResult, setClosingResult] =
    useState<any>(null);

  /*
   * ---------------------------------------------------------
   * LOAD USER / BRANCH
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        const storedBranch =
          localStorage.getItem(
            "userLocationName",
          );

        if (storedBranch) {
          setBranchName(storedBranch);
        }

        return;
      }

      const user = JSON.parse(storedUser);

      const name =
        user?.location?.name ||
        user?.locationName ||
        localStorage.getItem(
          "userLocationName",
        );

      if (name) {
        setBranchName(name);
      }
    } catch (error) {
      console.error(
        "Failed to load user branch:",
        error,
      );
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD CASH CLOSING SUMMARY
   * ---------------------------------------------------------
   */

  const loadSummary = async (
    date: string,
  ) => {
    setIsLoading(true);

    try {
      const data =
        await posService.getCashClosingSummary(
          date,
        );

      setSummary(data);

      /*
       * If backend returns already closed information,
       * mark register as closed.
       */
      const backendClosed =
        Boolean(
          (data as any)?.closed ||
          (data as any)?.isClosed,
        );

      setClosed(backendClosed);

      if (backendClosed) {
        setClosingResult(data);
      } else {
        setClosingResult(null);
        setActualCash("");
      }
    } catch (error: any) {
      console.error(
        "Failed to load cash closing summary:",
        error,
      );

      setSummary(null);
      setClosed(false);
      setClosingResult(null);

      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch cash closing summary.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary(selectedDate);
  }, [selectedDate]);

  /*
   * ---------------------------------------------------------
   * BACKEND VALUES
   * ---------------------------------------------------------
   */

  const openingCash =
    Number(
      (summary as any)?.openingCash ??
        (summary as any)?.openingBalance ??
        0,
    );

  const cashSales =
    Number(summary?.cashSales ?? 0);

  const cardSales =
    Number(summary?.cardSales ?? 0);

  const qrSales =
    Number(summary?.qrSales ?? 0);

  const totalSales =
    Number(summary?.totalSales ?? 0);

  const refunds =
    Number(
      (summary as any)?.totalRefunds ??
        (summary as any)?.refunds ??
        0,
    );

  /*
   * Backend already calculates this.
   *
   * Fallback calculation is kept only for compatibility
   * with older backend response.
   */
  const expectedCash =
    Number(
      (summary as any)?.expectedCash ??
        openingCash +
          cashSales -
          refunds,
    );

  /*
   * ---------------------------------------------------------
   * ACTUAL CASH
   * ---------------------------------------------------------
   */

  const actualCashNumber =
    actualCash === ""
      ? 0
      : Number(actualCash);

  const variance =
    actualCash === ""
      ? 0
      : actualCashNumber -
        expectedCash;

  const hasVariance =
    actualCash !== "" &&
    Math.abs(variance) >= 0.01;

  /*
   * ---------------------------------------------------------
   * PRINT
   * ---------------------------------------------------------
   */

  const handlePrint = () => {
    window.print();
  };

  /*
   * ---------------------------------------------------------
   * CLOSE REGISTER
   * ---------------------------------------------------------
   */

  const handleCloseRegister =
    async () => {
      if (closed) {
        toast.error(
          "This register is already closed for the selected date.",
        );
        return;
      }

      if (!summary) {
        toast.error(
          "Cash closing summary is not available.",
        );
        return;
      }

      if (actualCash === "") {
        toast.error(
          "Please enter the actual cash counted.",
        );
        return;
      }

      if (
        !Number.isFinite(
          actualCashNumber,
        )
      ) {
        toast.error(
          "Please enter a valid actual cash amount.",
        );
        return;
      }

      if (actualCashNumber < 0) {
        toast.error(
          "Actual cash cannot be negative.",
        );
        return;
      }

      /*
       * Prevent accidental double click.
       */
      if (isClosing) {
        return;
      }

      setIsClosing(true);

      try {
        /*
         * Backend is authoritative for:
         * - locationId
         * - tillId
         * - businessDate
         * - opening balance
         * - sales
         * - refunds
         * - expected cash
         *
         * Frontend sends ONLY actualCash + date.
         */
        const result =
          await posService.closeCash({
            actualCash:
              actualCashNumber,
            businessDate:
              selectedDate,
          });

        setClosingResult(result);
        setClosed(true);

        /*
         * Keep displayed actual cash from backend
         * after successful save.
         */
        if (
          result?.actualCash !==
          undefined
        ) {
          setActualCash(
            Number(
              result.actualCash,
            ).toFixed(2),
          );
        }

        toast.success(
          "Daily cash closing completed successfully.",
        );
      } catch (error: any) {
        console.error(
          "Cash closing failed:",
          error,
        );

        /*
         * Backend already-closed protection.
         */
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to close register.";

        if (
          String(message)
            .toLowerCase()
            .includes("already")
        ) {
          setClosed(true);

          toast.error(
            "This register is already closed for the selected date.",
          );

          /*
           * Reload backend state.
           */
          await loadSummary(
            selectedDate,
          );
        } else {
          toast.error(message);
        }
      } finally {
        setIsClosing(false);
      }
    };

  /*
   * ---------------------------------------------------------
   * DISPLAY VALUES AFTER CLOSING
   * ---------------------------------------------------------
   */

  const displayedActualCash =
    closed &&
    closingResult?.actualCash !==
      undefined
      ? Number(
          closingResult.actualCash,
        )
      : actualCashNumber;

  const displayedVariance =
    closed &&
    closingResult?.difference !==
      undefined
      ? Number(
          closingResult.difference,
        )
      : variance;

  const displayedExpectedCash =
    closed &&
    closingResult?.expectedCash !==
      undefined
      ? Number(
          closingResult.expectedCash,
        )
      : expectedCash;

  const displayedHasVariance =
    Math.abs(displayedVariance) >=
    0.01;

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-6xl space-y-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 print:shadow-none">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              <Link
                href="/pos"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 print:hidden"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>

                <h1 className="text-xl font-black text-slate-800">
                  Daily Cash Closing
                </h1>

                <p className="mt-1 text-xs font-medium text-slate-500">

                  Poobalasingham Book Depot

                  <span className="mx-1 text-slate-300">
                    •
                  </span>

                  <span className="font-semibold text-blue-600">
                    {branchName}
                  </span>

                </p>

                {closed && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    <Lock size={12} />
                    Register Closed
                  </div>
                )}

              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* DATE */}

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">

                <Calendar
                  size={15}
                  className="text-blue-600"
                />

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(
                      e.target.value,
                    )
                  }
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                />

              </div>

              {/* PRINT */}

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 print:hidden"
              >
                <Printer size={15} />
                Print Report
              </button>

            </div>
          </div>
        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">

            <Loader2
              size={32}
              className="animate-spin text-blue-600"
            />

          </div>
        ) : !summary ? (

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

            <AlertTriangle
              size={32}
              className="mx-auto text-red-500"
            />

            <p className="mt-3 text-sm font-bold text-red-700">
              Cash closing summary could not be loaded.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {/* =================================================
                ALREADY CLOSED NOTICE
            ================================================= */}

            {closed && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={21} />
                  </div>

                  <div>

                    <h2 className="text-sm font-black text-emerald-800">
                      Register already closed
                    </h2>

                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Cash closing for{" "}
                      {selectedDate} has already been
                      recorded. Another closing cannot
                      be created for this register and date.
                    </p>

                    {closingResult?.closedAt && (
                      <p className="mt-2 text-[11px] font-semibold text-emerald-600">
                        Closed at:{" "}
                        {new Date(
                          closingResult.closedAt,
                        ).toLocaleString()}
                      </p>
                    )}

                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                MAIN BALANCE CARDS
            ================================================= */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              {/* OPENING CASH */}

              <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      POS Opening Cash
                    </p>

                    <p className="mt-2 text-2xl font-black text-slate-800">
                      {formatCurrency(
                        openingCash,
                      )}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      Starting cash for this POS
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Wallet size={22} />
                  </div>

                </div>

              </div>

              {/* EXPECTED CASH */}

              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Expected Cash
                    </p>

                    <p className="mt-2 text-2xl font-black text-emerald-700">
                      {formatCurrency(
                        displayedExpectedCash,
                      )}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      Cash expected in drawer
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Banknote size={22} />
                  </div>

                </div>

              </div>

              {/* ACTUAL CASH */}

              <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">

                <div className="flex items-start justify-between">

                  <div className="flex-1">

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Actual Cash
                    </p>

                    {closed ? (

                      <p className="mt-2 text-2xl font-black text-purple-700">
                        {formatCurrency(
                          displayedActualCash,
                        )}
                      </p>

                    ) : (

                      <div className="mt-2 flex items-center gap-2">

                        <span className="text-sm font-bold text-slate-400">
                          Rs.
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={actualCash}
                          onChange={(e) =>
                            setActualCash(
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                          className="w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xl font-black text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                        />

                      </div>

                    )}

                    <p className="mt-1 text-[11px] font-medium text-slate-400">
                      Physical cash counted
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Banknote size={22} />
                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                SALES SUMMARY
            ================================================= */}

            <div>

              <div className="mb-3">

                <h2 className="text-sm font-black text-slate-800">
                  Sales Summary
                </h2>

                <p className="text-xs text-slate-500">
                  Payment-wise POS sales summary
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* CASH */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Banknote size={20} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-500">
                        Cash Sales
                      </p>

                      <p className="text-lg font-black text-slate-800">
                        {formatCurrency(
                          cashSales,
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                {/* CARD */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <CreditCard size={20} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-500">
                        Card Sales
                      </p>

                      <p className="text-lg font-black text-slate-800">
                        {formatCurrency(
                          cardSales,
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                {/* QR */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <QrCode size={20} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-500">
                        QR Sales
                      </p>

                      <p className="text-lg font-black text-slate-800">
                        {formatCurrency(
                          qrSales,
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                {/* REFUNDS */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <RotateCcw size={20} />
                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-500">
                        Cash Refunds
                      </p>

                      <p className="text-lg font-black text-slate-800">
                        {formatCurrency(
                          refunds,
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                CASH RECONCILIATION
            ================================================= */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* CALCULATION */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">

                  <h2 className="text-base font-black text-slate-800">
                    Cash Reconciliation
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Verify physical cash against POS transactions.
                  </p>

                </div>

                <div className="space-y-4">

                  {/* OPENING */}

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-medium text-slate-500">
                      Opening Cash
                    </span>

                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(
                        openingCash,
                      )}
                    </span>

                  </div>

                  {/* CASH SALES */}

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-medium text-slate-500">
                      Cash Sales
                    </span>

                    <span className="text-sm font-bold text-emerald-600">
                      +{" "}
                      {formatCurrency(
                        cashSales,
                      )}
                    </span>

                  </div>

                  {/* REFUNDS */}

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-medium text-slate-500">
                      Cash Refunds
                    </span>

                    <span className="text-sm font-bold text-red-600">
                      −{" "}
                      {formatCurrency(
                        refunds,
                      )}
                    </span>

                  </div>

                  {/* EXPECTED */}

                  <div className="border-t border-slate-200 pt-4">

                    <div className="flex items-center justify-between">

                      <span className="text-sm font-black text-slate-700">
                        Expected Drawer Cash
                      </span>

                      <span className="text-xl font-black text-emerald-700">
                        {formatCurrency(
                          displayedExpectedCash,
                        )}
                      </span>

                    </div>

                  </div>

                  {/* ACTUAL */}

                  <div className="flex items-center justify-between">

                    <span className="text-sm font-medium text-slate-500">
                      Actual Cash
                    </span>

                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(
                        displayedActualCash,
                      )}
                    </span>

                  </div>

                </div>

              </div>

              {/* =================================================
                  CLOSING RESULT
              ================================================= */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">

                  <h2 className="text-base font-black text-slate-800">
                    Closing Result
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Difference between expected and actual cash.
                  </p>

                </div>

                <div
                  className={`rounded-2xl border p-6 ${
                    closed
                      ? displayedHasVariance
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                      : actualCash === ""
                        ? "border-slate-200 bg-slate-50"
                        : hasVariance
                          ? "border-amber-200 bg-amber-50"
                          : "border-emerald-200 bg-emerald-50"
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Cash Variance
                      </p>

                      <p
                        className={`mt-2 text-3xl font-black ${
                          closed
                            ? displayedHasVariance
                              ? "text-amber-700"
                              : "text-emerald-700"
                            : actualCash === ""
                              ? "text-slate-400"
                              : hasVariance
                                ? "text-amber-700"
                                : "text-emerald-700"
                        }`}
                      >
                        {closed ||
                        actualCash !== ""
                          ? formatCurrency(
                              Math.abs(
                                displayedVariance,
                              ),
                            )
                          : "Rs. 0.00"}
                      </p>

                    </div>

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        closed
                          ? displayedHasVariance
                            ? "bg-amber-100 text-amber-600"
                            : "bg-emerald-100 text-emerald-600"
                          : actualCash === ""
                            ? "bg-slate-200 text-slate-500"
                            : hasVariance
                              ? "bg-amber-100 text-amber-600"
                              : "bg-emerald-100 text-emerald-600"
                      }`}
                    >

                      {closed ||
                      actualCash !== "" ? (
                        displayedHasVariance ? (
                          <AlertTriangle
                            size={22}
                          />
                        ) : (
                          <CheckCircle2
                            size={22}
                          />
                        )
                      ) : (
                        <Wallet size={22} />
                      )}

                    </div>

                  </div>

                  {(closed ||
                    actualCash !== "") && (
                    <p className="mt-3 text-xs font-medium text-slate-600">

                      {displayedVariance > 0
                        ? "Extra cash found in the drawer."
                        : displayedVariance < 0
                          ? "Cash shortage detected."
                          : "Cash is perfectly matched."}

                    </p>
                  )}

                </div>

                {/* =================================================
                    CLOSE BUTTON
                ================================================= */}

                {closed ? (

                  <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-black text-emerald-700">
                    <Lock size={18} />
                    REGISTER ALREADY CLOSED
                  </div>

                ) : (

                  <button
                    type="button"
                    onClick={
                      handleCloseRegister
                    }
                    disabled={
                      isClosing ||
                      actualCash === ""
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {isClosing ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        CLOSING REGISTER...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={18}
                        />
                        CLOSE REGISTER & RECORD CLOSING
                      </>
                    )}

                  </button>

                )}

              </div>

            </div>

            {/* =================================================
                TOTAL SALES
            ================================================= */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Total POS Sales
                  </p>

                  <p className="mt-1 text-xs text-blue-600">
                    Cash + Card + QR
                  </p>

                </div>

                <p className="text-2xl font-black text-blue-800">
                  {formatCurrency(
                    totalSales,
                  )}
                </p>

              </div>

            </div>

            {/* =================================================
                CLOSED DETAILS
            ================================================= */}

            {closed &&
              closingResult && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="mb-5">

                    <h2 className="text-base font-black text-slate-800">
                      Closing Record
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Saved cash closing information.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Business Date
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {closingResult.date ||
                          closingResult.businessDate ||
                          selectedDate}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Expected Cash
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatCurrency(
                          Number(
                            closingResult.expectedCash ??
                              expectedCash,
                          ),
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Actual Cash
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatCurrency(
                          Number(
                            closingResult.actualCash ??
                              actualCashNumber,
                          ),
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Difference
                      </p>
                      <p
                        className={`mt-1 text-sm font-black ${
                          Number(
                            closingResult.difference ??
                              variance,
                          ) === 0
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {formatCurrency(
                          Number(
                            closingResult.difference ??
                              variance,
                          ),
                        )}
                      </p>
                    </div>

                  </div>

                </div>
              )}

          </div>
        )}
      </div>
    </div>
  );
}