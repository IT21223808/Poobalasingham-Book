"use client";

import { BarChart3, CalendarDays, FileSpreadsheet, FileText, Loader2, RefreshCw, Search, } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* TYPES */

type ReportKey =
  | "daily-sales"
  | "monthly-sales"
  | "annual-sales"
  | "category-wise-sales"
  | "product-wise-sales"
  | "profit-analysis"
  | "best-selling"
  | "slow-moving"
  | "dead-stock"
  | "inventory"
  | "suppliers"
  | "customers"
  | "purchases"
  | "expenses"
  | "profit-loss"
  | "balance-sheet"
  | "cash-flow";

interface ReportConfig {
  key: ReportKey;
  label: string;
  endpoint: string;
  csvEndpoint: string;
  pdfEndpoint: string;
}

/* REPORT CONFIGURATION */

const REPORT_CONFIGS: ReportConfig[] = [
  {
    key: "daily-sales",
    label: "Daily Sales",
    endpoint: "/reports/sales/daily",
    csvEndpoint: "/reports/sales/daily/export/csv",
    pdfEndpoint: "/reports/sales/daily/export/pdf",
  },
  {
    key: "monthly-sales",
    label: "Monthly Sales",
    endpoint: "/reports/sales/monthly",
    csvEndpoint: "/reports/sales/monthly/export/csv",
    pdfEndpoint: "/reports/sales/monthly/export/pdf",
  },
  {
    key: "annual-sales",
    label: "Annual Sales",
    endpoint: "/reports/sales/annual",
    csvEndpoint: "/reports/sales/annual/export/csv",
    pdfEndpoint: "/reports/sales/annual/export/pdf",
  },
  {
    key: "category-wise-sales",
    label: "Category-wise Sales",
    endpoint: "/reports/sales/category-wise",
    csvEndpoint: "/reports/sales/category-wise/export/csv",
    pdfEndpoint: "/reports/sales/category-wise/export/pdf",
  },
  {
    key: "product-wise-sales",
    label: "Product-wise Sales",
    endpoint: "/reports/sales/product-wise",
    csvEndpoint: "/reports/sales/product-wise/export/csv",
    pdfEndpoint: "/reports/sales/product-wise/export/pdf",
  },
  {
    key: "profit-analysis",
    label: "Profit Analysis",
    endpoint: "/reports/sales/profit-analysis",
    csvEndpoint: "/reports/sales/profit-analysis/export/csv",
    pdfEndpoint: "/reports/sales/profit-analysis/export/pdf",
  },
  {
    key: "best-selling",
    label: "Best-selling Products",
    endpoint: "/reports/sales/best-selling",
    csvEndpoint: "/reports/sales/best-selling/export/csv",
    pdfEndpoint: "/reports/sales/best-selling/export/pdf",
  },
  {
    key: "slow-moving",
    label: "Slow-moving Products",
    endpoint: "/reports/inventory/slow-moving",
    csvEndpoint: "/reports/inventory/slow-moving/export/csv",
    pdfEndpoint: "/reports/inventory/slow-moving/export/pdf",
  },
  {
    key: "dead-stock",
    label: "Dead Stock",
    endpoint: "/reports/inventory/dead-stock",
    csvEndpoint: "/reports/inventory/dead-stock/export/csv",
    pdfEndpoint: "/reports/inventory/dead-stock/export/pdf",
  },
  {
    key: "inventory",
    label: "Inventory Report",
    endpoint: "/reports/inventory/stock",
    csvEndpoint: "/reports/inventory/stock/export/csv",
    pdfEndpoint: "/reports/inventory/stock/export/pdf",
  },
  {
    key: "suppliers",
    label: "Supplier Report",
    endpoint: "/reports/suppliers",
    csvEndpoint: "/reports/suppliers/export/csv",
    pdfEndpoint: "/reports/suppliers/export/pdf",
  },
  {
    key: "customers",
    label: "Customer Report",
    endpoint: "/reports/customers",
    csvEndpoint: "/reports/customers/export/csv",
    pdfEndpoint: "/reports/customers/export/pdf",
  },
  {
    key: "purchases",
    label: "Purchase Report",
    endpoint: "/reports/purchases",
    csvEndpoint: "/reports/purchases/export/csv",
    pdfEndpoint: "/reports/purchases/export/pdf",
  },
  {
    key: "expenses",
    label: "Expense Report",
    endpoint: "/reports/expenses",
    csvEndpoint: "/reports/expenses/export/csv",
    pdfEndpoint: "/reports/expenses/export/pdf",
  },
  {
    key: "profit-loss",
    label: "Profit & Loss",
    endpoint: "/finance/profit-loss",
    csvEndpoint: "/reports/finance/profit-loss/export/csv",
    pdfEndpoint: "/reports/finance/profit-loss/export/pdf",
  },
  {
    key: "balance-sheet",
    label: "Balance Sheet",
    endpoint: "/finance/balance-sheet",
    csvEndpoint: "/reports/finance/balance-sheet/export/csv",
    pdfEndpoint: "/reports/finance/balance-sheet/export/pdf",
  },
  {
    key: "cash-flow",
    label: "Cash Flow",
    endpoint: "/finance/cash-flow",
    csvEndpoint: "/reports/finance/cash-flow/export/csv",
    pdfEndpoint: "/reports/finance/cash-flow/export/pdf",
  },
];

