"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  key: string;
  label: string;
  count: number;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-strong bg-surface-2 px-3 py-2 text-xs shadow-xl shadow-black/40">
      <p className="mb-1 font-medium text-text-primary">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-text-secondary">
          {p.name}: <span className="font-medium text-text-primary">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function TimeSeriesChart({
  data,
  seriesName,
  color = "var(--series-1)",
  height = 220,
}: {
  data: Point[];
  seriesName: string;
  color?: string;
  height?: number;
}) {
  const gradientId = `grad-${seriesName.replace(/\s+/g, "-")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--gridline)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="count"
          name={seriesName}
          stroke={color}
          strokeWidth={2.25}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--surface-1)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
