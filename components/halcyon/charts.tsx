"use client";

import { useId } from "react";

/** Catmull-Rom → cubic Bézier smoothing, identical to the prototype. */
export function smoothPath(pts: [number, number][]): string {
  if (!pts.length) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Filled sparkline that draws itself in. */
export function Spark({ data, color, glow = true }: { data: number[]; color: string; glow?: boolean }) {
  const id = "sp" + useId().replace(/:/g, "");
  const w = 100;
  const h = 32;
  const arr = data.length > 1 ? data : [0, 0];
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const line = smoothPath(arr.map((v, i) => [(i / (arr.length - 1)) * w, h - 3 - ((v - mn) / (mx - mn || 1)) * (h - 6)]));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          animation: "hcDraw 1.2s cubic-bezier(.2,.8,.2,1) both",
          filter: glow ? `drop-shadow(0 0 4px ${color})` : undefined,
        }}
      />
    </svg>
  );
}

/** Two-series smooth line chart body (SVG only — axes/tooltip are overlaid by the caller). */
export function DualLines({
  a,
  b,
  seriesKey,
  W = 800,
  H = 260,
}: {
  /** Already scaled to 0..1 (1 = top). */
  a: number[];
  b: number[];
  seriesKey: string;
  W?: number;
  H?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const n = a.length;
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2);
  const y = (v: number) => 12 + (1 - v) * (H - 24);
  const lA = smoothPath(a.map((v, i) => [x(i), y(v)]));
  const lB = smoothPath(b.map((v, i) => [x(i), y(v)]));
  const grad = (id: string, c: string, o: number) => (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={c} stopOpacity={o} />
      <stop offset="100%" stopColor={c} stopOpacity={0} />
    </linearGradient>
  );
  return (
    <svg
      key={seriesKey}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        {grad(`gA${uid}`, "#0AA5C2", 0.28)}
        {grad(`gB${uid}`, "#10B981", 0.16)}
      </defs>
      {[0, 1, 2, 3, 4].map((k) => (
        <line
          key={k}
          x1={0}
          x2={W}
          y1={12 + (k * (H - 24)) / 4}
          y2={12 + (k * (H - 24)) / 4}
          stroke="rgba(15,23,42,0.066)"
          strokeDasharray="3 5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={`${lB} L${W},${H} L0,${H} Z`} fill={`url(#gB${uid})`} style={{ animation: "hcFadeIn 1s both" }} />
      <path d={`${lA} L${W},${H} L0,${H} Z`} fill={`url(#gA${uid})`} style={{ animation: "hcFadeIn 1s both" }} />
      <path
        d={lB}
        fill="none"
        stroke="#10B981"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{ strokeDasharray: 1, animation: "hcDraw 1.4s cubic-bezier(.2,.8,.2,1) both", filter: "drop-shadow(0 4px 8px rgba(16,185,129,.3))" }}
      />
      <path
        d={lA}
        fill="none"
        stroke="#0AA5C2"
        strokeWidth={2.4}
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{ strokeDasharray: 1, animation: "hcDraw 1.4s .1s cubic-bezier(.2,.8,.2,1) both", filter: "drop-shadow(0 4px 8px rgba(10,165,194,.35))" }}
      />
    </svg>
  );
}

/** Donut with hoverable segments (values are counts). */
export function Donut({
  values,
  colors,
  hover,
  onHover,
}: {
  values: number[];
  colors: string[];
  hover: number | null;
  onHover: (i: number | null) => void;
}) {
  const R = 72;
  const CIRC = 2 * Math.PI * R;
  const tot = values.reduce((a, b) => a + b, 0);
  let acc = 0;
  return (
    <svg viewBox="0 0 180 180" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)", overflow: "visible" }}>
      <circle cx={90} cy={90} r={R} fill="none" stroke="rgba(15,23,42,0.055)" strokeWidth={14} />
      {tot > 0 &&
        values.map((c, i) => {
          if (!c) return null;
          const len = (c / tot) * CIRC;
          const off = acc;
          acc += len;
          const on = hover === i;
          return (
            <circle
              key={i}
              cx={90}
              cy={90}
              r={R}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeLinecap="round"
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              style={{
                strokeWidth: on ? 20 : 14,
                strokeDasharray: `${Math.max(0, len - (values.filter(Boolean).length > 1 ? 8 : 0))} ${CIRC}`,
                strokeDashoffset: -off - (values.filter(Boolean).length > 1 ? 4 : 0),
                opacity: hover == null || on ? 1 : 0.35,
                transition: "stroke-width .35s cubic-bezier(.2,.8,.2,1),opacity .3s",
                filter: on ? `drop-shadow(0 0 10px ${colors[i % colors.length]})` : "none",
                cursor: "pointer",
              }}
            />
          );
        })}
    </svg>
  );
}

/** Single-series smoothed area line used on the Analytics page. */
export function AreaLine({ data, color, height = 160 }: { data: number[]; color: string; height?: number }) {
  return (
    <div style={{ height }}>
      <Spark data={data} color={color} />
    </div>
  );
}
