"use client";

interface DashboardSale {
  id: string | number;
  invoiceNumber?: string;
  customerName?: string | null;
  grandTotal: number | string;
  createdAt: string;
  status?: string;
}

interface RecentSalesProps {
  sales: DashboardSale[];
}

export default function RecentSales({
  sales,
}: RecentSalesProps) {
  const formatCurrency = (value: number | string) => {
    return `Rs. ${Number(value || 0).toLocaleString(
      "en-LK",
    )}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-LK",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
          Recent Sales
        </h2>

        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Latest bookstore transactions
        </p>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50/70">
              <th className="w-[22%] px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:w-auto sm:px-6 sm:py-4 sm:text-xs">
                Invoice
              </th>

              <th className="w-[24%] px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:w-auto sm:px-6 sm:py-4 sm:text-xs">
                Customer
              </th>

              <th className="w-[18%] px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:w-auto sm:px-6 sm:py-4 sm:text-xs">
                Date
              </th>

              <th className="w-[21%] px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:w-auto sm:px-6 sm:py-4 sm:text-xs">
                Amount
              </th>

              <th className="w-[15%] px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:w-auto sm:px-6 sm:py-4 sm:text-xs">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No recent sales found.
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const status =
                  sale.status ?? "UNKNOWN";

                const normalizedStatus =
                  status.toUpperCase();

                const isCompleted =
                  normalizedStatus === "COMPLETED";

                return (
                  <tr
                    key={sale.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    {/* Invoice */}
                    <td className="px-2 py-3 text-[11px] font-medium text-slate-700 sm:px-6 sm:py-4 sm:text-sm">
                      <span className="block break-words">
                        {sale.invoiceNumber ??
                          `#${sale.id}`}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-2 py-3 text-[11px] text-slate-600 sm:px-6 sm:py-4 sm:text-sm">
                      <span className="block break-words">
                        {sale.customerName ??
                          "Walk-in Customer"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-2 py-3 text-[10px] text-slate-500 sm:px-6 sm:py-4 sm:text-sm">
                      {formatDate(
                        sale.createdAt,
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-2 py-3 text-[11px] font-semibold text-blue-600 sm:px-6 sm:py-4 sm:text-sm">
                      <span className="block break-words">
                        {formatCurrency(
                          sale.grandTotal,
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-2 py-3 sm:px-6 sm:py-4">
                      <span
                        className={`inline-flex max-w-full rounded-full px-1.5 py-1 text-[9px] font-medium sm:px-3 sm:py-1 sm:text-xs ${
                          isCompleted
                            ? "bg-green-50 text-green-600"
                            : "bg-yellow-50 text-yellow-600"
                        }`}
                      >
                        <span className="break-words">
                          {status}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}