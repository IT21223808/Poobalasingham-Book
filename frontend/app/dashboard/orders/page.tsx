"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  RefreshCw,
  ShoppingCart,
  Monitor,
  Globe,
  Loader2,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type OrderType = "POS" | "ONLINE";
type OrderStatus =
  | "COMPLETED"
  | "CANCELLED"
  | "RETURNED"
  | "PARTIALLY_RETURNED";

interface PosSaleItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode?: string | null;
  unitPrice: number | string;
  quantity: number;
  discountAmount?: number | string;
  lineTotal: number | string;
}

interface PosPayment {
  id: string;
  paymentMethod: string;
  amount: number | string;
  amountReceived?: number | string;
  changeAmount?: number | string;
  referenceNumber?: string | null;
}

interface PosSale {
  id: string;
  invoiceNumber: string;
  subtotal: number | string;
  discountAmount: number | string;
  grandTotal: number | string;
  status: OrderStatus;

  customerId?: number | null;
  customerName?: string | null;
  cashierId?: string | null;
  notes?: string | null;
  locationId?: string | null;
  location?: {
    id: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
  } | null;

  items: PosSaleItem[];
  payments: PosPayment[];
  createdAt: string;
  updatedAt: string;
}

interface Order extends PosSale {
  type: OrderType;
  branchName: string;
}

type FilterType = "ALL" | "POS" | "ONLINE";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

