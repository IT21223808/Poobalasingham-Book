import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 sm:text-sm">
            {title}
          </p>

          <h2 className="mt-2 break-words text-xl font-bold text-slate-800 sm:text-3xl">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}