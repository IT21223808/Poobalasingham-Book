"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SalesChartItem {
  date: string;
  sales: number;
}

interface SalesChartProps {
  data: SalesChartItem[];
}

export default function SalesChart({
  data,
}: SalesChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString(
      "en-LK",
      {
        day: "2-digit",
        month: "short",
      },
    ),
    sales: Number(item.sales || 0),
  }));

  const formatCurrency = (value: number) => {
    return `Rs. ${value.toLocaleString("en-LK")}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Sales Overview
        </h2>

        <p className="text-sm text-slate-500">
          Last 7 days sales performance
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis
            tickFormatter={(value) =>
              `Rs. ${Number(value).toLocaleString("en-LK")}`
            }
          />

          <Tooltip
            formatter={(value) =>
              formatCurrency(Number(value || 0))
            }
          />

          <Area
            type="monotone"
            dataKey="sales"
            stroke="#2563EB"
            fill="#93C5FD"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}