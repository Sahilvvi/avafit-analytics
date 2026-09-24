"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  key: string;
  label: string;
  current: number;
  previous: number;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border-strong bg-surface-2 px-3 py-2 text-xs shadow-xl shadow-black/40">
      <p className="mb-1 font-medium text-text-primary">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-text-primary">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Overlays the current period against the immediately-prior period of equal
 *  length, so growth or decline is visible at a glance instead of needing a
 *  separate number. */
export default function ComparisonAreaChart({ data, height = 240 }: { data: Point[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-current" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
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
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }} />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
        />
        <Area
          type="monotone"
          dataKey="previous"
          name="Prior period"
          stroke="var(--baseline)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          fill="none"
          dot={false}
          isAnimationActive
          animationDuration={700}
        />
        <Area
          type="monotone"
          dataKey="current"
          name="This period"
          stroke="var(--series-1)"
          strokeWidth={2.25}
          fill="url(#grad-current)"
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--surface-1)" }}
          isAnimationActive
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
