import { Eye } from "lucide-react";

const sales = [
  {
    id: "INV-1001",
    customer: "Kamal Perera",
    book: "The Psychology of Money",
    amount: "Rs. 4,250",
    status: "Completed",
  },
  {
    id: "INV-1002",
    customer: "Nimal Silva",
    book: "Atomic Habits",
    amount: "Rs. 3,100",
    status: "Completed",
  },
  {
    id: "INV-1003",
    customer: "John David",
    book: "Rich Dad Poor Dad",
    amount: "Rs. 2,950",
    status: "Pending",
  },
  {
    id: "INV-1004",
    customer: "Ayesha Fernando",
    book: "Deep Work",
    amount: "Rs. 5,600",
    status: "Completed",
  },
];

export default function RecentSales() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b p-6">
        <div>
          <h2 className="text-xl font-semibold">
            Recent Sales
          </h2>
          <p className="text-sm text-slate-500">
            Latest bookstore transactions
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm">
                Invoice
              </th>
              <th className="px-6 py-4 text-left text-sm">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-sm">
                Book
              </th>
              <th className="px-6 py-4 text-left text-sm">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm">
                Status
              </th>
              <th className="px-6 py-4 text-center text-sm">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-medium">
                  {sale.id}
                </td>
                <td className="px-6 py-4">
                  {sale.customer}
                </td>
                <td className="px-6 py-4">
                  {sale.book}
                </td>
                <td className="px-6 py-4 font-semibold text-blue-600">
                  {sale.amount}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      sale.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {sale.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="rounded-lg p-2 hover:bg-slate-100">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}