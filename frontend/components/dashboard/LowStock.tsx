import { AlertTriangle } from "lucide-react";

const books = [
  {
    id: 1,
    title: "Atomic Habits",
    stock: 3,
  },
  {
    id: 2,
    title: "Deep Work",
    stock: 5,
  },
  {
    id: 3,
    title: "The Psychology of Money",
    stock: 2,
  },
  {
    id: 4,
    title: "Clean Code",
    stock: 4,
  },
];

export default function LowStock() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b p-6">

        <div>

          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <AlertTriangle className="text-amber-500" size={22} />

            Low Stock Books
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Books that require restocking.
          </p>

        </div>

      </div>

      <div className="divide-y">

        {books.map((book) => (

          <div
            key={book.id}
            className="flex items-center justify-between p-5 hover:bg-slate-50"
          >

            <div>

              <h3 className="font-semibold text-slate-800">
                {book.title}
              </h3>

              <p className="text-sm text-slate-500">
                Book ID : #{book.id}
              </p>

            </div>

            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">
              {book.stock} Left
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}