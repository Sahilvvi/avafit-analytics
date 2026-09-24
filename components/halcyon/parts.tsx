"use client";

import type { DPatient } from "@/lib/halcyon/types";

export function profileEntries(p: DPatient): [string, string][] {
  const out: [string, string][] = [];
  if (p.grid) out.push(["Sensor grid", p.grid]);
  if (p.mapping) out.push(["Mapping method", p.mapping]);
  if (p.maxKpa != null) out.push(["Max pressure", `${p.maxKpa} ${p.unit || "kPa"}`]);
  if (p.sampleHz != null) out.push(["Sample rate", `${p.sampleHz} Hz`]);
  if (p.devices.length) out.push(["Devices", p.devices.join(", ")]);
  return out;
}

export function SensorProfile({ patient, cols = 2 }: { patient: DPatient | undefined; cols?: number }) {
  const rows = patient ? profileEntries(patient) : [];
  if (!rows.length) return <span style={{ fontSize: 13, color: "#64748B" }}>No sensor profile saved for this patient.</span>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap: "14px 18px" }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <span className="hc-eyebrow">{k.toUpperCase()}</span>
          <span style={{ fontSize: 14, fontWeight: 500, overflowWrap: "anywhere" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export const RAW_NOTE = "Per-sample pressure and IMU readings stay on the device and aren't stored in Supabase yet.";
