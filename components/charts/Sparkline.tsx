"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

/** Tiny inline trend line for a StatCard — the shape matters, not the axes,
 *  so there's no grid/labels/tooltip, just the last-N-day silhouette. */
export default function Sparkline({ values, color = "var(--accent)" }: { values: number[]; color?: string }) {
  if (values.length < 2 || values.every((v) => v === 0)) return null;
  const data = values.map((count, i) => ({ i, count }));
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className="mt-2 h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="count" stroke={color} strokeWidth={1.75} fill={`url(#${gradientId})`} dot={false} isAnimationActive animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
