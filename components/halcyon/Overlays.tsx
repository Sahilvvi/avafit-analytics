"use client";

import { useMemo, useRef } from "react";
import { Icon } from "./icons";
import { useDash } from "./store";
import { Avatar, Notes, StatusPill, Timeline, sessionLog } from "./ui";
import { RAW_NOTE } from "./parts";
import { agoLabel, fmtDur, fmtInt, whenLabel } from "@/lib/halcyon/format";

/* ------------------------------------------------------------------ drawer */

export function Drawer() {
  const { model, ui, set, go, nowMs } = useDash();
  const session = ui.drawer ? model.sessionById.get(ui.drawer) : undefined;
  const patient = session ? model.patientById.get(session.pid) : undefined;
  const open = !!session;

  const close = () => set({ drawer: null });

  return (
    <>
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(15,23,42,.28)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .35s ease",
        }}
      />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(460px,100vw)",
          background: "rgba(255,255,255,.97)",
          backdropFilter: "blur(30px) saturate(150%)",
          borderLeft: "1px solid rgba(15,23,42,0.088)",
          boxShadow: "-30px 0 80px rgba(15,23,42,0.175)",
          transform: open ? "none" : "translateX(100%)",
          transition: "transform .5s cubic-bezier(.3,.9,.25,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {session ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(15,23,42,0.066)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ font: "600 15px var(--hc-mono)" }}>{session.code}</span>
                <StatusPill status={session.status} pulse={session.status === "Live"} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="hc-iconbtn" title="Open full page" aria-label="Open full page" onClick={() => go(`/sessions/${session.id}`)}>
                  <Icon name="expand" size={15} />
                </button>
                <button className="hc-iconbtn" aria-label="Close" onClick={close}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 24, display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar hue={session.hue} initials={session.initials} size={48} fs={15} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.01em" }}>{session.patient}</span>
                  <span style={{ fontSize: 13, color: "#5B6577" }}>
                    {patient?.code ?? session.pid.slice(0, 8)} · {session.device}
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
                <DrawerStat label="Duration" value={fmtDur(session.durS)} />
                <DrawerStat label="Samples" value={fmtInt(session.rows)} />
                <DrawerStat label="Tester" value={session.tester} small />
                <DrawerStat label="Device" value={session.device} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="hc-eyebrow">RAW TELEMETRY</span>
                <span style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{RAW_NOTE}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span className="hc-eyebrow">SESSION LOG</span>
                <Timeline items={sessionLog(session)} size="sm" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span className="hc-eyebrow">NOTES</span>
                <Notes notes={session.note ? [{ by: session.tester, when: whenLabel(session.startMs, nowMs), text: session.note }] : []} drawer />
                {!session.note ? <span style={{ fontSize: 13, color: "#64748B" }}>No notes yet.</span> : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "18px 24px", borderTop: "1px solid rgba(15,23,42,0.066)" }}>
              <button className="hc-btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => go(`/patients/${session.pid}`)}>
                Open patient record
                <Icon name="arrowUpRight" size={15} />
              </button>
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}

function DrawerStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ padding: 12, borderRadius: 12, background: "rgba(15,23,42,0.044)", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 11.5, color: "#64748B" }}>{label}</span>
      <span style={{ fontSize: small ? 14 : 17, fontWeight: 600, paddingTop: small ? 3 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------ notifications */

interface NotifItem {
  key: string;
  ms: number;
  dot: string;
  title: string;
  sub: string;
  open: () => void;
}

export function useNotifications() {
  const { model, nowMs, notifSeen, go } = useDash();
  const items = useMemo<NotifItem[]>(() => {
    const sessionItems: NotifItem[] = model.sessions.slice(0, 20).map((s) => ({
      key: `s-${s.id}`,
      ms: s.startMs ?? 0,
      dot: s.status === "Live" ? "#10B981" : "#0AA5C2",
      title: `${s.tester} logged a session`,
      sub: `${s.patient} · ${s.device}`,
      open: () => go(`/sessions/${s.id}`),
    }));
    const testerItems: NotifItem[] = model.testers
      .filter((t) => t.joinedMs != null)
      .map((t) => ({
        key: `t-${t.id}`,
        ms: t.joinedMs as number,
        dot: "#7C3AED",
        title: `${t.name} signed up`,
        sub: t.email || "New tester account",
        open: () => go("/testers"),
      }));
    return [...sessionItems, ...testerItems].sort((a, b) => b.ms - a.ms).slice(0, 30);
  }, [model, go]);

  const unread = items.filter((i) => i.ms > notifSeen).length;
  return { items, unread, nowMs };
}

export function Notifications() {
  const { ui, set, markNotifsRead, nowMs } = useDash();
  const { items } = useNotifications();
  if (!ui.notifOpen) return null;

  return (
    <>
      <div onClick={() => set({ notifOpen: false })} style={{ position: "fixed", inset: 0, zIndex: 44 }} />
      <div
        style={{
          position: "fixed",
          top: 62,
          right: 16,
          zIndex: 45,
          width: "min(400px,calc(100vw - 32px))",
          borderRadius: 18,
          background: "rgba(255,255,255,.97)",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(15,23,42,0.11)",
          boxShadow: "0 30px 80px rgba(15,23,42,0.193)",
          overflow: "hidden",
          animation: "hcFadeUp .25s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid rgba(15,23,42,0.077)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600 }}>Notifications</span>
          <button className="hc-linkbtn" style={{ color: "#5B6577" }} onClick={markNotifsRead}>
            Mark all read
          </button>
        </div>
        <div style={{ maxHeight: 420, overflow: "auto", padding: 6 }}>
          {items.map((n) => (
            <button
              key={n.key}
              onClick={() => {
                n.open();
                set({ notifOpen: false });
              }}
              style={{ width: "100%", display: "flex", gap: 12, padding: 12, borderRadius: 12, border: 0, background: "transparent", color: "#0F172A", textAlign: "left", cursor: "pointer", transition: "background .2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(15,23,42,0.055)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 8, height: 8, marginTop: 6, flex: "none", borderRadius: "50%", background: n.dot, boxShadow: `0 0 8px ${n.dot}` }} />
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "500 13.5px var(--hc-sans)" }}>{n.title}</span>
                <span style={{ font: "400 12.5px var(--hc-sans)", color: "#5B6577", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.sub}</span>
              </span>
              <span style={{ font: "400 11.5px var(--hc-sans)", color: "#64748B", whiteSpace: "nowrap" }}>{agoLabel(n.ms, nowMs)}</span>
            </button>
          ))}
          {items.length === 0 ? <div style={{ padding: "40px 12px", textAlign: "center", color: "#64748B", fontSize: 14 }}>Nothing yet.</div> : null}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ palette */

interface PaletteEntry {
  group: string;
  glyph: string;
  label: string;
  sub: string;
  action: () => void;
}

export function Palette() {
  const { ui, set, go, model } = useDash();
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo<PaletteEntry[]>(() => {
    const pages: PaletteEntry[] = [
      { group: "Pages", glyph: "OV", label: "Overview", sub: "Dashboard home", action: () => go("/") },
      { group: "Pages", glyph: "PT", label: "Patients", sub: `${model.patients.length} patients`, action: () => go("/patients") },
      { group: "Pages", glyph: "SS", label: "Sessions", sub: `${model.sessions.length} sessions`, action: () => go("/sessions") },
      { group: "Pages", glyph: "TS", label: "Testers", sub: `${model.testers.length} testers`, action: () => go("/testers") },
      { group: "Pages", glyph: "AN", label: "Analytics", sub: "Cohort trends", action: () => go("/analytics") },
      { group: "Pages", glyph: "RP", label: "Reports", sub: "Exportable summaries", action: () => go("/reports") },
      { group: "Pages", glyph: "ST", label: "Settings", sub: "Profile & team", action: () => go("/settings") },
    ];
    const patients: PaletteEntry[] = model.patients.slice(0, 40).map((p) => ({
      group: "Patients",
      glyph: p.initials,
      label: p.name,
      sub: `${p.code} · ${p.tester}`,
      action: () => go(`/patients/${p.id}`),
    }));
    const sessions: PaletteEntry[] = model.sessions.slice(0, 40).map((s) => ({
      group: "Sessions",
      glyph: s.initials,
      label: s.code,
      sub: `${s.patient} · ${s.device}`,
      action: () => go(`/sessions/${s.id}`),
    }));
    const testers: PaletteEntry[] = model.testers.slice(0, 40).map((t) => ({
      group: "Testers",
      glyph: t.initials,
      label: t.name,
      sub: t.email || "Tester",
      action: () => go("/testers"),
    }));
    return [...pages, ...patients, ...sessions, ...testers];
  }, [model, go]);

  const q = ui.pq.trim().toLowerCase();
  const filtered = q ? entries.filter((e) => `${e.label} ${e.sub} ${e.group}`.toLowerCase().includes(q)).slice(0, 30) : entries.slice(0, 20);

  if (!ui.palette) return null;

  const close = () => set({ palette: false });
  const runAt = (i: number) => {
    const e = filtered[i];
    if (e) {
      e.action();
      close();
    }
  };

  let lastGroup = "";

  return (
    <div
      onClick={close}
      style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(15,23,42,.28)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "12vh 16px 16px", animation: "hcFadeIn .15s both" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(640px,100%)", borderRadius: 20, background: "rgba(255,255,255,.97)", backdropFilter: "blur(30px)", border: "1px solid rgba(15,23,42,0.132)", boxShadow: "0 40px 100px rgba(15,23,42,0.21),0 0 60px -20px rgba(10,165,194,.3)", overflow: "hidden", animation: "hcFadeUp .25s cubic-bezier(.2,.8,.2,1) both" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid rgba(15,23,42,0.077)", color: "#64748B" }}>
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            autoFocus
            value={ui.pq}
            onChange={(e) => set({ pq: e.target.value, pi: 0 })}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                set((s) => ({ pi: Math.min(filtered.length - 1, s.pi + 1) }));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                set((s) => ({ pi: Math.max(0, s.pi - 1) }));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runAt(ui.pi);
              }
            }}
            placeholder="Search pages, patients, sessions or testers"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: "#0F172A", font: "400 16px var(--hc-sans)" }}
          />
          <span style={{ font: "500 11px var(--hc-mono)", padding: "2px 6px", border: "1px solid rgba(15,23,42,0.132)", borderRadius: 5 }}>ESC</span>
        </div>
        <div style={{ maxHeight: "52vh", overflowY: "auto", overflowX: "hidden", padding: 8 }}>
          {filtered.map((e, i) => {
            const showGroup = e.group !== lastGroup;
            lastGroup = e.group;
            const on = i === ui.pi;
            return (
              <div key={`${e.group}-${e.label}-${i}`}>
                {showGroup ? <div style={{ font: "500 11px var(--hc-mono)", color: "#64748B", letterSpacing: ".06em", padding: "10px 12px 6px" }}>{e.group.toUpperCase()}</div> : null}
                <button
                  onMouseEnter={() => set({ pi: i })}
                  onClick={() => runAt(i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 11, border: 0, background: on ? "rgba(10,165,194,.08)" : "transparent", color: "#0F172A", textAlign: "left", cursor: "pointer", transition: "background .15s" }}
                >
                  <span style={{ width: 30, height: 30, flex: "none", borderRadius: 9, background: "rgba(15,23,42,0.066)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px var(--hc-mono)", color: "#5B6577" }}>{e.glyph}</span>
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ font: "500 14px var(--hc-sans)" }}>{e.label}</span>
                    <span style={{ font: "400 12px var(--hc-sans)", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.sub}</span>
                  </span>
                  <span style={{ font: "500 12px var(--hc-mono)", color: "#0AA5C2", opacity: on ? 1 : 0 }}>↵</span>
                </button>
              </div>
            );
          })}
          {filtered.length === 0 ? <div style={{ padding: "40px 12px", textAlign: "center", color: "#64748B", fontSize: 14 }}>No matches for &ldquo;{ui.pq}&rdquo;</div> : null}
        </div>
        <div style={{ display: "flex", gap: 16, padding: "10px 18px", borderTop: "1px solid rgba(15,23,42,0.077)", font: "400 12px var(--hc-sans)", color: "#64748B" }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- toasts */

export function Toasts() {
  const { ui } = useDash();
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 80, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", pointerEvents: "none" }}>
      {ui.toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 380,
            padding: "12px 16px 12px 12px",
            borderRadius: 14,
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(15,23,42,0.11)",
            boxShadow: "0 20px 50px rgba(15,23,42,0.175)",
            fontSize: 13.5,
            animation: "hcFadeUp .35s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              flex: "none",
              borderRadius: "50%",
              background: t.tone === "warn" ? "rgba(217,119,6,.14)" : "rgba(16,185,129,.14)",
              color: t.tone === "warn" ? "#D97706" : "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={t.tone === "warn" ? "alertTriangle" : "check"} size={13} sw={2.6} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
