"use client";

import type { CSSProperties, ReactNode } from "react";
import { STATUS_STYLE, av, C, fmtDur, fmtInt, hm } from "@/lib/halcyon/format";
import type { DSession } from "@/lib/halcyon/types";
import type { SortState } from "./store";
import { useDash } from "./store";

export const BRAND = "AVA Fit";
export const BRAND_TAG = "ADMIN";

export const cssVars = (v: Record<string, string>) => v as CSSProperties;

/** Brand mark: a 3×3 pressure-sensor pad, cells lit by load — a literal nod
 *  to what AVA Fit measures, instead of a generic glowing orb. */
const MARK_LOAD = [0.35, 0.7, 0.35, 0.7, 1, 0.55, 0.3, 0.55, 0.25];
export function Orb({ size = 26 }: { size?: number }) {
  const cell = size * 0.2;
  const gap = size * 0.07;
  const pad = (size - cell * 3 - gap * 2) / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: "none", display: "block" }} aria-hidden>
      <defs>
        <linearGradient id="hc-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A2B3A" />
          <stop offset="1" stopColor="#15161D" />
        </linearGradient>
      </defs>
      <rect x={0.5} y={0.5} width={size - 1} height={size - 1} rx={size * 0.28} fill="url(#hc-mark-bg)" stroke="rgba(255,255,255,0.14)" />
      {MARK_LOAD.map((v, i) => (
        <rect
          key={i}
          x={pad + (i % 3) * (cell + gap)}
          y={pad + Math.floor(i / 3) * (cell + gap)}
          width={cell}
          height={cell}
          rx={cell * 0.32}
          fill={v > 0.9 ? "#FFFFFF" : `rgba(154,156,255,${v})`}
        />
      ))}
    </svg>
  );
}

/** Tiles the signed-in admin's identity across the whole viewport so a leaked
 *  screenshot/photo is traceable to whoever took it — real prevention of
 *  screen capture isn't possible from a web page (see the data-protection
 *  plan), so this is the accountability layer instead. */
export function Watermark() {
  const { admin, nowMs, ready } = useDash();
  if (!ready) return null;
  // Short on purpose — a full sentence tiled across the page reads like a
  // trial-software stamp. This is meant to be nearly invisible in normal use
  // and only legible on close inspection of a leaked screenshot.
  const stamp = `${admin.email || admin.name} · ${new Date(nowMs).toLocaleDateString()}`;
  const cells = Array.from({ length: 15 }, (_, i) => i);
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "10vh 0",
        transform: "rotate(-18deg) scale(1.15)",
        transformOrigin: "center",
      }}
    >
      {cells.map((i) => (
        <span
          key={i}
          style={{
            padding: "0 10px",
            font: "500 10px var(--hc-mono)",
            color: "rgba(255,255,255,0.03)",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          {stamp}
        </span>
      ))}
    </div>
  );
}

export function Avatar({ hue, initials, size = 36, fs = 12 }: { hue: number; initials: string; size?: number; fs?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50%",
        background: av(hue),
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.12)",
        color: "#EDEEF2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `600 ${fs}px var(--hc-sans)`,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </span>
  );
}

export function StatusPill({ status, pulse, title, style }: { status: string; pulse?: boolean; title?: string; style?: CSSProperties }) {
  const [c, bg] = STATUS_STYLE[status] ?? ["#8C909B", "rgba(140,144,155,.12)"];
  return (
    <span className="hc-pill" style={{ color: c, background: bg, ...style }} title={title}>
      <span className="hc-pill-dot" style={{ background: c, animation: pulse ? "hcPulse 1.6s infinite" : undefined }} />
      {status}
    </span>
  );
}

export const STATUS_HINT: Record<string, string> = {
  Live: "No end time recorded and started within the last 6 hours",
  Completed: "Session has ended",
  Active: "Logged a session in the last 30 days",
  Idle: "No session in the last 30 days",
};

export type Tone = "n" | "rose" | "amber" | "green" | "cyan" | "violet";
export interface LogEntry {
  t: string;
  e: string;
  tone: Tone;
}
const TONE: Record<Tone, [string, string]> = {
  n: ["#8C909B", "#C3C6CF"],
  rose: [C.rose, "#FDA4AF"],
  amber: [C.amber, "#FCD34D"],
  green: [C.green, "#C3C6CF"],
  cyan: [C.cyan, "#B4B6FF"],
  violet: ["#A78BFA", "#C4B5FD"],
};

