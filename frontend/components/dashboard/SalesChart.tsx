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

const data = [
  { month: "Jan", sales: 42000 },
  { month: "Feb", sales: 38000 },
  { month: "Mar", sales: 52000 },
  { month: "Apr", sales: 48000 },
  { month: "May", sales: 61000 },
  { month: "Jun", sales: 57000 },
  { month: "Jul", sales: 72000 },
];

export default function SalesChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-semibold">
          Sales Overview
        </h2>

        <p className="text-sm text-slate-500">
          Monthly sales performance
        </p>

      </div>

      <ResponsiveContainer width="100%" height={320}>

        <AreaChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

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