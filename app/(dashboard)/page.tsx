"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { Avatar, LiveDot, StatusPill } from "@/components/halcyon/ui";
import { AnimatedNumber } from "@/components/halcyon/AnimatedNumber";
import { Spark, DualLines, Donut } from "@/components/halcyon/charts";
import { dailySeries, deltaOf, windowStats } from "@/lib/halcyon/derive";
import { agoLabel, fmtCompact, fmtDur, fmtInt, C } from "@/lib/halcyon/format";
import type { DSession } from "@/lib/halcyon/types";

const RANGE_DAYS: Record<string, number> = { "7D": 7, "30D": 30, "90D": 90 };
const DAY = 864e5;
const EASE = [0.2, 0.8, 0.2, 1] as const;

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

function Delta({ d }: { d: { text: string; tone: "up" | "down" | "flat" } }) {
  const color = d.tone === "up" ? "#3ECF8E" : d.tone === "down" ? "#F4606C" : "#8C909B";
  const arrow = d.tone === "up" ? "↗" : d.tone === "down" ? "↘" : "→";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "500 11.5px var(--hc-mono)", color }}>
      <span>{arrow}</span>
      {d.text}
    </span>
  );
}

function Metric({
  label,
  rawValue,
  format,
  delta,
  spark,
  color,
}: {
  label: string;
  rawValue: number | null;
  format: (n: number) => string;
  delta: { text: string; tone: "up" | "down" | "flat" };
  spark: number[];
  color: string;
}) {
  // Left + top hairlines on every cell; the container's overflow:hidden
  // clips the ones on the outer edge, so dividers stay right at any wrap.
  return (
    <motion.div
      variants={rise}
      style={{ minWidth: 0, padding: "20px 22px 16px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "-1px 0 0 rgba(255,255,255,0.06), 0 -1px 0 rgba(255,255,255,0.06)" }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#8C909B" }}>
        <span style={{ width: 6, height: 6, borderRadius: 2, background: color }} />
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums", color: "#F4F5F8", lineHeight: 1 }}>
          {rawValue == null ? "—" : <AnimatedNumber value={rawValue} format={format} />}
        </span>
        <Delta d={delta} />
      </div>
      <div style={{ height: 34, marginTop: 2 }}>
        <Spark data={spark} color={color} />
      </div>
    </motion.div>
  );
}

function RangeControl({ value, custom, onPick }: { value: string; custom: boolean; onPick: (r: "7D" | "30D" | "90D") => void }) {
  return (
    <div style={{ position: "relative", display: "flex", padding: 3, borderRadius: 10, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}>
      {(["7D", "30D", "90D"] as const).map((r) => {
        const on = !custom && value === r;
        return (
          <button
            key={r}
            onClick={() => onPick(r)}
            style={{ position: "relative", height: 28, padding: "0 13px", borderRadius: 7, border: 0, background: "transparent", color: on ? "#EDEEF2" : "#6B6F7B", font: "500 11.5px var(--hc-mono)", cursor: "pointer", transition: "color .25s" }}
          >
            {on ? (
              <motion.span
                layoutId="range-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                style={{ position: "absolute", inset: 0, borderRadius: 7, background: "rgba(255,255,255,0.09)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px -2px rgba(0,0,0,0.6)" }}
              />
            ) : null}
            <span style={{ position: "relative" }}>{r}</span>
          </button>
        );
      })}
    </div>
  );
}

function CardHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h3 className="hc-h3">{title}</h3>
        {sub ? <span className="hc-sub">{sub}</span> : null}
      </div>
      {right}
    </div>
  );
}