/** Start / end events derived from the real timestamps on a session row. */
export function sessionLog(s: DSession): LogEntry[] {
  const out: LogEntry[] = [];
  if (s.startMs != null) out.push({ t: hm(s.startMs), e: `Session started · ${s.device}`, tone: "n" });
  if (s.status === "Live") {
    out.push({ t: "now", e: "In progress · no end time recorded yet", tone: "cyan" });
  } else {
    const endMs = s.endMs ?? (s.startMs != null && s.durS != null ? s.startMs + s.durS * 1000 : null);
    const parts = [`Session ended`];
    if (s.rows != null) parts.push(`${fmtInt(s.rows)} samples`);
    if (s.durS != null) parts.push(fmtDur(s.durS));
    out.push({ t: endMs != null ? hm(endMs) : "—", e: parts.join(" · "), tone: "green" });
  }
  return out;
}

export function Timeline({ items, size = "md" }: { items: LogEntry[]; size?: "sm" | "md" }) {
  const sm = size === "sm";
  return (
    <div className="hc-timeline" style={{ gap: sm ? 10 : 12, paddingLeft: sm ? 14 : 16 }}>
      {items.map((l, i) => (
        <div key={i} className="hc-timeline-item" style={{ gap: sm ? 10 : 12, fontSize: sm ? 13 : 13.5 }}>
          <span className="hc-timeline-dot" style={{ left: sm ? -18 : -20, background: TONE[l.tone][0], boxShadow: `0 0 0 3px #0B0C10` }} />
          <span style={{ font: `400 ${sm ? 11.5 : 12}px var(--hc-mono)`, color: "#8C909B", paddingTop: 1 }}>{l.t}</span>
          <span style={{ color: TONE[l.tone][1] }}>{l.e}</span>
        </div>
      ))}
    </div>
  );
}

export interface NoteItem {
  by: string;
  when: string;
  text: string;
}

export function Notes({ notes, drawer }: { notes: NoteItem[]; drawer?: boolean }) {
  return (
    <>
      {notes.map((n, i) =>
        drawer ? (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.039)", border: "1px solid rgba(255,255,255,0.066)", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#8C909B" }}>
              {n.by} · {n.when}
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: "#EDEEF2", textWrap: "pretty", whiteSpace: "pre-wrap" }}>{n.text}</span>
          </div>
        ) : (
          <div key={i} className="hc-note">
            <span style={{ fontSize: 12, color: "#8C909B" }}>
              {n.by} · {n.when}
            </span>
            <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#EDEEF2", textWrap: "pretty", whiteSpace: "pre-wrap" }}>{n.text}</span>
          </div>
        )
      )}
    </>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <span className="hc-toggle" style={{ background: on ? "#8083FF" : "rgba(255,255,255,0.1)" }}>
      <span className="hc-toggle-knob" style={{ transform: on ? "translateX(16px)" : "none" }} />
    </span>
  );
}

export function LiveDot({ size = 7, pulse = true }: { size?: number; pulse?: boolean }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#3ECF8E",
        boxShadow: "0 0 0 3px rgba(62,207,142,0.16)",
        animation: pulse ? "hcPulse 2s infinite" : undefined,
        flex: "none",
      }}
    />
  );
}

/** Column header buttons for sortable tables. Clicking cycles asc → desc → none. */
export function SortHead({
  cols,
  sort,
  onSort,
}: {
  cols: [string, string][];
  sort: SortState;
  onSort: (s: SortState) => void;
}) {
  return (
    <>
      {cols.map(([label, k], i) => {
        const on = !!k && sort.k === k;
        return (
          <button
            key={i}
            className="hc-th"
            style={cssVars({ "--fg": on ? "#EDEEF2" : "#8C909B" })}
            onClick={() => {
              if (!k) return;
              onSort(!on ? { k, d: 1 } : sort.d > 0 ? { k, d: -1 } : { k: null, d: 1 });
            }}
          >
            {label}
            <span style={{ color: "#8083FF" }}>{on ? (sort.d > 0 ? " ↑" : " ↓") : ""}</span>
          </button>
        );
      })}
    </>
  );
}

export function sorter<T>(sort: SortState, val: (row: T, k: string) => string | number | null) {
  return (a: T, b: T) => {
    if (!sort.k) return 0;
    const x = val(a, sort.k);
    const y = val(b, sort.k);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (typeof x === "string" && typeof y === "string" ? x.localeCompare(y) : Number(x) - Number(y)) * sort.d;
  };
}

export function Skeleton({ h = 200 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h, borderRadius: 14 }} />;
}

export function Card({ children, style, className = "" }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={`hc-card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function PageHead({ kicker, title, right, live }: { kicker: ReactNode; title: string; right?: ReactNode; live?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="hc-kicker" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {live ? <LiveDot /> : null}
          {kicker}
        </span>
        <h1 className="hc-h1">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <div style={{ padding: "56px 20px", textAlign: "center", color: "#5E626D", fontSize: 13 }}>{children}</div>;
}
