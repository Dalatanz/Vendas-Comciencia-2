"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FunnelChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" />
          <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#12181f", border: "1px solid #ffffff22", borderRadius: 8 }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend />
          <Bar dataKey="value" name="Leads" fill="#39ff14" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
