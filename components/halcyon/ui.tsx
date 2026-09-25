"use client";

import type { CSSProperties, ReactNode } from "react";
import { STATUS_STYLE, av, C, fmtDur, fmtInt, hm } from "@/lib/halcyon/format";
import type { DSession } from "@/lib/halcyon/types";
import type { SortState } from "./store";
import { useDash } from "./store";

export const BRAND = "AVA Fit";
export const BRAND_TAG = "ADMIN";

export const cssVars = (v: Record<string, string>) => v as CSSProperties;

export function Orb({ size = 26 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%,#ECEAFF,#4334DC 45%,#241F7A)",
        boxShadow: "0 0 18px rgba(67, 52, 220,.6)",
      }}
    />
  );
}

/** Tiles the signed-in admin's identity across the whole viewport so a leaked
 *  screenshot/photo is traceable to whoever took it — real prevention of
 *  screen capture isn't possible from a web page (see the data-protection
 *  plan), so this is the accountability layer instead. */
export function Watermark() {
  const { admin, nowMs, ready } = useDash();
  if (!ready) return null;
  const stamp = `${admin.name} · ${admin.email || admin.role} · ${new Date(nowMs).toLocaleString()}`;
  const cells = Array.from({ length: 48 }, (_, i) => i);
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
        gridTemplateColumns: "repeat(4,1fr)",
        transform: "rotate(-22deg) scale(1.4)",
        transformOrigin: "center",
      }}
    >
      {cells.map((i) => (
        <span
          key={i}
          style={{
            padding: "38px 10px",
            font: "500 12px var(--hc-mono)",
            color: "rgba(15,23,42,0.055)",
            whiteSpace: "nowrap",
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `600 ${fs}px var(--hc-sans)`,
      }}
    >
      {initials}
    </span>
  );
}

export function StatusPill({ status, pulse, title, style }: { status: string; pulse?: boolean; title?: string; style?: CSSProperties }) {
  const [c, bg] = STATUS_STYLE[status] ?? ["#64748B", "rgba(100,116,139,.12)"];
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
  n: ["#64748B", "#334155"],
  rose: [C.rose, "#BE123C"],
  amber: [C.amber, "#B45309"],
  green: [C.green, "#334155"],
  cyan: [C.cyan, "#372BC7"],
  violet: ["#7C3AED", "#6D28D9"],
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
          <span className="hc-timeline-dot" style={{ left: sm ? -18 : -20, background: TONE[l.tone][0], boxShadow: `0 0 8px ${TONE[l.tone][0]}` }} />
          <span style={{ font: `400 ${sm ? 11.5 : 12}px var(--hc-mono)`, color: "#64748B", paddingTop: 1 }}>{l.t}</span>
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
          <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(15,23,42,0.039)", border: "1px solid rgba(15,23,42,0.066)", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#5B6577" }}>
              {n.by} · {n.when}
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: "#1E293B", textWrap: "pretty", whiteSpace: "pre-wrap" }}>{n.text}</span>
          </div>
        ) : (
          <div key={i} className="hc-note">
            <span style={{ fontSize: 12, color: "#5B6577" }}>
              {n.by} · {n.when}
            </span>
            <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#1E293B", textWrap: "pretty", whiteSpace: "pre-wrap" }}>{n.text}</span>
          </div>
        )
      )}
    </>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <span className="hc-toggle" style={{ background: on ? "linear-gradient(180deg,#6C63FF,#4334DC)" : "rgba(15,23,42,0.110)" }}>
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
        background: "#10B981",
        boxShadow: "0 0 10px #10B981",
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
            style={cssVars({ "--fg": on ? "#0F172A" : "#64748B" })}
            onClick={() => {
              if (!k) return;
              onSort(!on ? { k, d: 1 } : sort.d > 0 ? { k, d: -1 } : { k: null, d: 1 });
            }}
          >
            {label}
            <span style={{ color: "#4334DC" }}>{on ? (sort.d > 0 ? " ↑" : " ↓") : ""}</span>
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
  return <div className="skeleton" style={{ height: h, borderRadius: 20 }} />;
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
  return <div style={{ padding: "60px 20px", textAlign: "center", color: "#64748B", fontSize: 14 }}>{children}</div>;
}
