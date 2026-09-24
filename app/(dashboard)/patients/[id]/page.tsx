"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/components/halcyon/icons";
import { useDash } from "@/components/halcyon/store";
import { Avatar, EmptyRow, Notes, StatusPill, STATUS_HINT } from "@/components/halcyon/ui";
import { SensorProfile } from "@/components/halcyon/parts";
import { weeklyCounts, patientNotes } from "@/lib/halcyon/derive";
import { agoLabel, fmtDur, fmtInt, whenLabel, C } from "@/lib/halcyon/format";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const { model, go, set, nowMs, prefs } = useDash();
  const patient = model.patientById.get(params.id);
  const wk = useMemo(() => (patient ? weeklyCounts(patient.sessions, nowMs, 10) : []), [patient, nowMs]);
  const maxWk = Math.max(1, ...wk);

  if (!patient) {
    return (
      <div className="hc-page">
        <button className="hc-back" onClick={() => go("/patients")}>
          <Icon name="arrowLeft" size={15} />
          Patients
        </button>
        <EmptyRow>Patient not found — it may have been removed.</EmptyRow>
      </div>
    );
  }

  const notes = patientNotes(patient, nowMs);

  return (
    <div className="hc-page">
      <button className="hc-back" onClick={() => go("/patients")}>
        <Icon name="arrowLeft" size={15} />
        Patients
      </button>

      <div className="hc-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
        <div className="hc-mesh-a" style={{ width: 360, height: 360, right: -120, top: -200, background: "radial-gradient(circle,rgba(10,165,194,.12),transparent 65%)" }} />
        <Avatar hue={patient.hue} initials={patient.initials} size={72} fs={22} />
        <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.03em" }}>{patient.name}</h1>
            <StatusPill status={patient.status} title={STATUS_HINT[patient.status]} />
          </div>
          <span style={{ fontSize: 14, color: "#5B6577" }}>
            <span className="hc-mono">{patient.code}</span>
            {patient.side ? ` · ${patient.side}` : ""} · Tester {patient.tester}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        <Stat label="Sessions" value={fmtInt(patient.sessions.length)} />
        <Stat label="Total time" value={fmtDur(patient.totalS)} />
        <Stat label="Samples logged" value={fmtInt(patient.rows)} />
        <Stat label="Last session" value={agoLabel(patient.lastMs, nowMs)} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: "2 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="hc-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 className="hc-h3">Sessions per week</h3>
              <span className="hc-eyebrow">10 WEEKS</span>
            </div>
            <div style={{ height: 96, display: "flex", alignItems: "flex-end", gap: 4 }}>
              {wk.map((v, i) => (
                <div key={i} title={`${v} session${v === 1 ? "" : "s"}`} style={{ flex: 1, height: `${Math.max(4, (v / maxWk) * 100)}%`, borderRadius: "6px 6px 2px 2px", background: v ? `linear-gradient(180deg,${C.cyan},rgba(10,165,194,.3))` : "rgba(15,23,42,.08)" }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", font: "400 11px var(--hc-mono)", color: "#8A94A6" }}>
              <span>10 weeks ago</span>
              <span>This week</span>
            </div>
          </div>

          <div className="hc-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="hc-h3">Sessions</h3>
              <span className="hc-eyebrow">CLICK A ROW FOR DETAILS</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 640 }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,1.4fr) minmax(110px,1fr) minmax(90px,1fr) 90px 130px", gap: 12, padding: "10px 24px", borderBottom: "1px solid rgba(15,23,42,0.066)" }} className="hc-eyebrow">
                  <span>SESSION</span>
                  <span>STARTED</span>
                  <span>DEVICE</span>
                  <span>SAMPLES</span>
                  <span>STATUS</span>
                </div>
                {patient.sessions.map((s) => (
                  <div key={s.id} onClick={() => set({ drawer: s.id })} className="hc-row" style={{ display: "grid", gridTemplateColumns: "minmax(150px,1.4fr) minmax(110px,1fr) minmax(90px,1fr) 90px 130px", gap: 12, padding: "0 24px", height: prefs.compact ? 42 : 54, alignItems: "center", borderBottom: "1px solid rgba(15,23,42,0.055)" }}>
                    <span title={s.code} style={{ font: "500 12.5px var(--hc-mono)", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.code}</span>
                    <span style={{ fontSize: 13, color: "#334155" }}>{whenLabel(s.startMs, nowMs)}</span>
                    <span style={{ fontSize: 13, color: "#5B6577" }}>{s.device}</span>
                    <span style={{ font: "500 13px var(--hc-mono)" }}>{fmtInt(s.rows)}</span>
                    <StatusPill status={s.status} pulse={s.status === "Live"} />
                  </div>
                ))}
                {patient.sessions.length === 0 ? <EmptyRow>No sessions logged for this patient yet.</EmptyRow> : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="hc-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="hc-eyebrow">SENSOR PROFILE</span>
            <SensorProfile patient={patient} />
          </div>
          <div className="hc-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="hc-eyebrow">TESTER</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar hue={patient.hue} initials={patient.tester.slice(0, 2).toUpperCase()} size={38} fs={12} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{patient.tester}</span>
                <span style={{ fontSize: 12.5, color: "#64748B" }}>Owns this patient profile</span>
              </div>
            </div>
          </div>
          <div className="hc-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="hc-eyebrow">NOTES</span>
            <Notes notes={notes} />
            {notes.length === 0 ? <span style={{ fontSize: 13, color: "#64748B" }}>No notes yet.</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hc-tile hc-tile-lift" style={{ padding: "16px 18px" }}>
      <span style={{ fontSize: 12.5, color: "#5B6577" }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );
}
