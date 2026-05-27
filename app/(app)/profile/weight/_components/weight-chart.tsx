"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function WeightChart({
  data,
}: {
  data: Array<{ date: string; weight: number }>;
}) {
  if (data.length === 0) return null;

  const weights = data.map((d) => d.weight);
  const padding = 1.5;
  const yMin = Math.floor(Math.min(...weights) - padding);
  const yMax = Math.ceil(Math.max(...weights) + padding);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ECE6F8" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#A6A6B8" }}
            interval="preserveStartEnd"
            stroke="#ECE6F8"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: "#A6A6B8" }}
            stroke="#ECE6F8"
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #ECE6F8",
              fontSize: 12,
            }}
            formatter={(v) => [`${Number(v).toFixed(1)}kg`, "몸무게"]}
            labelStyle={{ color: "#6B6B85", fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#B6A3EE"
            strokeWidth={2.5}
            dot={{ fill: "#B6A3EE", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
