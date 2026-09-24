"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

interface Datum {
  name: string;
  value: number;
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-border-strong bg-surface-2 px-3 py-2 text-xs shadow-xl shadow-black/40">
      <p className="font-medium text-text-primary">{p.payload.name}</p>
      <p className="text-text-secondary">
        Count: <span className="font-medium text-text-primary">{p.value}</span>
      </p>
    </div>
  );
}

/** Horizontal bar chart for a small categorical distribution — never a pie/donut. */
export default function CategoryBarChart({
  data,
  height,
  color,
}: {
  data: Datum[];
  height?: number;
  color?: string;
}) {
  const rows = data.slice(0, 8);
  const chartHeight = height ?? Math.max(140, rows.length * 34 + 20);

  if (rows.length === 0) {
    return <p className="flex h-[140px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-muted">No data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="var(--gridline)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 12, fill: "var(--text-secondary)", fontFamily: "var(--font-manrope)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--gridline)", opacity: 0.4 }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {rows.map((_, i) => (
            <Cell key={i} fill={color ?? SERIES_COLORS[0]} fillOpacity={1 - i * 0.08} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
