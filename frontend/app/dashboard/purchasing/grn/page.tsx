"use client";

import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  purchasingService,
  GRN,
} from "@/services/purchasing.service";

export default function GRNPage() {
  // =========================================================
  // STATE
  // =========================================================

  const [grns, setGrns] = useState<GRN[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [deleting, setDeleting] =
    useState<number | null>(null);

  const [cancelling, setCancelling] =
    useState<number | null>(null);

  const itemsPerPage = 10;

  // =========================================================
  // LOAD GRNs
  // =========================================================

  const loadGRNs = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const data =
          await purchasingService.getGRNs();

        setGrns(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err: any) {
        console.error(
          "Failed to load GRNs:",
          err
        );

        const message =
          err?.response?.data?.message;

        setError(
          Array.isArray(message)
            ? message.join(", ")
            : message ||
                "Failed to load goods received notes"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadGRNs();
  }, [loadGRNs]);

  // =========================================================
  // FILTER GRNs
  // =========================================================

  const filteredGRNs = useMemo(() => {
    return grns.filter((grn) => {
      const normalizedStatus =
        grn.status?.toUpperCase();

      // -------------------------------------------------------
      // SEARCH
      // -------------------------------------------------------

      const matchesSearch =
        !search ||
        grn.grnNumber
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      // -------------------------------------------------------
      // STATUS
      // -------------------------------------------------------

      const matchesStatus =
        status === "ALL" ||
        normalizedStatus === status;

      // -------------------------------------------------------
      // DATE
      // -------------------------------------------------------

      const dateValue =
        grn.createdAt;

      const parsedDate =
        new Date(dateValue);

      const grnDate =
        Number.isNaN(
          parsedDate.getTime()
        )
          ? ""
          : parsedDate
              .toISOString()
              .split("T")[0];

      const matchesFromDate =
        !fromDate ||
        grnDate >= fromDate;

      const matchesToDate =
        !toDate ||
        grnDate <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    grns,
    search,
    status,
    fromDate,
    toDate,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredGRNs.length /
        itemsPerPage
    )
  );

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );

  const paginatedGRNs =
    filteredGRNs.slice(
      (safeCurrentPage - 1) *
        itemsPerPage,
      safeCurrentPage *
        itemsPerPage
    );

  // =========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    status,
    fromDate,
    toDate,
  ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalGRNs =
    grns.length;

  const partialGRNs =
    grns.filter(
      (grn) =>
        grn.status?.toUpperCase() ===
        "PARTIAL"
    ).length;

  const receivedGRNs =
    grns.filter(
      (grn) =>
        grn.status?.toUpperCase() ===
        "RECEIVED"
    ).length;

  const cancelledGRNs =
    grns.filter(
      (grn) =>
        grn.status?.toUpperCase() ===
        "CANCELLED"
    ).length;

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  // =========================================================
  // CANCEL GRN
  // =========================================================

  const handleCancel = async (
    grn: GRN
  ) => {
    const normalizedStatus =
      grn.status?.toUpperCase();

    if (
      normalizedStatus ===
      "CANCELLED"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to cancel ${grn.grnNumber}?\n\nThis GRN will be marked as CANCELLED and the received stock will be reversed.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(grn.id);
      setError(null);

      await purchasingService.cancelGrn(
        grn.id
      );

      setGrns((previous) =>
        previous.map((item) =>
          item.id === grn.id
            ? {
                ...item,
                status:
                  "CANCELLED",
              }
            : item
        )
      );

      alert(
        `${grn.grnNumber} cancelled successfully.`
      );
    } catch (err: any) {
      console.error(
        "Failed to cancel GRN:",
        err
      );

      const message =
        err?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join(", ")
          : message ||
              "Failed to cancel GRN"
      );
    } finally {
      setCancelling(null);
    }
  };

  // =========================================================
  // DELETE GRN
  // =========================================================

  const handleDelete = async (
    grn: GRN
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${grn.grnNumber}?\n\nThis action cannot be undone and received stock will be reversed.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(grn.id);
      setError(null);

      await purchasingService.deleteGRN(
        grn.id
      );

      setGrns((previous) =>
        previous.filter(
          (item) =>
            item.id !== grn.id
        )
      );

      alert(
        `${grn.grnNumber} deleted successfully.`
      );
    } catch (err: any) {
      console.error(
        "Failed to delete GRN:",
        err
      );

      const message =
        err?.response?.data?.message;

      alert(
        Array.isArray(message)
          ? message.join(", ")
          : message ||
              "Failed to delete GRN"
      );
    } finally {
      setDeleting(null);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading goods received...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <XCircle
            size={40}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 font-semibold text-gray-900">
            Failed to load goods received
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadGRNs()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            {/* BREADCRUMB */}

            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard/purchasing"
                className="text-gray-500 hover:text-blue-600"
              >
                Purchasing
              </Link>

              <span className="text-gray-300">
                /
              </span>

              <span className="font-medium text-gray-900">
                Goods Received
              </span>
            </div>

            {/* TITLE */}

            <div className="mt-3 flex items-center gap-3">

              <div className="rounded-lg bg-blue-50 p-2.5">
                <PackageCheck
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Goods Received
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage goods received from purchase orders.
                </p>
              </div>

            </div>

          </div>

          {/* HEADER ACTIONS */}

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                loadGRNs(true)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {/* ONLY CREATE GRN BUTTON */}

            <Link
              href="/dashboard/purchasing/grn/create"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Create GRN
            </Link>

          </div>

        </div>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total GRNs"
            value={totalGRNs}
            icon={PackageCheck}
            iconClass="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Partial"
            value={partialGRNs}
            icon={Clock3}
            iconClass="bg-yellow-50 text-yellow-600"
          />

          <SummaryCard
            title="Received"
            value={receivedGRNs}
            icon={CheckCircle2}
            iconClass="bg-green-50 text-green-600"
          />

          <SummaryCard
            title="Cancelled"
            value={cancelledGRNs}
            icon={XCircle}
            iconClass="bg-red-50 text-red-600"
          />

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* SEARCH */}

            <div className="lg:col-span-1">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search GRN Number
              </label>

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search GRN number..."
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* STATUS */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="ALL">
                  All Status
                </option>

                <option value="PARTIAL">
                  Partial
                </option>

                <option value="RECEIVED">
                  Received
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>

              </select>

            </div>

            {/* FROM DATE */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                From Date
              </label>

              <div className="relative">

                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* TO DATE */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                To Date
              </label>

              <div className="relative">

                <CalendarDays
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

          </div>

          {/* FILTER FOOTER */}

          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-500">

              Showing{" "}

              <span className="font-medium text-gray-900">
                {filteredGRNs.length}
              </span>{" "}

              result
              {filteredGRNs.length !==
              1
                ? "s"
                : ""}

            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Clear Filters
            </button>

          </div>

        </div>

        {/* =================================================
            GRN TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

          {/* TABLE HEADER */}

          <div className="border-b border-gray-100 px-6 py-4">

            <div>
              <h2 className="font-semibold text-gray-900">
                Goods Received Notes
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View and manage goods received against purchase orders.
              </p>
            </div>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    GRN Number
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Purchase Order
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Items
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Total Received
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Status
                  </th>

                  <th className="px-6 py-3 font-medium text-gray-600">
                    Date
                  </th>

                  <th className="px-6 py-3 text-right font-medium text-gray-600">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {paginatedGRNs.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="px-6 py-14 text-center"
                    >

                      <PackageCheck
                        size={40}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 font-medium text-gray-700">
                        No goods received found
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        Try changing your filters or create a new GRN.
                      </p>

                    </td>

                  </tr>

                ) : (

                  paginatedGRNs.map(
                    (grn) => {

                      const itemCount =
                        grn.items?.length ||
                        0;

                      const totalReceived =
                        grn.items?.reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            Number(
                              item.receivedQuantity ||
                                0
                            ),
                          0
                        ) || 0;

                      const normalizedStatus =
                        grn.status?.toUpperCase();

                      const isCancelled =
                        normalizedStatus ===
                        "CANCELLED";

                      return (

                        <tr
                          key={grn.id}
                          className="transition hover:bg-gray-50"
                        >

                          {/* GRN NUMBER */}

                          <td className="px-6 py-4">

                            <Link
                              href={`/dashboard/purchasing/grn/${grn.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                              {
                                grn.grnNumber
                              }
                            </Link>

                            <p className="mt-1 text-xs text-gray-400">
                              ID #{grn.id}
                            </p>

                          </td>

                          {/* PURCHASE ORDER */}

                          <td className="px-6 py-4">

                            <Link
                              href={`/dashboard/purchasing/orders/${grn.purchaseOrderId}`}
                              className="font-medium text-blue-600 hover:underline"
                            >

                              PO-

                              {String(
                                grn.purchaseOrderId
                              ).padStart(
                                5,
                                "0"
                              )}

                            </Link>

                          </td>

                          {/* ITEMS */}

                          <td className="px-6 py-4">

                            <p className="font-medium text-gray-900">

                              {itemCount}{" "}

                              {itemCount ===
                              1
                                ? "item"
                                : "items"}

                            </p>

                          </td>

                          {/* RECEIVED */}

                          <td className="px-6 py-4">

                            <p className="font-semibold text-gray-900">
                              {
                                totalReceived
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              units received
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4">

                            <StatusBadge
                              status={
                                normalizedStatus
                              }
                            />

                          </td>

                          {/* DATE */}

                          <td className="px-6 py-4 text-gray-500">

                            {formatDate(
                              grn.createdAt
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-4">

                            <div className="flex items-center justify-end gap-1">

                              {/* VIEW */}

                              <Link
                                href={`/dashboard/purchasing/grn/${grn.id}`}
                                title="View GRN"
                                className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye
                                  size={17}
                                />
                              </Link>

                              {/* EDIT */}

                              <Link
                                href={`/dashboard/purchasing/grn/${grn.id}/edit`}
                                title="Edit GRN"
                                className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${
                                  isCancelled
                                    ? "pointer-events-none opacity-40"
                                    : ""
                                }`}
                              >
                                <Pencil
                                  size={17}
                                />
                              </Link>

                              {/* CANCEL */}

                              {!isCancelled && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancel(
                                      grn
                                    )
                                  }
                                  disabled={
                                    cancelling ===
                                    grn.id
                                  }
                                  title="Cancel GRN"
                                  className="rounded-lg p-2 text-gray-500 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >

                                  {cancelling ===
                                  grn.id ? (

                                    <RefreshCw
                                      size={17}
                                      className="animate-spin"
                                    />

                                  ) : (

                                    <XCircle
                                      size={17}
                                    />

                                  )}

                                </button>

                              )}

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    grn
                                  )
                                }
                                disabled={
                                  deleting ===
                                  grn.id
                                }
                                title="Delete GRN"
                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >

                                {deleting ===
                                grn.id ? (

                                  <RefreshCw
                                    size={17}
                                    className="animate-spin"
                                  />

                                ) : (

                                  <Trash2
                                    size={17}
                                  />

                                )}

                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          {filteredGRNs.length >
            0 && (

            <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-gray-500">

                Page{" "}

                <span className="font-medium text-gray-900">
                  {safeCurrentPage}
                </span>{" "}

                of{" "}

                <span className="font-medium text-gray-900">
                  {totalPages}
                </span>

              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={
                    safeCurrentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  <ChevronLeft
                    size={16}
                  />

                  Previous

                </button>

                <button
                  type="button"
                  disabled={
                    safeCurrentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Next

                  <ChevronRight
                    size={16}
                  />

                </button>

              </div>

            </div>

          )}

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {value}
          </p>

        </div>

        <div
          className={`rounded-lg p-2.5 ${iconClass}`}
        >
          <Icon size={20} />
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    PARTIAL:
      "bg-yellow-50 text-yellow-700 border-yellow-200",

    RECEIVED:
      "bg-green-50 text-green-700 border-green-200",

    CANCELLED:
      "bg-red-50 text-red-700 border-red-200",
  };

  const labels: Record<
    string,
    string
  > = {
    PARTIAL: "Partial",

    RECEIVED: "Received",

    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ||
        "border-gray-200 bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] ||
        status ||
        "Unknown"}
    </span>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  date: string
) {
  if (!date) {
    return "—";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "—";
  }

  return parsedDate.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}