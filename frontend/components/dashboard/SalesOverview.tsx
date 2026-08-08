export default function SalesOverview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Sales Overview
        </h2>
        <p className="text-sm text-slate-500">
          Monthly sales performance
        </p>
      </div>

      <div className="flex h-80 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
        <p className="text-slate-400">
          Sales Chart (Coming Soon)
        </p>
      </div>
    </div>
  );
}