/* HELPERS */

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}

function getHeaders(): HeadersInit {
  const token = getToken();

  console.log(
    "[Reports] Access token exists:",
    !!token,
  );

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultEndDate(): string {
  return formatDateInput(new Date());
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  return formatDateInput(date);
}

function formatHeader(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isDateKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("date") ||
    normalized.includes("createdat") ||
    normalized.includes("updatedat")
  );
}

function isMoneyKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return (
    normalized.includes("amount") ||
    normalized.includes("revenue") ||
    normalized.includes("profit") ||
    normalized.includes("sales") ||
    normalized.includes("price") ||
    normalized.includes("cost") ||
    normalized.includes("balance") ||
    normalized.includes("expense") ||
    normalized.includes("payment") ||
    normalized.includes("total")
  );
}

function getErrorMessage(
  error: any,
  fallback: string,
): string {
  if (!error) {
    return fallback;
  }

  // Simple string
  if (typeof error === "string") {
    return error;
  }

  // NestJS message can be an array
  if (Array.isArray(error.message)) {
    return error.message
      .map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.message) {
          return String(item.message);
        }

        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .join(", ");
  }

  // NestJS message can be an object
  if (
    error.message &&
    typeof error.message === "object"
  ) {
    try {
      return (
        error.message.message ||
        error.message.error ||
        JSON.stringify(error.message)
      );
    } catch {
      return fallback;
    }
  }

  if (error.message) {
    return String(error.message);
  }

  if (error.error) {
    if (typeof error.error === "string") {
      return error.error;
    }

    try {
      return JSON.stringify(error.error);
    } catch {
      return fallback;
    }
  }

  try {
    const stringified = JSON.stringify(error);

    if (
      stringified &&
      stringified !== "{}"
    ) {
      return stringified;
    }
  } catch {
    // Ignore stringify errors
  }

  return fallback;
}


