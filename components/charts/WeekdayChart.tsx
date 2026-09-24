"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Datum {
  name: string;
  value: number;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-strong bg-surface-2 px-3 py-2 text-xs shadow-xl shadow-black/40">
      <p className="font-medium text-text-primary">{label}</p>
      <p className="text-text-secondary">
        Sessions: <span className="font-medium text-text-primary">{payload[0].value}</span>
      </p>
    </div>
  );
}

/** Mon-Sun activity pattern — cheap to compute, gives a genuinely new
 *  "when do people actually use this" read that a daily time series can't. */
export default function WeekdayChart({ data, height = 200 }: { data: Datum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="var(--gridline)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--gridline)", opacity: 0.4 }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive animationDuration={600}>
          {data.map((d, i) => (
            <Cell key={i} fill="var(--series-1)" fillOpacity={0.35 + 0.65 * (d.value / max)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
