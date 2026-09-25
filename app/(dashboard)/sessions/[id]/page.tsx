"use client";

import { useParams } from "next/navigation";
import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { Avatar, EmptyRow, Notes, StatusPill, Timeline, sessionLog, STATUS_HINT } from "@/components/halcyon/ui";
import { RAW_NOTE } from "@/components/halcyon/parts";
import { fmtDur, fmtInt, whenLabel } from "@/lib/halcyon/format";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const { model, go, nowMs } = useDash();
  const session = model.sessionById.get(params.id);

  if (!session) {
    return (
      <div className="hc-page">
        <button className="hc-back" onClick={() => go("/sessions")}>
          <Icon name="arrowLeft" size={15} />
          Sessions
        </button>
        <EmptyRow>Session not found — it may have been removed.</EmptyRow>
      </div>
    );
  }

  const patient = model.patientById.get(session.pid);

  return (
    <div className="hc-page">
      <button className="hc-back" onClick={() => go("/sessions")}>
        <Icon name="arrowLeft" size={15} />
        Sessions
      </button>

      <div className="hc-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, font: "600 28px var(--hc-mono)", letterSpacing: "-.02em" }}>{session.code}</h1>
            <StatusPill status={session.status} pulse={session.status === "Live"} title={STATUS_HINT[session.status]} />
          </div>
          <button
            onClick={() => go(`/patients/${session.pid}`)}
            style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 4px 4px", marginLeft: -4, borderRadius: 999, border: 0, background: "transparent", color: "#EDEEF2", cursor: "pointer", transition: "background .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.055)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Avatar hue={session.hue} initials={session.initials} size={30} fs={11} />
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>{session.patient}</span>
            <span style={{ fontSize: 13, color: "#8C909B" }}>
              {patient?.code ?? session.pid.slice(0, 8)} · {whenLabel(session.startMs, nowMs)}
            </span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <Stat label="Duration" value={fmtDur(session.durS)} />
        <Stat label="Samples" value={fmtInt(session.rows)} />
        <Stat label="Device" value={session.device} />
        <Stat label="Tester" value={session.tester} />
        <Stat label="Rows/sec" value={session.durS && session.rows ? (session.rows / session.durS).toFixed(1) : "—"} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <div className="hc-card" style={{ flex: "2 1 520px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 className="hc-h3">Raw telemetry</h3>
          <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.033)", border: "1px dashed rgba(255,255,255,0.14)", fontSize: 13.5, color: "#8C909B", lineHeight: 1.6, display: "flex", gap: 10 }}>
            <Icon name="database" size={16} style={{ flex: "none", marginTop: 2, color: "#8C909B" }} />
            <span>{RAW_NOTE}</span>
          </div>
        </div>
        <div className="hc-card" style={{ flex: "1 1 320px", minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="hc-eyebrow">SESSION LOG</span>
          <Timeline items={sessionLog(session)} />
        </div>
      </div>

      <div className="hc-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 className="hc-h3">Notes</h3>
        <Notes notes={session.note ? [{ by: session.tester, when: whenLabel(session.startMs, nowMs), text: session.note }] : []} />
        {!session.note ? <span style={{ fontSize: 13, color: "#8C909B" }}>No notes yet.</span> : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hc-tile" style={{ padding: "16px 18px" }}>
      <span style={{ fontSize: 12.5, color: "#8C909B" }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );
}
