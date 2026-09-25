"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { PageHead, LiveDot, cssVars } from "@/components/halcyon/ui";
import { SecureValue } from "@/components/halcyon/SecureValue";
import { Spark, DualLines, Donut } from "@/components/halcyon/charts";
import { dailySeries, deltaOf, windowStats } from "@/lib/halcyon/derive";
import { fmtCompact, fmtDur, fmtInt, C } from "@/lib/halcyon/format";
import type { DSession } from "@/lib/halcyon/types";

const RANGE_DAYS: Record<string, number> = { "7D": 7, "30D": 30, "90D": 90 };
const DAY = 864e5;

function KpiCard({
  icon,
  iconBg,
  iconFg,
  label,
  value,
  sub,
  delta,
  spark,
  sparkColor,
  tintBd,
  tintSh,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  iconBg: string;
  iconFg: string;
  label: string;
  value: string;
  sub: string;
  delta: { text: string; tone: "up" | "down" | "flat" };
  spark: number[];
  sparkColor: string;
  tintBd: string;
  tintSh: string;
}) {
  const deltaColor = delta.tone === "up" ? C.green : delta.tone === "down" ? C.rose : "#64748B";
  const deltaBg = delta.tone === "up" ? "rgba(16,185,129,.12)" : delta.tone === "down" ? "rgba(225,29,72,.1)" : "rgba(100,116,139,.12)";
  return (
    <div className="hc-kpi" style={cssVars({ "--tint-bd": tintBd, "--tint-sh": tintSh })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#5B6577" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: iconBg, color: iconFg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={icon} size={16} />
          </span>
          {label}
        </div>
        <span style={{ font: "500 11.5px var(--hc-mono)", padding: "3px 8px", borderRadius: 999, color: deltaColor, background: deltaBg }}>{delta.text}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ letterSpacing: "-.03em" }}>
            <SecureValue value={value} fontSize={34} weight={600} />
          </span>
          <span style={{ fontSize: 12, color: "#64748B" }}>{sub}</span>
        </div>
        <div style={{ width: 110, height: 40 }}>
          <Spark data={spark} color={sparkColor} />
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { model, ui, set, go, ready, admin } = useDash();
  const [hoverDonut, setHoverDonut] = useState<number | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const range: [number, number] = useMemo(() => {
    if (ui.cr) return ui.cr;
    const days = RANGE_DAYS[ui.range] ?? 30;
    return [model.nowMs - days * DAY, model.nowMs];
  }, [ui.cr, ui.range, model.nowMs]);

  const days = Math.max(1, Math.min(120, Math.round((range[1] - range[0]) / DAY)));
  const series = useMemo(() => dailySeries({ ...model, nowMs: range[1] }, days), [model, range, days]);

  const cur = windowStats(model, range[0], range[1]);
  const prevLen = range[1] - range[0];
  const prev = windowStats(model, range[0] - prevLen, range[0]);

  const maxSessions = Math.max(1, ...series.map((p) => p.sessions));
  const maxRows = Math.max(1, ...series.map((p) => p.rows));
  const lineA = series.map((p) => p.sessions / maxSessions);
  const lineB = series.map((p) => p.rows / maxRows);

  const deviceCounts = model.devices.map((d) => model.sessions.filter((s) => s.device === d).length);
  const testerBars = model.testers.slice(0, 6);
  const maxTesterSessions = Math.max(1, ...testerBars.map((t) => t.sessions.length));

  const latest = model.sessions.slice(0, 6);

  const rangeLabel = ui.cr ? `${new Date(ui.cr[0]).toLocaleDateString()} – ${new Date(ui.cr[1]).toLocaleDateString()}` : ui.range;

  return (
    <div className="hc-page">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
        <PageHead kicker={ready ? `LIVE · ${new Date(model.nowMs).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}` : "LIVE"} title={`Welcome back, ${admin.name.split(" ")[0]}`} live />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", padding: 3, borderRadius: 10, background: "rgba(15,23,42,0.044)", border: "1px solid rgba(15,23,42,0.066)" }}>
            {(["7D", "30D", "90D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => set({ range: r, cr: null })}
                style={{
                  height: 30,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: 0,
                  background: !ui.cr && ui.range === r ? "#FFFFFF" : "transparent",
                  color: !ui.cr && ui.range === r ? "#0F172A" : "#64748B",
                  boxShadow: !ui.cr && ui.range === r ? "0 1px 2px rgba(15,23,42,.08)" : "none",
                  font: "500 12.5px var(--hc-mono)",
                  cursor: "pointer",
                  transition: "all .25s",
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <button className="hc-btn" style={{ font: "500 12.5px var(--hc-mono)" }} onClick={() => setCustomOpen((v) => !v)}>
              <Icon name="calendar" size={14} />
              {rangeLabel}
              <Icon name="chevDown" size={14} />
            </button>
            {customOpen ? (
              <>
                <div onClick={() => setCustomOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 14 }} />
                <div style={{ position: "absolute", right: 0, top: 44, zIndex: 15, width: 280, padding: 14, borderRadius: 16, background: "rgba(255,255,255,.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(15,23,42,0.11)", boxShadow: "0 24px 60px rgba(15,23,42,0.193)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="hc-eyebrow">CUSTOM RANGE</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <label className="hc-field">
                      From
                      <input
                        type="date"
                        className="hc-input"
                        style={{ height: 38, fontSize: 13 }}
                        defaultValue={new Date(range[0]).toISOString().slice(0, 10)}
                        onChange={(e) => {
                          const from = new Date(e.target.value).getTime();
                          set({ cr: [from, range[1]] });
                        }}
                      />
                    </label>
                    <label className="hc-field">
                      To
                      <input
                        type="date"
                        className="hc-input"
                        style={{ height: 38, fontSize: 13 }}
                        defaultValue={new Date(range[1]).toISOString().slice(0, 10)}
                        onChange={(e) => {
                          const to = new Date(e.target.value).getTime() + DAY;
                          set({ cr: [range[0], to] });
                        }}
                      />
                    </label>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        <KpiCard
          icon="users"
          iconBg="rgba(67, 52, 220,.12)"
          iconFg={C.cyan}
          label="Active patients"
          value={fmtInt(cur.patients)}
          sub="vs prior period"
          delta={deltaOf(cur.patients, prev.patients)}
          spark={series.map((p) => p.patients)}
          sparkColor={C.cyan}
          tintBd="rgba(67, 52, 220,.3)"
          tintSh="rgba(67, 52, 220,.45)"
        />
        <KpiCard
          icon="activity"
          iconBg="rgba(16,185,129,.12)"
          iconFg={C.green}
          label="Sessions logged"
          value={fmtInt(cur.sessions)}
          sub="vs prior period"
          delta={deltaOf(cur.sessions, prev.sessions)}
          spark={series.map((p) => p.sessions)}
          sparkColor={C.green}
          tintBd="rgba(16,185,129,.3)"
          tintSh="rgba(16,185,129,.4)"
        />
        <KpiCard
          icon="clock"
          iconBg="rgba(124,58,237,.14)"
          iconFg={C.violet}
          label="Avg session length"
          value={cur.avgDurS != null ? fmtDur(cur.avgDurS) : "—"}
          sub="mean duration"
          delta={deltaOf(cur.avgDurS ?? 0, prev.avgDurS ?? 0)}
          spark={series.map((p) => p.avgDurS ?? 0)}
          sparkColor={C.violet}
          tintBd="rgba(124,58,237,.3)"
          tintSh="rgba(124,58,237,.35)"
        />
        <KpiCard
          icon="database"
          iconBg="rgba(217,119,6,.12)"
          iconFg={C.amber}
          label="Samples logged"
          value={fmtCompact(cur.rows)}
          sub="pressure + IMU rows"
          delta={deltaOf(cur.rows, prev.rows)}
          spark={series.map((p) => p.rows)}
          sparkColor={C.amber}
          tintBd="rgba(217,119,6,.3)"
          tintSh="rgba(217,119,6,.35)"
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch" }}>
        <div className="hc-card" style={{ flex: "2 1 600px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 className="hc-h3">Sessions &amp; samples</h3>
              <span className="hc-sub">Daily session count against pressure/IMU rows logged</span>
            </div>
            <div style={{ display: "flex", gap: 22 }}>
              <Legend color={C.cyan} label="Sessions" value={fmtInt(cur.sessions)} />
              <Legend color={C.green} label="Samples" value={fmtCompact(cur.rows)} />
            </div>
          </div>
          <div style={{ position: "relative", height: 260 }}>
            <DualLines a={lineA} b={lineB} seriesKey={`${days}-${range[0]}`} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginTop: -8 }}>
            {[0, Math.floor(series.length / 2), series.length - 1].map((i) => (
              <span key={i} style={{ font: "400 11px var(--hc-mono)", color: "#8A94A6" }}>
                {series[i]?.label}
              </span>
            ))}
          </div>
        </div>

        <div className="hc-card" style={{ flex: "1 1 320px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LiveDot />
              <h3 className="hc-h3">Latest sessions</h3>
            </div>
            <span style={{ font: "600 12px var(--hc-mono)", color: C.cyan, padding: "3px 9px", borderRadius: 999, background: "rgba(67, 52, 220,.12)" }}>{latest.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {latest.map((s: DSession) => (
              <button
                key={s.id}
                onClick={() => set({ drawer: s.id })}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, margin: "0 -12px", borderRadius: 14, border: 0, background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer", transition: "background .25s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.044)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: `oklch(0.92 0.06 ${s.hue})`, display: "flex", alignItems: "center", justifyContent: "center", font: "600 12px var(--hc-sans)" }}>{s.initials}</span>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{s.patient}</span>
                  <span style={{ fontSize: 12.5, color: "#5B6577", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.tester} · {s.device}
                  </span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flex: "none" }}>
                  <span style={{ font: "500 11px var(--hc-mono)", color: "#5B6577" }}>{s.code}</span>
                  <span style={{ fontSize: 11.5, color: "#64748B" }}>{fmtDur(s.durS)}</span>
                </span>
              </button>
            ))}
            {latest.length === 0 ? <div style={{ padding: "30px 0", textAlign: "center", color: "#64748B", fontSize: 14 }}>No sessions logged yet.</div> : null}
          </div>
          <button className="hc-btn" style={{ marginTop: "auto", justifyContent: "center" }} onClick={() => go("/sessions")}>
            View all sessions
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="hc-card" style={{ flex: "1 1 340px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3 className="hc-h3">Sessions by device</h3>
            <span className="hc-sub">Where sessions were logged from</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 180, height: 180, flex: "none" }}>
              <Donut values={deviceCounts} colors={[C.cyan, C.green, C.violet, C.amber]} hover={hoverDonut} onHover={setHoverDonut} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ pointerEvents: "auto" }}>
                  <SecureValue value={fmtInt(model.sessions.length)} fontSize={30} weight={600} />
                </span>
                <span style={{ fontSize: 12, color: "#5B6577" }}>sessions</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 6 }}>
              {model.devices.map((d, i) => {
                const n = deviceCounts[i];
                const pct = model.sessions.length ? Math.round((n / model.sessions.length) * 100) : 0;
                const color = [C.cyan, C.green, C.violet, C.amber][i % 4];
                return (
                  <div
                    key={d}
                    onMouseEnter={() => setHoverDonut(i)}
                    onMouseLeave={() => setHoverDonut(null)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: hoverDonut === i ? "rgba(15,23,42,0.044)" : "transparent", transition: "background .2s" }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color, boxShadow: `0 0 10px ${color}` }} />
                    <span style={{ flex: 1, fontSize: 13.5, color: "#334155" }}>{d}</span>
                    <span style={{ font: "500 13px var(--hc-mono)" }}>{pct}%</span>
                  </div>
                );
              })}
              {model.devices.length === 0 ? <span style={{ fontSize: 13, color: "#64748B" }}>No sessions yet.</span> : null}
            </div>
          </div>
        </div>

        <div className="hc-card" style={{ flex: "2 1 560px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 className="hc-h3">Sessions per tester</h3>
              <span className="hc-sub">Most active testers, all time</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, testerBars.length)},minmax(0,1fr))`, gap: 14, alignItems: "end", height: 200, borderBottom: "1px solid rgba(15,23,42,0.066)", paddingBottom: 2 }}>
            {testerBars.map((t) => (
              <div key={t.id} title={`${t.name} · ${t.sessions.length} sessions`} style={{ height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", transition: "transform .3s cubic-bezier(.2,.8,.2,1)" }}>
                <div style={{ width: "44%", maxWidth: 36, height: `${Math.max(4, (t.sessions.length / maxTesterSessions) * 100)}%`, borderRadius: "7px 7px 3px 3px", background: `linear-gradient(180deg,${C.cyan},rgba(67, 52, 220,.25))`, boxShadow: `0 0 18px -4px rgba(67, 52, 220,.6)`, transition: "height .7s cubic-bezier(.2,.8,.2,1)" }} />
              </div>
            ))}
            {testerBars.length === 0 ? <span style={{ fontSize: 13, color: "#64748B", alignSelf: "center", justifySelf: "center" }}>No testers yet.</span> : null}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, testerBars.length)},minmax(0,1fr))`, gap: 14, marginTop: -6 }}>
            {testerBars.map((t) => (
              <div key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{t.name}</span>
                <span style={{ font: "400 11.5px var(--hc-mono)", color: "#64748B" }}>{t.sessions.length} sessions</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5B6577" }}>
        <span style={{ width: 10, height: 3, borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}` }} />
        {label}
      </span>
      <SecureValue value={value} fontSize={18} weight={600} />
    </div>
  );
}