export default function OverviewPage() {
  const { model, ui, set, go, ready } = useDash();
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
  const testerBars = [...model.testers].sort((a, b) => b.sessions.length - a.sessions.length).slice(0, 6);
  const maxTesterSessions = Math.max(1, ...testerBars.map((t) => t.sessions.length));

  const latest = model.sessions.slice(0, 6);
  const rangeLabel = ui.cr ? `${new Date(ui.cr[0]).toLocaleDateString()} – ${new Date(ui.cr[1]).toLocaleDateString()}` : "Custom";
  const dateLine = ready ? new Date(model.nowMs).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : "";

  return (
    <motion.div className="hc-page" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
      <motion.div variants={rise} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="hc-kicker" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LiveDot size={6} />
            Live{dateLine ? ` · ${dateLine}` : ""}
          </span>
          <h1 className="hc-h1">Overview</h1>
          <span style={{ fontSize: 13.5, color: "#8C909B" }}>
            {fmtInt(model.patients.length)} patients · {fmtInt(model.sessions.length)} sessions · {fmtInt(model.testers.length)} testers
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <RangeControl value={ui.range} custom={!!ui.cr} onPick={(r) => set({ range: r, cr: null })} />
          <div style={{ position: "relative" }}>
            <button className="hc-btn" style={{ font: "500 11.5px var(--hc-mono)", height: 36, color: ui.cr ? "#EDEEF2" : "#8C909B" }} onClick={() => setCustomOpen((v) => !v)}>
              <Icon name="calendar" size={14} />
              {rangeLabel}
              <Icon name="chevDown" size={13} />
            </button>
            {customOpen ? (
              <>
                <div onClick={() => setCustomOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 14 }} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  style={{ position: "absolute", right: 0, top: 44, zIndex: 15, width: 280, padding: 14, borderRadius: 14, background: "rgba(17,18,23,.86)", backdropFilter: "blur(24px) saturate(150%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <span className="hc-eyebrow">Custom range</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <label className="hc-field">
                      From
                      <input
                        type="date"
                        className="hc-input"
                        style={{ height: 36, fontSize: 12.5 }}
                        defaultValue={new Date(range[0]).toISOString().slice(0, 10)}
                        onChange={(e) => set({ cr: [new Date(e.target.value).getTime(), range[1]] })}
                      />
                    </label>
                    <label className="hc-field">
                      To
                      <input
                        type="date"
                        className="hc-input"
                        style={{ height: 36, fontSize: 12.5 }}
                        defaultValue={new Date(range[1]).toISOString().slice(0, 10)}
                        onChange={(e) => set({ cr: [range[0], new Date(e.target.value).getTime() + DAY] })}
                      />
                    </label>
                  </div>
                </motion.div>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>

      <motion.div variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="hc-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", overflow: "hidden" }}>
        <Metric label="Active patients" rawValue={cur.patients} format={fmtInt} delta={deltaOf(cur.patients, prev.patients)} spark={series.map((p) => p.patients)} color={C.cyan} />
        <Metric label="Sessions logged" rawValue={cur.sessions} format={fmtInt} delta={deltaOf(cur.sessions, prev.sessions)} spark={series.map((p) => p.sessions)} color={C.green} />
        <Metric label="Avg session length" rawValue={cur.avgDurS ?? null} format={fmtDur} delta={deltaOf(cur.avgDurS ?? 0, prev.avgDurS ?? 0)} spark={series.map((p) => p.avgDurS ?? 0)} color={C.violet} />
        <Metric label="Samples logged" rawValue={cur.rows} format={fmtCompact} delta={deltaOf(cur.rows, prev.rows)} spark={series.map((p) => p.rows)} color={C.amber} />
      </motion.div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch" }}>
        <motion.div variants={rise} className="hc-card" style={{ flex: "2 1 600px", minWidth: 0, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <CardHead
            title="Sessions & samples"
            sub="Daily sessions against pressure / IMU rows logged"
            right={
              <div style={{ display: "flex", gap: 22 }}>
                <Legend color={C.cyan} label="Sessions" value={fmtInt(cur.sessions)} />
                <Legend color={C.green} label="Samples" value={fmtCompact(cur.rows)} />
              </div>
            }
          />
          <div style={{ position: "relative", height: 250 }}>
            <DualLines a={lineA} b={lineB} seriesKey={`${days}-${range[0]}`} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginTop: -8 }}>
            {[0, Math.floor(series.length / 2), series.length - 1].map((i) => (
              <span key={i} style={{ font: "400 10.5px var(--hc-mono)", color: "#5E626D" }}>
                {series[i]?.label}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div variants={rise} className="hc-card" style={{ flex: "1 1 320px", minWidth: 0, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <CardHead title="Latest sessions" right={<span style={{ font: "500 11px var(--hc-mono)", color: "#8C909B" }}>{latest.length} recent</span>} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {latest.map((s: DSession, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05, duration: 0.4, ease: EASE }}
                onClick={() => set({ drawer: s.id })}
                className="hc-hover-55"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", margin: "0 -10px", borderRadius: 10, border: 0, background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer", transition: "background .2s" }}
              >
                <Avatar hue={s.hue} initials={s.initials} size={32} fs={11} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "#EDEEF2" }}>{s.patient}</span>
                  <span style={{ fontSize: 12, color: "#6B6F7B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.tester} · {s.device} · {agoLabel(s.startMs, model.nowMs)}
                  </span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flex: "none" }}>
                  <span style={{ font: "500 12px var(--hc-mono)", color: "#C3C6CF" }}>{fmtDur(s.durS)}</span>
                  <StatusPill status={s.status} pulse={s.status === "Live"} />
                </span>
              </motion.button>
            ))}
            {latest.length === 0 ? <div style={{ padding: "30px 0", textAlign: "center", color: "#5E626D", fontSize: 13 }}>No sessions logged yet.</div> : null}
          </div>
          <button className="hc-btn" style={{ marginTop: "auto", justifyContent: "center" }} onClick={() => go("/sessions")}>
            View all sessions
            <Icon name="arrowRight" size={14} />
          </button>
        </motion.div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <motion.div variants={rise} className="hc-card" style={{ flex: "1 1 340px", minWidth: 0, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <CardHead title="Sessions by device" sub="Where sessions were logged from" />
          <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 170, height: 170, flex: "none" }}>
              <Donut values={deviceCounts} colors={[C.cyan, C.green, C.violet, C.amber]} hover={hoverDonut} onHover={setHoverDonut} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.04em", fontVariantNumeric: "tabular-nums" }}>{fmtInt(model.sessions.length)}</span>
                <span style={{ fontSize: 11.5, color: "#6B6F7B" }}>sessions</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 4 }}>
              {model.devices.map((d, i) => {
                const n = deviceCounts[i];
                const pct = model.sessions.length ? Math.round((n / model.sessions.length) * 100) : 0;
                const color = [C.cyan, C.green, C.violet, C.amber][i % 4];
                return (
                  <div
                    key={d}
                    onMouseEnter={() => setHoverDonut(i)}
                    onMouseLeave={() => setHoverDonut(null)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, background: hoverDonut === i ? "rgba(255,255,255,0.045)" : "transparent", transition: "background .2s" }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    <span style={{ flex: 1, fontSize: 13, color: "#C3C6CF" }}>{d}</span>
                    <span style={{ font: "500 12px var(--hc-mono)", color: "#8C909B" }}>{fmtInt(n)}</span>
                    <span style={{ font: "500 12px var(--hc-mono)", width: 40, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
              {model.devices.length === 0 ? <span style={{ fontSize: 13, color: "#5E626D" }}>No sessions yet.</span> : null}
            </div>
          </div>
        </motion.div>

        <motion.div variants={rise} className="hc-card" style={{ flex: "2 1 560px", minWidth: 0, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <CardHead title="Sessions per tester" sub="Most active testers, all time" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {testerBars.map((t, i) => {
              const pct = (t.sessions.length / maxTesterSessions) * 100;
              return (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "minmax(110px,180px) 1fr 44px", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, color: "#C3C6CF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(t.sessions.length ? 3 : 0, pct)}%` }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.9, ease: EASE }}
                      style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, rgba(128,131,255,0.55), #9A9CFF)" }}
                    />
                  </div>
                  <span style={{ font: "500 12px var(--hc-mono)", color: "#EDEEF2", textAlign: "right" }}>{t.sessions.length}</span>
                </div>
              );
            })}
            {testerBars.length === 0 ? <span style={{ fontSize: 13, color: "#5E626D" }}>No testers yet.</span> : null}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#8C909B" }}>
        <span style={{ width: 10, height: 2, borderRadius: 2, background: color }} />
        {label}
      </span>
      <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
