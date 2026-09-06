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
    return `Rs. ${Number(value || 0).toLocaleString("en-LK")}`;
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
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Recent Sales
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest bookstore transactions
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/70">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invoice
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-slate-400"
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
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                  >
                    {/* Invoice */}
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {sale.invoiceNumber ??
                        `#${sale.id}`}
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {sale.customerName ??
                        "Walk-in Customer"}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(
                        sale.createdAt,
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      {formatCurrency(
                        sale.grandTotal,
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          isCompleted
                            ? "bg-green-50 text-green-600"
                            : "bg-yellow-50 text-yellow-600"
                        }`}
                      >
                        {status}
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