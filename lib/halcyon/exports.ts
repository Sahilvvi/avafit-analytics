import type { Model } from "./types";

const iso = (ms: number | null) => (ms == null ? "" : new Date(ms).toISOString());

export function patientRows(model: Model): unknown[][] {
  return [
    ["Code", "Name", "Side", "Tester", "Sessions", "Total time (s)", "Samples", "Status", "Last session"],
    ...model.patients.map((p) => [p.code, p.name, p.side ?? "", p.tester, p.sessions.length, Math.round(p.totalS), p.rows, p.status, iso(p.lastMs)]),
  ];
}

export function sessionRows(model: Model): unknown[][] {
  return [
    ["Session", "Patient", "Patient code", "Device", "Tester", "Duration (s)", "Samples", "Status", "Started"],
    ...model.sessions.map((s) => [
      s.code,
      s.patient,
      model.patientById.get(s.pid)?.code ?? "",
      s.device,
      s.tester,
      s.durS == null ? "" : Math.round(s.durS),
      s.rows ?? "",
      s.status,
      iso(s.startMs),
    ]),
  ];
}
