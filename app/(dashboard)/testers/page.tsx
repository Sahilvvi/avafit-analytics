"use client";

import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { Avatar, PageHead } from "@/components/halcyon/ui";
import { agoLabel, fmtDur, fmtInt, C } from "@/lib/halcyon/format";

export default function TestersPage() {
  const { model, go, set, nowMs } = useDash();

  return (
    <div className="hc-page">
      <PageHead kicker={`${model.testers.length} TESTERS`} title="Testers" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 16 }}>
        {model.testers.map((t) => {
          const live = t.sessions.some((s) => s.status === "Live");
          const recent = t.sessions.slice(0, 10).reverse();
          const maxDur = Math.max(1, ...recent.map((s) => s.durS ?? 0));
          return (
            <div key={t.id} className="hc-card hc-tester-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ position: "relative" }}>
                  <Avatar hue={t.hue} initials={t.initials} size={46} fs={14} />
                  {live ? <span style={{ position: "absolute", right: 0, bottom: 0, width: 12, height: 12, borderRadius: "50%", background: C.green, boxShadow: "0 0 0 3px #FFFFFF,0 0 10px #10B981" }} /> : null}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                  <span style={{ fontSize: 12.5, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.email || "No email on file"}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
                <MiniStat label="Sessions" value={fmtInt(t.sessions.length)} />
                <MiniStat label="Patients" value={fmtInt(t.patients.length)} color={C.green} />
                <MiniStat label="Total time" value={fmtDur(t.totalS)} />
                <MiniStat label="Last active" value={agoLabel(t.lastSignInMs, nowMs)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="hc-eyebrow">RECENT SESSION DURATIONS</span>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
                  {recent.map((s) => (
                    <div key={s.id} title={`${s.code} · ${fmtDur(s.durS)}`} style={{ flex: 1, height: `${Math.max(6, ((s.durS ?? 0) / maxDur) * 100)}%`, borderRadius: "4px 4px 2px 2px", background: C.cyan, opacity: 0.85 }} />
                  ))}
                  {recent.length === 0 ? <span style={{ fontSize: 12.5, color: "#94A3B8" }}>No sessions yet</span> : null}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ height: 28, padding: "0 10px", borderRadius: 999, display: "flex", alignItems: "center", fontSize: 12.5, color: t.verified ? C.green : C.amber, background: t.verified ? "rgba(16,185,129,.12)" : "rgba(217,119,6,.12)" }}>
                  {t.verified ? "Verified" : "Unverified"}
                </span>
                <div style={{ flex: 1 }} />
                <button
                  className="hc-btn"
                  onClick={() => {
                    set({ sq: t.name, sDevice: "All" });
                    go("/sessions");
                  }}
                >
                  <Icon name="search" size={15} />
                  Sessions
                </button>
              </div>
            </div>
          );
        })}
        {model.testers.length === 0 ? <div className="hc-card" style={{ padding: 60, textAlign: "center", color: "#64748B" }}>No testers have signed up yet.</div> : null}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11.5, color: "#64748B" }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 600, color: color ?? "inherit" }}>{value}</span>
    </div>
  );
}
