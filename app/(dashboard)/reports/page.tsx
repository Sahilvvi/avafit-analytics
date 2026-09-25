"use client";

import { useMemo } from "react";
import { useDash } from "@/components/halcyon/store";
import { EmptyRow, PageHead } from "@/components/halcyon/ui";
import { dailySeries } from "@/lib/halcyon/derive";
import { fmtDur } from "@/lib/halcyon/format";
import type { Model } from "@/lib/halcyon/types";

interface ReportDef {
  key: string;
  title: string;
  desc: string;
  cols: string[];
  grid: string;
  rows: (m: Model) => (string | number)[][];
}

function weeklySummaryRows(m: Model): (string | number)[][] {
  const days = dailySeries(m, 84);
  const weeks: { from: string; sessions: number; patients: Set<string>; rows: number; durS: number }[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    weeks.push({
      from: chunk[0].label,
      sessions: chunk.reduce((a, d) => a + d.sessions, 0),
      patients: new Set<string>(),
      rows: chunk.reduce((a, d) => a + d.rows, 0),
      durS: chunk.reduce((a, d) => a + d.durS, 0),
    });
  }
  return weeks.map((w) => [w.from, w.sessions, w.rows, w.sessions ? Math.round(w.durS / w.sessions) : 0]);
}

const REPORTS: ReportDef[] = [
  {
    key: "roster",
    title: "Patient roster",
    desc: "Every patient profile, owner and lifetime activity",
    cols: ["PATIENT", "CODE", "TESTER", "SESSIONS", "TOTAL TIME", "STATUS"],
    grid: "minmax(160px,1.6fr) 100px minmax(120px,1fr) 90px 110px 90px",
    rows: (m) => m.patients.map((p) => [p.name, p.code, p.tester, p.sessions.length, fmtDur(p.totalS), p.status]),
  },
  {
    key: "sessions",
    title: "Session log",
    desc: "Every logging session synced from every tester",
    cols: ["SESSION", "PATIENT", "DEVICE", "TESTER", "DURATION", "STARTED"],
    grid: "100px minmax(140px,1.4fr) 90px minmax(120px,1fr) 100px 150px",
    rows: (m) => m.sessions.slice(0, 200).map((s) => [s.code, s.patient, s.device, s.tester, fmtDur(s.durS), s.startMs ? new Date(s.startMs).toLocaleString() : "—"]),
  },
  {
    key: "testers",
    title: "Tester activity",
    desc: "Sign-ups and lifetime activity per tester",
    cols: ["TESTER", "EMAIL", "SESSIONS", "PATIENTS", "TOTAL TIME"],
    grid: "minmax(140px,1.3fr) minmax(180px,1.6fr) 90px 90px 110px",
    rows: (m) => m.testers.map((t) => [t.name, t.email, t.sessions.length, t.patients.length, fmtDur(t.totalS)]),
  },
  {
    key: "weekly",
    title: "Weekly summary",
    desc: "Sessions, samples and average duration by week, last 12 weeks",
    cols: ["WEEK OF", "SESSIONS", "SAMPLES", "AVG DURATION (S)"],
    grid: "140px 100px 100px 140px",
    rows: (m) => weeklySummaryRows(m),
  },
];

export default function ReportsPage() {
  const { model, ui, set, ready, nowMs } = useDash();
  const active = REPORTS.find((r) => r.key === ui.report) ?? REPORTS[0];
  const rows = useMemo(() => active.rows(model), [active, model]);

  // Locale-formatted dates can render differently on the server than in the
  // browser (different ICU/locale data), which is a hydration mismatch —
  // `ready` (false during SSR, true after hydration) keeps the first client
  // render identical to the server's before swapping in the real string.
  const generated = ready
    ? new Date(nowMs).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).toUpperCase()
    : "…";

  return (
    <div className="hc-page">
      <PageHead kicker={`GENERATED ${generated}`} title="Reports" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {REPORTS.map((r) => {
            const on = r.key === active.key;
            return (
              <button
                key={r.key}
                onClick={() => set({ report: r.key })}
                style={{ display: "flex", flexDirection: "column", gap: 6, padding: "16px 18px", borderRadius: 16, border: `1px solid ${on ? "rgba(15,23,42,0.14)" : "rgba(15,23,42,0.08)"}`, background: on ? "rgba(67, 52, 220,.06)" : "rgba(15,23,42,0.039)", color: "#0F172A", textAlign: "left", cursor: "pointer", transition: "all .3s cubic-bezier(.2,.8,.2,1)" }}
              >
                <span style={{ display: "flex", justifyContent: "space-between", gap: 10, font: "600 14.5px var(--hc-sans)" }}>
                  {r.title}
                  <span style={{ font: "500 11px var(--hc-mono)", color: "#64748B", whiteSpace: "nowrap" }}>{r.rows(model).length}</span>
                </span>
                <span style={{ font: "400 13px var(--hc-sans)", color: "#5B6577" }}>{r.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="hc-card" style={{ flex: "2.4 1 560px", minWidth: 0, overflow: "hidden" }}>
          <div style={{ padding: "22px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", borderBottom: "1px solid rgba(15,23,42,0.066)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-.01em" }}>{active.title}</h3>
              <span className="hc-sub">{active.desc}</span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 620 }}>
              <div style={{ display: "grid", gridTemplateColumns: active.grid, gap: 12, padding: "12px 24px", borderBottom: "1px solid rgba(15,23,42,0.066)" }} className="hc-eyebrow">
                {active.cols.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              {rows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: active.grid, gap: 12, padding: "14px 24px", borderBottom: "1px solid rgba(15,23,42,0.055)", fontSize: 13.5, color: "#334155" }}>
                  {r.map((c, j) => (
                    <span key={j} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {String(c)}
                    </span>
                  ))}
                </div>
              ))}
              {rows.length === 0 ? <EmptyRow>Nothing to report right now.</EmptyRow> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