function money(value: number | string | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "-",
      time: "-",
    };
  }

  return {
    date: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function getCustomerName(order: Order) {
  return order.customerName?.trim() || "Walk-in Customer";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const token = getAuthToken();

      const response = await fetch(`${API_URL}/pos/sales`, {
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

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please login again.");
        }

        throw new Error(`Failed to load orders (${response.status})`);
      }

      const data = await response.json();

      /*
       * Backend currently returns PosSale[] directly.
       * We only show COMPLETED POS sales in Orders.
       */
      const sales: PosSale[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.sales)
        ? data.sales
        : [];

      const mappedOrders: Order[] = sales
        .filter((sale) => sale.status === "COMPLETED")
        .map((sale) => ({
          ...sale,
          type: "POS",
        branchName: sale.location?.name || "Unknown Branch",
        }));

      setOrders(mappedOrders);
    } catch (err) {
      console.error("Orders fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * Initial load
   */
  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  /*
   * When user returns to Orders tab/page,
   * fetch latest POS sales.
   */
  useEffect(() => {
    const handleFocus = () => {
      fetchOrders(false);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchOrders]);

  /*
   * Listen for POS Billing page notifying that a sale
   * has been completed.
   */
  useEffect(() => {
    const handlePosSaleCompleted = () => {
      fetchOrders(false);
    };

    window.addEventListener(
      "pos-sale-completed",
      handlePosSaleCompleted
    );

    return () => {
      window.removeEventListener(
        "pos-sale-completed",
        handlePosSaleCompleted
      );
    };
  }, [fetchOrders]);

  /*
   * Search + filter
   */
  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === "ALL" ||
        order.type === activeFilter;

      if (!matchesFilter) return false;

      if (!keyword) return true;

      return (
        order.invoiceNumber?.toLowerCase().includes(keyword) ||
        getCustomerName(order)
          .toLowerCase()
          .includes(keyword) ||
        order.cashierId
          ?.toLowerCase()
          .includes(keyword) ||
        order.branchName
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [orders, activeFilter, search]);

  const filterCounts = useMemo(() => {
    return {
      all: orders.length,
      pos: orders.filter((order) => order.type === "POS").length,
      online: orders.filter((order) => order.type === "ONLINE").length,
    };
  }, [orders]);

  const toggleExpand = (id: string) => {
    setExpandedOrder((current) => (current === id ? null : id));
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=420,height=700"
    );

    if (!printWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const dateTime = formatDateTime(order.createdAt);

    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:6px 0;">
              ${escapeHtml(item.productName)}
              <br />
              <small>${escapeHtml(item.productCode || "")}</small>
            </td>
            <td style="text-align:center;padding:6px 0;">
              ${item.quantity}
            </td>
            <td style="text-align:right;padding:6px 0;">
              ${money(item.lineTotal)}
            </td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(order.invoiceNumber)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            width: 360px;
            margin: 0 auto;
            padding: 20px;
            color: #111;
          }

          h2 {
            text-align: center;
            margin: 0 0 4px;
            font-size: 20px;
          }

          .center {
            text-align: center;
          }

          .muted {
            color: #666;
            font-size: 12px;
          }

          .line {
            border-top: 1px dashed #999;
            margin: 12px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          th {
            text-align: left;
            border-bottom: 1px solid #ddd;
            padding: 6px 0;
          }

          .right {
            text-align: right;
          }

          .total {
            font-size: 17px;
            font-weight: bold;
          }

          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #666;
          }

          @media print {
            body {
              width: 100%;
            }
          }
        </style>
      </head>

      <body>
        <h2>Poobalasingham Book Depot</h2>

        <div class="center muted">
          POS SALES RECEIPT
        </div>

        <div class="line"></div>

        <div>
          <strong>Invoice:</strong>
          ${escapeHtml(order.invoiceNumber)}
        </div>

        <div>
          <strong>Date:</strong>
          ${dateTime.date}
        </div>

        <div>
          <strong>Time:</strong>
          ${dateTime.time}
        </div>

        <div>
          <strong>Customer:</strong>
          ${escapeHtml(getCustomerName(order))}
        </div>

        <div class="line"></div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Amount</th>
            </tr>
          </thead>

          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="line"></div>

        <table>
          <tr>
            <td>Subtotal</td>
            <td class="right">
              ${money(order.subtotal)}
            </td>
          </tr>

          <tr>
            <td>Discount</td>
            <td class="right">
              ${money(order.discountAmount)}
            </td>
          </tr>

          <tr>
            <td class="total">Grand Total</td>
            <td class="right total">
              ${money(order.grandTotal)}
            </td>
          </tr>
        </table>

        <div class="line"></div>

        <div>
          <strong>Payment</strong>
        </div>

        ${order.payments
          .map(
            (payment) => `
              <div style="display:flex;justify-content:space-between;margin-top:5px;">
                <span>${escapeHtml(payment.paymentMethod)}</span>
                <span>${money(payment.amount)}</span>
              </div>
            `
          )
          .join("")}

        <div class="footer">
          Thank you for your purchase!
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Orders
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and view all customer orders
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>
        </div>

        {/* SEARCH + FILTER CARD */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, customer..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterButton
                active={activeFilter === "ALL"}
                onClick={() => setActiveFilter("ALL")}
                icon={<ShoppingCart className="h-4 w-4" />}
                label="All"
                count={filterCounts.all}
              />

              <FilterButton
                active={activeFilter === "POS"}
                onClick={() => setActiveFilter("POS")}
                icon={<Monitor className="h-4 w-4" />}
                label="POS"
                count={filterCounts.pos}
              />

              <FilterButton
                active={activeFilter === "ONLINE"}
                onClick={() => setActiveFilter("ONLINE")}
                icon={<Globe className="h-4 w-4" />}
                label="Online"
                count={filterCounts.online}
              />
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-red-700">
                Unable to load orders
              </p>

              <p className="mt-0.5 text-xs text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchOrders(true)}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* TABLE HEADER */}
          <div className="hidden border-b border-gray-100 bg-gray-50 px-5 py-3 md:grid md:grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_80px] md:items-center md:gap-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Order
            </div>

            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Type
            </div>

            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Customer
            </div>

            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Date & Time
            </div>

            <div className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total
            </div>

            <div />
          </div>

          {/* LOADING */}
          {loading ? (
            <LoadingState />
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              filter={activeFilter}
              search={search}
            />
          ) : (
            <div>
              {filteredOrders.map((order) => {
                const expanded =
                  expandedOrder === order.id;

                const dateTime = formatDateTime(
                  order.createdAt
                );

                return (
                  <div
                    key={order.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    {/* ORDER ROW */}
                    <div
                      className={`px-4 py-4 transition md:px-5 ${
                        expanded
                          ? "bg-gray-50"
                          : "hover:bg-gray-50/70"
                      }`}
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_80px] md:items-center md:gap-4">
                        {/* ORDER */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <ShoppingCart className="h-4 w-4 text-gray-600" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {order.invoiceNumber}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {order.items?.length || 0}{" "}
                                {order.items?.length === 1
                                  ? "item"
                                  : "items"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* TYPE + STATUS */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            <Monitor className="h-3.5 w-3.5" />
                            POS
                          </span>

                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            {order.status}
                          </span>
                        </div>

                        {/* CUSTOMER */}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {getCustomerName(order)}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            {order.branchName}
                          </p>
                        </div>

                        {/* DATE */}
                        <div>
                          <p className="text-sm text-gray-700">
                            {dateTime.date}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            {dateTime.time}
                          </p>
                        </div>

                        {/* TOTAL */}
                        <div className="text-left md:text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            Rs. {money(order.grandTotal)}
                          </p>

                          {Number(order.discountAmount || 0) >
                            0 && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              Discount: Rs.{" "}
                              {money(order.discountAmount)}
                            </p>
                          )}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center justify-start gap-1 md:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handlePrint(order)
                            }
                            title="Print"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleExpand(order.id)
                            }
                            title={
                              expanded
                                ? "Collapse"
                                : "View details"
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            {expanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {expanded && (
                      <OrderDetails
                        order={order}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER COUNT */}
        {!loading && filteredOrders.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {filteredOrders.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {orders.length}
              </span>{" "}
              orders
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   FILTER BUTTON
------------------------------------------------------- */

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
        active
          ? "bg-gray-900 text-white"
          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon}

      <span>{label}</span>

      <span
        className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
          active
            ? "bg-white/15 text-white"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* -------------------------------------------------------
   ORDER DETAILS
------------------------------------------------------- */

function OrderDetails({
  order,
}: {
  order: Order;
}) {
  return (
    <div className="border-t border-gray-100 bg-gray-50 px-4 py-5 md:px-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* ITEMS */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Order Items
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {item.productName}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                    <span>
                      Code: {item.productCode}
                    </span>

                    {item.barcode && (
                      <span>
                        Barcode: {item.barcode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Qty
                  </p>

                  <p className="text-sm font-semibold text-gray-800">
                    {item.quantity}
                  </p>
                </div>

                <div className="w-28 text-right">
                  <p className="text-xs text-gray-400">
                    Amount
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    Rs. {money(item.lineTotal)}
                  </p>
                </div>
              </div>
            ))}

            {!order.items?.length && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No items found.
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Order Summary
            </h3>
          </div>

          <div className="space-y-3 p-4">
            <SummaryRow
              label="Subtotal"
              value={`Rs. ${money(order.subtotal)}`}
            />

            <SummaryRow
              label="Discount"
              value={`Rs. ${money(order.discountAmount)}`}
            />

            <div className="border-t border-gray-100 pt-3">
              <SummaryRow
                label="Grand Total"
                value={`Rs. ${money(order.grandTotal)}`}
                strong
              />
            </div>
          </div>

          {/* PAYMENT */}
          {order.payments?.length > 0 && (
            <div className="border-t border-gray-100 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Payment
              </p>

              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {payment.paymentMethod}
                      </p>

                      {payment.referenceNumber && (
                        <p className="text-xs text-gray-400">
                          Ref:{" "}
                          {payment.referenceNumber}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-900">
                      Rs. {money(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CASHIER */}
          <div className="border-t border-gray-100 p-4">
            <p className="text-xs text-gray-400">
              Cashier
            </p>

            <p className="mt-1 text-sm font-medium text-gray-700">
              {order.cashierId || "System"}
            </p>
          </div>

          {/* NOTES */}
          {order.notes && (
            <div className="border-t border-gray-100 p-4">
              <p className="text-xs text-gray-400">
                Notes
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SUMMARY ROW
------------------------------------------------------- */

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-sm font-semibold text-gray-900"
            : "text-sm text-gray-500"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-base font-bold text-gray-900"
            : "text-sm font-medium text-gray-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------
   LOADING
------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-gray-400" />

      <p className="mt-3 text-sm text-gray-500">
        Loading orders...
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   EMPTY
------------------------------------------------------- */

function EmptyState({
  filter,
  search,
}: {
  filter: FilterType;
  search: string;
}) {
  const isSearch = Boolean(search.trim());

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        {filter === "ONLINE" ? (
          <Globe className="h-6 w-6 text-gray-400" />
        ) : (
          <ShoppingCart className="h-6 w-6 text-gray-400" />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-800">
        {isSearch
          ? "No orders found"
          : filter === "ONLINE"
          ? "No online orders"
          : "No orders yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-400">
        {isSearch
          ? "Try a different invoice number or customer name."
          : filter === "ONLINE"
          ? "Online orders will appear here when available."
          : "Completed POS sales will automatically appear here."}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   HTML ESCAPE FOR PRINT
------------------------------------------------------- */

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}