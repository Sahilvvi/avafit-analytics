"use client";

import { useMemo } from "react";
import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { Avatar, EmptyRow, PageHead, SortHead, StatusPill, Timeline, sessionLog, sorter } from "@/components/halcyon/ui";
import { SecureValue } from "@/components/halcyon/SecureValue";
import { Spark } from "@/components/halcyon/charts";
import { profileEntries } from "@/components/halcyon/parts";
import { weeklyCounts, patientNotes } from "@/lib/halcyon/derive";
import { agoLabel, fmtDur, fmtInt, C } from "@/lib/halcyon/format";
import type { DPatient } from "@/lib/halcyon/types";

const PAGE_SIZE = 8;
const COLS: [string, string][] = [
  ["Patient", "name"],
  ["Side", "side"],
  ["Tester", "tester"],
  ["Sessions", "sessions"],
  ["Total time", "totalS"],
  ["Last session", "lastMs"],
  ["", ""],
];

export default function PatientsPage() {
  const { model, ui, set, go, nowMs, prefs } = useDash();

  const statusChips = useMemo(() => {
    const active = model.patients.filter((p) => p.status === "Active").length;
    const idle = model.patients.length - active;
    return [
      { key: "All", label: "All", count: model.patients.length, dot: "#64748B" },
      { key: "Active", label: "Active", count: active, dot: C.green },
      { key: "Idle", label: "Idle", count: idle, dot: "#94A3B8" },
    ];
  }, [model.patients]);

  const filtered = useMemo(() => {
    const q = ui.q.trim().toLowerCase();
    return model.patients.filter((p) => {
      if (ui.pStatus !== "All" && p.status !== ui.pStatus) return false;
      if (!q) return true;
      return `${p.name} ${p.code} ${p.tester}`.toLowerCase().includes(q);
    });
  }, [model.patients, ui.q, ui.pStatus]);

  const sorted = useMemo(() => {
    const val = (p: DPatient, k: string): string | number | null => {
      if (k === "sessions") return p.sessions.length;
      if (k === "totalS") return p.totalS;
      if (k === "lastMs") return p.lastMs;
      const v = (p as unknown as Record<string, unknown>)[k];
      return typeof v === "string" || typeof v === "number" ? v : null;
    };
    return [...filtered].sort(sorter(ui.sort, val));
  }, [filtered, ui.sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(ui.page, totalPages - 1);
  const rows = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // The expanded detail panel renders once, below the (possibly
  // horizontally-scrolling) table — not nested inside a row — so on a
  // narrow screen it stacks in place instead of requiring a sideways swipe
  // through the table just to read it.
  const expanded = ui.expanded ? (model.patientById.get(ui.expanded) ?? null) : null;
  const expandedNotes = useMemo(() => (expanded ? patientNotes(expanded, nowMs).slice(0, 2) : []), [expanded, nowMs]);
  const expandedWeekly = useMemo(() => (expanded ? weeklyCounts(expanded.sessions, nowMs, 10) : []), [expanded, nowMs]);
  const expandedProfile = useMemo(() => (expanded ? profileEntries(expanded) : []), [expanded]);

  return (
    <div className="hc-page">
      <PageHead kicker={`${model.patients.length} PATIENTS`} title="Patients" />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 14, top: 12, color: "#64748B", display: "flex" }}>
            <Icon name="search" size={16} />
          </span>
          <input className="hc-search" value={ui.q} onChange={(e) => set({ q: e.target.value, page: 0 })} placeholder="Search name, code or tester" />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {statusChips.map((c) => {
            const on = ui.pStatus === c.key;
            return (
              <button
                key={c.key}
                onClick={() => set({ pStatus: c.key, page: 0 })}
                className="hc-chip"
                style={{ ["--bd" as string]: on ? "rgba(67, 52, 220,.35)" : "rgba(15,23,42,.08)", ["--bg" as string]: on ? "rgba(67, 52, 220,.1)" : "rgba(15,23,42,0.044)", ["--fg" as string]: on ? "#372BC7" : "#334155" }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
                {c.label}
                <span style={{ font: "500 11.5px var(--hc-mono)", opacity: 0.7 }}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="hc-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,2.2fr) 90px minmax(140px,1.3fr) 96px 116px 130px 36px", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(15,23,42,0.066)" }}>
              <SortHead cols={COLS} sort={ui.sort} onSort={(s) => set({ sort: s })} />
            </div>
            <div>
              {rows.map((p) => {
                const open = ui.expanded === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => set({ expanded: open ? null : p.id })}
                    className="hc-row"
                    style={{ display: "grid", gridTemplateColumns: "minmax(220px,2.2fr) 90px minmax(140px,1.3fr) 96px 116px 130px 36px", gap: 12, padding: "0 20px", height: prefs.compact ? 52 : 64, alignItems: "center", borderBottom: "1px solid rgba(15,23,42,0.055)", background: open ? "rgba(67, 52, 220,.05)" : undefined }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <Avatar hue={p.hue} initials={p.initials} />
                      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                        <span style={{ font: "400 11.5px var(--hc-mono)", color: "#64748B" }}>{p.code}</span>
                      </span>
                    </div>
                    <span style={{ fontSize: 13.5, color: "#334155", textTransform: "capitalize" }}>{p.side ?? "—"}</span>
                    <span style={{ fontSize: 13.5, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.tester}</span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <SecureValue value={p.sessions.length} fontSize={13} weight={500} />
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <SecureValue value={fmtDur(p.totalS)} fontSize={12.5} weight={500} color="#334155" />
                    </span>
                    <span style={{ fontSize: 13, color: "#5B6577" }}>{agoLabel(p.lastMs, nowMs)}</span>
                    <span style={{ display: "flex", color: "#64748B", transform: open ? "rotate(90deg)" : "none", transition: "transform .3s cubic-bezier(.2,.8,.2,1)" }}>
                      <Icon name="chevRight" size={16} />
                    </span>
                  </div>
                );
              })}
              {rows.length === 0 ? <EmptyRow>{ui.q ? `No patients match “${ui.q}”` : "No patients yet."}</EmptyRow> : null}
            </div>
          </div>
        </div>

        {expanded ? (
          <div style={{ borderTop: "1px solid rgba(15,23,42,0.066)", padding: "18px 20px 22px", animation: "hcFadeUp .35s cubic-bezier(.2,.8,.2,1) both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Avatar hue={expanded.hue} initials={expanded.initials} size={30} fs={11} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{expanded.name}</span>
              <span style={{ font: "400 11.5px var(--hc-mono)", color: "#64748B" }}>{expanded.code}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 14, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.066)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="hc-eyebrow">SESSION LOG</span>
                  <span style={{ font: "500 11px var(--hc-mono)", color: C.cyan }}>{expanded.sessions[0]?.code ?? "—"}</span>
                </div>
                {expanded.sessions[0] ? <Timeline items={sessionLog(expanded.sessions[0])} size="sm" /> : <span style={{ fontSize: 13, color: "#64748B" }}>No sessions yet.</span>}
              </div>
              <div style={{ padding: 16, borderRadius: 14, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.066)", display: "flex", flexDirection: "column", gap: 12 }}>
                <span className="hc-eyebrow">SENSOR PROFILE &amp; NOTES</span>
                {expandedProfile.length ? expandedProfile.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, gap: 8 }}>
                    <span style={{ color: "#64748B" }}>{k}</span>
                    <span style={{ color: "#334155", textAlign: "right" }}>{v}</span>
                  </div>
                )) : null}
                {expandedNotes.length ? expandedNotes.map((n, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, borderTop: i === 0 && expandedProfile.length ? "1px solid rgba(15,23,42,0.066)" : undefined, paddingTop: i === 0 && expandedProfile.length ? 8 : 0 }}>
                    <span style={{ fontSize: 12, color: "#5B6577" }}>{n.by} · {n.when}</span>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: "#1E293B" }}>{n.text}</span>
                  </div>
                )) : null}
                {!expandedProfile.length && !expandedNotes.length ? <span style={{ fontSize: 13, color: "#64748B" }}>Nothing recorded yet.</span> : null}
              </div>
              <div style={{ padding: 16, borderRadius: 14, background: "#F8FAFC", border: "1px solid rgba(15,23,42,0.066)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="hc-eyebrow">SESSIONS / WEEK</span>
                  <span style={{ font: "500 11px var(--hc-mono)", color: "#5B6577" }}>10 WK</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
                  {expandedWeekly.map((v, i) => (
                    <div key={i} style={{ flex: 1, height: `${Math.max(6, (v / Math.max(1, ...expandedWeekly)) * 100)}%`, borderRadius: "3px 3px 1px 1px", background: v ? C.cyan : "rgba(15,23,42,0.1)" }} />
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {expanded.sessions.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => set({ drawer: s.id })}
                      className="hc-hover-55"
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", margin: "0 -8px", borderRadius: 8, border: 0, background: "transparent", color: "inherit", cursor: "pointer", textAlign: "left" }}
                    >
                      <span title={s.code} style={{ font: "400 11.5px var(--hc-mono)", color: "#5B6577", width: 78, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.code}</span>
                      <span style={{ flex: 1, fontSize: 12.5, color: "#334155" }}>{s.device} · {agoLabel(s.startMs, nowMs)}</span>
                      <span style={{ font: "500 12px var(--hc-mono)" }}>{fmtInt(s.rows)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <button className="hc-btn-primary" onClick={() => go(`/patients/${expanded.id}`)}>
                <Icon name="expand" size={15} />
                Open full profile
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid rgba(15,23,42,0.066)", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#64748B", fontVariantNumeric: "tabular-nums" }}>
            {sorted.length ? `${page * PAGE_SIZE + 1}–${Math.min(sorted.length, (page + 1) * PAGE_SIZE)} of ${sorted.length}` : "0 of 0"}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="hc-page-btn hc-nav-btn" aria-label="Previous" disabled={page === 0} style={{ opacity: page === 0 ? 0.4 : 1 }} onClick={() => set({ page: Math.max(0, page - 1) })}>
              <Icon name="chevLeft" size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .slice(Math.max(0, page - 2), Math.max(0, page - 2) + 5)
              .map((i) => (
                <button
                  key={i}
                  onClick={() => set({ page: i })}
                  className="hc-page-btn"
                  style={{ ["--bd" as string]: i === page ? "rgba(67, 52, 220,.4)" : "rgba(15,23,42,.08)", ["--bg" as string]: i === page ? "rgba(67, 52, 220,.1)" : "transparent", ["--fg" as string]: i === page ? "#372BC7" : "#334155", font: "500 13px var(--hc-mono)" }}
                >
                  {i + 1}
                </button>
              ))}
            <button className="hc-page-btn hc-nav-btn" aria-label="Next" disabled={page >= totalPages - 1} style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }} onClick={() => set({ page: Math.min(totalPages - 1, page + 1) })}>
              <Icon name="chevRight" size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