function formatCellValue(
  value: unknown,
  key: string,
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (isDateKey(key)) {
    const date = new Date(String(value));

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB");
    }
  }

  if (
    typeof value === "number" &&
    isMoneyKey(key)
  ) {
    return `Rs. ${value.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (
    typeof value === "number"
  ) {
    return value.toLocaleString("en-LK");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getRootData(data: any): any {
  if (!data) {
    return {};
  }

  if (data.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
}

function extractRecords(data: any): Record<string, any>[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.records)) {
    return data.records;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (
    data.data &&
    typeof data.data === "object"
  ) {
    if (Array.isArray(data.data.records)) {
      return data.data.records;
    }

    if (Array.isArray(data.data.items)) {
      return data.data.items;
    }

    if (Array.isArray(data.data.results)) {
      return data.data.results;
    }
  }

  return [];
}

function extractColumns(
  records: Record<string, any>[],
): string[] {
  if (!records.length) {
    return [];
  }

  const columnSet = new Set<string>();

  records.forEach((record) => {
    Object.keys(record).forEach((key) => {
      columnSet.add(key);
    });
  });

  return Array.from(columnSet);
}

function extractSummary(data: any): Record<
  string,
  unknown
> {
  if (!data) {
    return {};
  }

  if (
    data.summary &&
    typeof data.summary === "object"
  ) {
    return data.summary;
  }

  if (
    data.data?.summary &&
    typeof data.data.summary === "object"
  ) {
    return data.data.summary;
  }

  return {};
}

function buildQuery(
  reportKey: ReportKey,
  startDate: string,
  endDate: string,
): string {
  const params = new URLSearchParams();

  if (reportKey === "daily-sales") {
    params.set("date", endDate);
  } else if (reportKey === "monthly-sales") {
    const date = new Date(
      `${endDate}T00:00:00`,
    );

    params.set(
      "year",
      String(date.getFullYear()),
    );

    params.set(
      "month",
      String(date.getMonth() + 1),
    );
  } else if (reportKey === "annual-sales") {
    const date = new Date(
      `${endDate}T00:00:00`,
    );

    params.set(
      "year",
      String(date.getFullYear()),
    );
  } else if (reportKey === "balance-sheet") {
    params.set("asOfDate", endDate);
  } else if (reportKey === "inventory") {
    // Inventory report does not require date parameters.
  } else {
    params.set("startDate", startDate);
    params.set("endDate", endDate);
  }

  return params.toString();
}

/* =========================================================
   PAGE
========================================================= */

export default function ReportsPage() {
  const [activeReport, setActiveReport] =
    useState<ReportKey>("daily-sales");

  const [startDate, setStartDate] =
    useState(getDefaultStartDate());

  const [endDate, setEndDate] =
    useState(getDefaultEndDate());

  const [searchTerm, setSearchTerm] =
    useState("");

  const [reportData, setReportData] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [exporting, setExporting] =
    useState<"csv" | "pdf" | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const currentConfig = useMemo(
    () =>
      REPORT_CONFIGS.find(
        (report) =>
          report.key === activeReport,
      )!,
    [activeReport],
  );

  /*  FETCH REPORT */
const fetchReport = useCallback(
  async () => {
    setLoading(true);
    setError(null);

    try {
      const query = buildQuery(
        activeReport,
        startDate,
        endDate,
      );

      const url =
        `${API_URL}${currentConfig.endpoint}` +
        (query ? `?${query}` : "");

      console.log(
        `[Reports] Loading: ${currentConfig.label}`,
      );
      console.log(
        `[Reports] URL: ${url}`,
      );

      const token = getToken();

console.log("[Reports] Has token:", !!token);
console.log(
  "[Reports] Token preview:",
  token ? `${token.substring(0, 15)}...` : "NO TOKEN",
);

      const response = await fetch(url, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  },
  cache: "no-store",
});

      const contentType =
        response.headers.get(
          "content-type",
        ) || "";

      let result: any = null;

      if (
        contentType.includes(
          "application/json",
        )
      ) {
        result = await response.json();
      } else {
        const text =
          await response.text();

        try {
          result = JSON.parse(text);
        } catch {
          result = {
            message: text,
          };
        }
      }

      console.log(
        `[Reports] ${currentConfig.label} response:`,
        result,
      );

      if (!response.ok) {
        const message = getErrorMessage(
          result,
          `Failed to load ${currentConfig.label}`,
        );

        throw new Error(message);
      }

      setReportData(result);
    } catch (err: any) {
      console.error(
        `[Reports] ${currentConfig.label} error:`,
        err,
      );

      setReportData(null);

      setError(
        getErrorMessage(
          err,
          `Unable to load ${currentConfig.label}`,
        ),
      );
    } finally {
      setLoading(false);
    }
  },
  [
    activeReport,
    currentConfig.endpoint,
    currentConfig.label,
    endDate,
    startDate,
  ],
);

  /* LOAD REPORT*/
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /*  RECORDS */

  const allRecords = useMemo(
    () => extractRecords(reportData),
    [reportData],
  );

  const records = useMemo(() => {
    if (!searchTerm.trim()) {
      return allRecords;
    }

    const term =
      searchTerm
        .trim()
        .toLowerCase();

    return allRecords.filter(
      (record) =>
        Object.values(record)
          .map((value) =>
            String(value ?? "")
              .toLowerCase(),
          )
          .join(" ")
          .includes(term),
    );
  }, [allRecords, searchTerm]);

  const columns = useMemo(
    () => extractColumns(records),
    [records],
  );

  const summary = useMemo(
    () => extractSummary(reportData),
    [reportData],
  );

  const summaryEntries = useMemo(
    () =>
      Object.entries(summary).filter(
        ([, value]) =>
          value !== null &&
          value !== undefined &&
          typeof value !== "object",
      ),
    [summary],
  );

  /* EXPORT*/

  const handleExport = async (
    format: "csv" | "pdf",
  ) => {
    setExporting(format);
    setError(null);

    try {
      const endpoint =
        format === "csv"
          ? currentConfig.csvEndpoint
          : currentConfig.pdfEndpoint;

      const query = buildQuery(
        activeReport,
        startDate,
        endDate,
      );

      const url =
        `${API_URL}${endpoint}` +
        (query ? `?${query}` : "");

      const token = getToken();

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
          Accept:
            format === "csv"
              ? "text/csv"
              : "application/pdf",
        },
      });

      if (!response.ok) {
        let message =
          `Failed to export ${format.toUpperCase()}`;

        try {
          const data =
            await response.json();

          message =
            data?.message || message;
        } catch {
          // Ignore non-json error response.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const objectUrl =
        window.URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = objectUrl;

      const safeName =
        currentConfig.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      anchor.download =
        `${safeName}-${endDate}.${format}`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(
        objectUrl,
      );
    } catch (err: any) {
      console.error(
        "Export error:",
        err,
      );

      setError(
        err?.message ||
          `Unable to export ${format.toUpperCase()}`,
      );
    } finally {
      setExporting(null);
    }
  };

  /* REPORT TAB */

  const renderReportTab = (
    report: ReportConfig,
  ) => {
    const active =
      activeReport === report.key;

    return (
      <button
        key={report.key}
        type="button"
        onClick={() => {
          setActiveReport(report.key);
          setSearchTerm("");
          setError(null);
        }}
        className={[
          "whitespace-nowrap rounded-lg",
          "px-4 py-2.5 text-sm font-medium",
          "transition-all duration-150",
          "border",
          active
            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
        ].join(" ")}
      >
        {report.label}
      </button>
    );
  };

  /* RENDER*/

  return (
    <div className="min-h-screen bg-slate-50">
      {/* PAGE HEADER*/}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <BarChart3 className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Reports
                  </h1>

                  <p className="mt-0.5 text-sm text-slate-500">
                    View and export business reports
                  </p>
                </div>
              </div>
            </div>

            {/* EXPORT BUTTONS */}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleExport("csv")
                }
                disabled={
                  loading ||
                  exporting !== null
                }
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting === "csv" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}

                Export CSV
              </button>

              <button
                type="button"
                onClick={() =>
                  handleExport("pdf")
                }
                disabled={
                  loading ||
                  exporting !== null
                }
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting === "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}

                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REPORT TABS */}

      <div className="border-b border-slate-200 bg-white">
        <div className="px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {REPORT_CONFIGS.map(
              renderReportTab,
            )}
          </div>
        </div>
      </div>

      {/*FILTER BAR */}

      <div className="px-6 pt-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            {/* DATE FILTERS */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value,
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(
                        event.target.value,
                      )
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                Refresh
              </button>
            </div>

            {/* SEARCH */}

            <div className="w-full xl:max-w-sm">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search Report
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                  placeholder={`Search ${currentConfig.label.toLowerCase()}...`}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="px-6 pb-8 pt-5">
        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* REPORT TITLE */}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {currentConfig.label}
            </h2>

            <p className="text-sm text-slate-500">
              {records.length.toLocaleString()}{" "}
              record
              {records.length === 1
                ? ""
                : "s"}
              {searchTerm
                ? " matching your search"
                : ""}
            </p>
          </div>

          {reportData?.period && (
            <div className="text-sm text-slate-500">
              {reportData.period.startDate &&
                reportData.period.endDate && (
                  <>
                    {reportData.period.startDate}
                    {" — "}
                    {reportData.period.endDate}
                  </>
                )}
            </div>
          )}
        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        {summaryEntries.length > 0 && (
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryEntries
              .slice(0, 4)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatHeader(key)}
                  </p>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCellValue(
                      value,
                      key,
                    )}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

                <p className="text-sm font-medium">
                  Loading report...
                </p>
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <BarChart3 className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="text-base font-semibold text-slate-800">
                No records found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                There is no data available for
                the selected report and date
                range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {columns.map(
                      (column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600"
                        >
                          {formatHeader(
                            column,
                          )}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {records.map(
                    (
                      record,
                      rowIndex,
                    ) => (
                      <tr
                        key={`${activeReport}-${rowIndex}`}
                        className="transition hover:bg-slate-50"
                      >
                        {columns.map(
                          (column) => (
                            <td
                              key={`${rowIndex}-${column}`}
                              className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                            >
                              {formatCellValue(
                                record[
                                  column
                                ],
                                column,
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/*  TABLE FOOTER*/}

        {!loading &&
          records.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {records.length.toLocaleString()}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {allRecords.length.toLocaleString()}
                </span>{" "}
                records
              </span>

              <span>
                Report:{" "}
                <span className="font-semibold text-slate-700">
                  {currentConfig.label}
                </span>
              </span>
            </div>
          )}
      </div>
    </div>
  );
}
