"use client";

import { useMemo } from "react";
import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { Avatar, EmptyRow, PageHead, SortHead, StatusPill, sorter } from "@/components/halcyon/ui";
import { sessionRows } from "@/lib/halcyon/exports";
import { fmtDur, fmtInt, whenLabel } from "@/lib/halcyon/format";
import type { DSession } from "@/lib/halcyon/types";

const COLS: [string, string][] = [
  ["Session", "code"],
  ["Patient", "patient"],
  ["Device", "device"],
  ["Tester", "tester"],
  ["Duration", "durS"],
  ["Samples", "rows"],
  ["Status", "status"],
  ["Started", "startMs"],
];

export default function SessionsPage() {
  const { model, ui, set, nowMs, exportCSV, prefs } = useDash();

  const chips = useMemo(() => {
    const all = { key: "All", label: "All devices", count: model.sessions.length };
    const byDevice = model.devices.map((d) => ({ key: d, label: d, count: model.sessions.filter((s) => s.device === d).length }));
    return [all, ...byDevice];
  }, [model.sessions, model.devices]);

  const filtered = useMemo(() => {
    const q = ui.sq.trim().toLowerCase();
    return model.sessions.filter((s) => {
      if (ui.sDevice !== "All" && s.device !== ui.sDevice) return false;
      if (!q) return true;
      return `${s.code} ${s.patient} ${s.tester}`.toLowerCase().includes(q);
    });
  }, [model.sessions, ui.sq, ui.sDevice]);

  const sorted = useMemo(() => {
    const val = (s: DSession, k: string): string | number | null => {
      const v = (s as unknown as Record<string, unknown>)[k];
      return typeof v === "string" || typeof v === "number" ? v : null;
    };
    return [...filtered].sort(sorter(ui.ssort, val));
  }, [filtered, ui.ssort]);

  return (
    <div className="hc-page">
      <PageHead kicker={`${model.sessions.length} SESSIONS`} title="Sessions" />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 14, top: 12, color: "#64748B", display: "flex" }}>
            <Icon name="search" size={16} />
          </span>
          <input className="hc-search" value={ui.sq} onChange={(e) => set({ sq: e.target.value })} placeholder="Search session code, patient or tester" />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {chips.map((c) => {
            const on = ui.sDevice === c.key;
            return (
              <button
                key={c.key}
                onClick={() => set({ sDevice: c.key })}
                className="hc-chip"
                style={{ ["--bd" as string]: on ? "rgba(10,165,194,.35)" : "rgba(15,23,42,.08)", ["--bg" as string]: on ? "rgba(10,165,194,.1)" : "rgba(15,23,42,0.044)", ["--fg" as string]: on ? "#0E7490" : "#334155" }}
              >
                {c.label}
                <span style={{ font: "500 11.5px var(--hc-mono)", opacity: 0.7 }}>{c.count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="hc-btn" onClick={() => exportCSV("ava-fit-sessions", sessionRows(model))}>
            <Icon name="download" size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="hc-card" style={{ overflow: "hidden" }}>
        <div style={{ overflow: "auto", maxHeight: 640 }}>
          <div style={{ minWidth: 960 }}>
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                display: "grid",
                gridTemplateColumns: "minmax(160px,1.3fr) minmax(180px,2fr) 110px minmax(120px,1fr) 100px 100px 130px 150px",
                gap: 12,
                padding: "14px 20px",
                borderBottom: "1px solid rgba(15,23,42,0.066)",
                background: "rgba(255,255,255,.97)",
                backdropFilter: "blur(12px)",
              }}
            >
              <SortHead cols={COLS} sort={ui.ssort} onSort={(s) => set({ ssort: s })} />
            </div>
            {sorted.map((s) => (
              <div
                key={s.id}
                onClick={() => set({ drawer: s.id })}
                className="hc-row-39"
                style={{ display: "grid", gridTemplateColumns: "minmax(160px,1.3fr) minmax(180px,2fr) 110px minmax(120px,1fr) 100px 100px 130px 150px", gap: 12, padding: "0 20px", height: prefs.compact ? 46 : 60, alignItems: "center", borderBottom: "1px solid rgba(15,23,42,0.055)", cursor: "pointer" }}
              >
                <span title={s.code} style={{ font: "500 12.5px var(--hc-mono)", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.code}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar hue={s.hue} initials={s.initials} size={30} fs={11} />
                  <span style={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.patient}</span>
                </div>
                <span style={{ fontSize: 13, color: "#5B6577" }}>{s.device}</span>
                <span style={{ fontSize: 13, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.tester}</span>
                <span style={{ font: "400 12.5px var(--hc-mono)", color: "#5B6577" }}>{fmtDur(s.durS)}</span>
                <span style={{ font: "500 13px var(--hc-mono)" }}>{fmtInt(s.rows)}</span>
                <StatusPill status={s.status} pulse={s.status === "Live"} />
                <span style={{ fontSize: 13, color: "#5B6577" }}>{whenLabel(s.startMs, nowMs)}</span>
              </div>
            ))}
            {sorted.length === 0 ? <EmptyRow>No sessions match your filters.</EmptyRow> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
