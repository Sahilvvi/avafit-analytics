"use client";

import { useMemo } from "react";
import { useDash } from "@/components/halcyon/store";
import { PageHead } from "@/components/halcyon/ui";
import { Spark } from "@/components/halcyon/charts";
import { average, countBy, dailySeries, median } from "@/lib/halcyon/derive";
import { fmtCompact, fmtDur, fmtInt, C } from "@/lib/halcyon/format";

const DUR_BUCKETS: { label: string; max: number }[] = [
  { label: "<1m", max: 60 },
  { label: "1-5m", max: 300 },
  { label: "5-15m", max: 900 },
  { label: "15-30m", max: 1800 },
  { label: "30-60m", max: 3600 },
  { label: "60m+", max: Infinity },
];

export default function AnalyticsPage() {
  const { model } = useDash();

  const durs = model.sessions.map((s) => s.durS).filter((n): n is number => n != null);
  const rows = model.sessions.map((s) => s.rows).filter((n): n is number => n != null);
  const iosShare = model.sessions.length ? Math.round((model.sessions.filter((s) => s.device === "iOS").length / model.sessions.length) * 100) : 0;

  const mappingDist = useMemo(() => countBy(model.patients, (p) => p.mapping), [model.patients]);
  const gridDist = useMemo(() => countBy(model.patients, (p) => p.grid), [model.patients]);
  const gridColors = [C.cyan, C.green, C.violet, C.amber, "#DB2777"];

  const hist = useMemo(() => {
    const counts = DUR_BUCKETS.map(() => 0);
    for (const d of durs) {
      const i = DUR_BUCKETS.findIndex((b) => d < b.max);
      counts[i === -1 ? counts.length - 1 : i]++;
    }
    return counts;
  }, [durs]);
  const maxHist = Math.max(1, ...hist);

  const hourly = useMemo(() => {
    const counts = Array(24).fill(0);
    for (const s of model.sessions) {
      if (s.startMs == null) continue;
      counts[new Date(s.startMs).getHours()]++;
    }
    return counts;
  }, [model.sessions]);
  const maxHourly = Math.max(1, ...hourly);

  const series90 = useMemo(() => dailySeries(model, 90), [model]);
  const testerGrowth = useMemo(() => {
    const joined = model.testers.map((t) => t.joinedMs).filter((n): n is number => n != null).sort((a, b) => a - b);
    const today = series90[0]?.ms ?? model.nowMs - 90 * 864e5;
    let before = joined.filter((ms) => ms < today).length;
    return series90.map((p) => {
      const addedToday = joined.filter((ms) => ms >= p.ms && ms < p.ms + 864e5).length;
      before += addedToday;
      return before;
    });
  }, [series90, model.testers, model.nowMs]);

  const maxGrid = Math.max(1, ...gridDist.map(([, n]) => n));

  return (
    <div className="hc-page">
      <PageHead kicker="COHORT ANALYTICS" title="Analytics" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        <StatTile label="Median session length" value={fmtDur(median(durs))} sub={`${durs.length} scored sessions`} />
        <StatTile label="Avg session length" value={fmtDur(average(durs))} sub="mean duration" />
        <StatTile label="iOS share" value={`${iosShare}%`} sub="of all sessions" />
        <StatTile label="Samples / session" value={fmtCompact(average(rows) ?? 0)} sub="mean rows logged" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="hc-card" style={{ flex: "1.3 1 480px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3 className="hc-h3">Sessions by mapping method</h3>
            <span className="hc-sub">Sensor mapping method across patient profiles</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {mappingDist.map(([name, n]) => {
              const pct = model.patients.length ? Math.round((n / model.patients.length) * 100) : 0;
              return (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                    <span>
                      {name} <span style={{ color: "#64748B", fontSize: 12 }}>· {n} patients</span>
                    </span>
                    <span style={{ font: "500 12.5px var(--hc-mono)", color: "#5B6577" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: "rgba(15,23,42,0.055)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 5, background: `linear-gradient(90deg,rgba(67, 52, 220,.5),${C.cyan})`, boxShadow: "0 0 14px rgba(67, 52, 220,.5)", transition: "width .8s cubic-bezier(.2,.8,.2,1)" }} />
                  </div>
                </div>
              );
            })}
            {mappingDist.length === 0 ? <span style={{ fontSize: 13, color: "#64748B" }}>No patient profiles yet.</span> : null}
          </div>
        </div>
        <div className="hc-card" style={{ flex: "1 1 380px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3 className="hc-h3">Session-length distribution</h3>
            <span className="hc-sub">All sessions with a known duration</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 10, alignItems: "end", height: 190, borderBottom: "1px solid rgba(15,23,42,0.066)" }}>
            {hist.map((n, i) => (
              <div key={i} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                <span style={{ font: "500 11.5px var(--hc-mono)", color: "#5B6577" }}>{n}</span>
                <div style={{ width: "100%", height: `${Math.max(4, (n / maxHist) * 100)}%`, borderRadius: "8px 8px 3px 3px", background: n ? C.cyan : "rgba(15,23,42,.08)", transition: "height .7s cubic-bezier(.2,.8,.2,1)" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 10, marginTop: -10 }}>
            {DUR_BUCKETS.map((b) => (
              <span key={b.label} style={{ textAlign: "center", font: "400 11px var(--hc-mono)", color: "#64748B" }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="hc-card" style={{ flex: "2 1 560px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h3 className="hc-h3">Sessions by hour started</h3>
              <span className="hc-sub">All time, local time of day</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(24,minmax(0,1fr))", gap: 4, alignItems: "end", height: 160 }}>
            {hourly.map((n, h) => (
              <div
                key={h}
                title={`${h}:00 · ${n} session${n === 1 ? "" : "s"}`}
                style={{ height: `${Math.max(3, (n / maxHourly) * 100)}%`, borderRadius: "4px 4px 2px 2px", background: n ? C.cyan : "rgba(15,23,42,.08)", boxShadow: n ? "0 0 10px -2px rgba(67, 52, 220,.5)" : "none", transition: "transform .25s,filter .25s" }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", font: "400 11px var(--hc-mono)", color: "#64748B", marginTop: -10 }}>
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>23</span>
          </div>
        </div>
        <div className="hc-card" style={{ flex: "1 1 340px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3 className="hc-h3">Sensor grid sizes</h3>
            <span className="hc-sub">rows × cols across patient profiles</span>
          </div>
          <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", gap: 3 }}>
            {gridDist.map(([, n], i) => (
              <div key={i} style={{ width: `${(n / (model.patients.length || 1)) * 100}%`, background: gridColors[i % gridColors.length], boxShadow: `0 0 12px ${gridColors[i % gridColors.length]}`, transition: "width .8s cubic-bezier(.2,.8,.2,1)" }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {gridDist.map(([label, n], i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4, padding: 12, borderRadius: 12, background: "rgba(15,23,42,0.033)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#5B6577" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: gridColors[i % gridColors.length] }} />
                  {label}
                </span>
                <span style={{ fontSize: 20, fontWeight: 600 }}>{model.patients.length ? Math.round((n / model.patients.length) * 100) : 0}%</span>
              </div>
            ))}
            {gridDist.length === 0 ? <span style={{ fontSize: 13, color: "#64748B" }}>No grid sizes recorded.</span> : null}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="hc-card" style={{ flex: "1 1 420px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3 className="hc-h3">Session volume</h3>
            <span className="hc-sub">Last 90 days</span>
          </div>
          <div style={{ height: 160 }}>
            <Spark data={series90.map((p) => p.sessions)} color={C.cyan} />
          </div>
        </div>
        <div className="hc-card" style={{ flex: "1 1 420px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3 className="hc-h3">Cumulative testers</h3>
            <span className="hc-sub">Running total, last 90 days</span>
          </div>
          <div style={{ height: 160 }}>
            <Spark data={testerGrowth} color={C.green} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="hc-tile hc-tile-lift" style={{ padding: "18px 20px" }}>
      <span style={{ fontSize: 13, color: "#5B6577" }}>{label}</span>
      <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ fontSize: 12, color: "#64748B" }}>{sub}</span>
    </div>
  );
}
