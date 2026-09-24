"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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
      <p className="font-medium text-text-primary">{p.name}</p>
      <p className="text-text-secondary">
        {p.value} <span className="text-text-muted">({Math.round((p.percent ?? 0) * 100)}%)</span>
      </p>
    </div>
  );
}

/** Donut with a centered total label — a proportion view to sit alongside
 *  the category bar charts, not a replacement for them. */
export default function DonutChart({ data, height = 220 }: { data: Datum[]; height?: number }) {
  const rows = data.filter((d) => d.value > 0).slice(0, 8);
  const total = rows.reduce((acc, d) => acc + d.value, 0);

  if (rows.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-muted">
        No data yet
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
            isAnimationActive
            animationDuration={700}
          >
            {rows.map((_, i) => (
              <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold tabular-nums text-text-primary">{total}</p>
        <p className="eyebrow">total</p>
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {rows.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
