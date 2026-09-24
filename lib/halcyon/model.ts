import type {
  DPatient,
  DSession,
  DTester,
  Model,
  RawPatient,
  RawSession,
  RawSnapshot,
  RawUser,
} from "./types";
import { deviceLabel, hueOf, initialsOf } from "./format";

const DAY_MS = 864e5;
/** A patient with a session in this window is "Active", otherwise "Idle". */
export const ACTIVE_WINDOW_DAYS = 30;
/** A session with no end time counts as "Live" only if it started this recently. */
export const LIVE_WINDOW_MS = 6 * 3600 * 1000;

const toMs = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  const ms = typeof v === "number" ? v : new Date(v).getTime();
  return Number.isFinite(ms) ? ms : null;
};

function testerName(u: RawUser): string {
  return u.full_name?.trim() || (u.email ? u.email.split("@")[0] : "") || u.id.slice(0, 8);
}

function patientName(p: RawPatient): string {
  return p.name?.trim() || p.patient_code?.trim() || p.id.slice(0, 8);
}

export function buildModel(raw: RawSnapshot): Model {
  const now = raw.nowMs;

  const userById = new Map<string, RawUser>(raw.users.map((u) => [u.id, u]));
  const nameOfOwner = (id: string) => {
    const u = userById.get(id);
    return u ? testerName(u) : "Unknown tester";
  };

  const patients: DPatient[] = raw.patients.map((p: RawPatient) => {
    const name = patientName(p);
    return {
      id: p.id,
      code: p.patient_code?.trim() || p.id.slice(0, 8),
      name,
      initials: initialsOf(name),
      hue: hueOf(p.id),
      side: p.side?.trim() || null,
      ownerId: p.owner_id,
      tester: nameOfOwner(p.owner_id),
      notes: p.notes?.trim() || "",
      grid: p.grid_rows && p.grid_cols ? `${p.grid_rows}×${p.grid_cols}` : null,
      mapping: p.mapping_method || null,
      maxKpa: p.max_kpa ?? null,
      sampleHz: p.sample_hz ?? null,
      unit: p.pressure_unit || null,
      devices: p.device_names ?? [],
      createdMs: toMs(p.created_at),
      sessions: [],
      totalS: 0,
      rows: 0,
      lastMs: null,
      status: "Idle",
    };
  });
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const sessions: DSession[] = raw.sessions.map((s: RawSession, i: number) => {
    const startMs = toMs(s.start_ms) ?? toMs(s.created_at);
    const endMs = toMs(s.end_ms);
    const durS =
      typeof s.duration_s === "number"
        ? s.duration_s
        : startMs != null && endMs != null
          ? Math.max(0, (endMs - startMs) / 1000)
          : null;
    const p = patientById.get(s.patient_id);
    const key = s.id ?? `${s.patient_id}-${startMs ?? i}`;
    const live = endMs == null && s.duration_s == null && startMs != null && now - startMs < LIVE_WINDOW_MS;
    return {
      id: String(key),
      code: s.session_code?.trim() || `SES-${String(key).replace(/-/g, "").slice(0, 6).toUpperCase()}`,
      pid: s.patient_id,
      patient: p?.name ?? "Unknown patient",
      initials: p?.initials ?? "?",
      hue: p?.hue ?? 200,
      ownerId: s.owner_id,
      tester: nameOfOwner(s.owner_id),
      device: deviceLabel(s.source_device),
      durS,
      rows: typeof s.row_count === "number" ? s.row_count : null,
      startMs,
      endMs,
      status: live ? "Live" : "Completed",
      note: s.notes?.trim() || "",
    };
  });
  sessions.sort((a, b) => (b.startMs ?? 0) - (a.startMs ?? 0));

  for (const s of sessions) patientById.get(s.pid)?.sessions.push(s);
  for (const p of patients) {
    p.totalS = p.sessions.reduce((a, s) => a + (s.durS ?? 0), 0);
    p.rows = p.sessions.reduce((a, s) => a + (s.rows ?? 0), 0);
    p.lastMs = p.sessions[0]?.startMs ?? null;
    p.status = p.lastMs != null && now - p.lastMs <= ACTIVE_WINDOW_DAYS * DAY_MS ? "Active" : "Idle";
  }

  const testers: DTester[] = raw.users.map((u) => {
    const name = testerName(u);
    const own = sessions.filter((s) => s.ownerId === u.id);
    return {
      id: u.id,
      name,
      email: u.email ?? "",
      initials: initialsOf(name),
      hue: hueOf(u.id),
      joinedMs: toMs(u.created_at),
      lastSignInMs: toMs(u.last_sign_in_at),
      verified: !!u.email_confirmed_at,
      sessions: own,
      patients: patients.filter((p) => p.ownerId === u.id),
      totalS: own.reduce((a, s) => a + (s.durS ?? 0), 0),
      rows: own.reduce((a, s) => a + (s.rows ?? 0), 0),
      lastMs: own[0]?.startMs ?? null,
    };
  });
  testers.sort((a, b) => b.sessions.length - a.sessions.length || (b.joinedMs ?? 0) - (a.joinedMs ?? 0));

  const devices = Array.from(new Set(sessions.map((s) => s.device)));

  return {
    nowMs: now,
    patients,
    sessions,
    testers,
    patientById,
    sessionById: new Map(sessions.map((s) => [s.id, s])),
    testerById: new Map(testers.map((t) => [t.id, t])),
    devices,
  };
}

/** Server-side: strips rows down to the fields the dashboard actually renders. */
export function toSnapshot(
  patients: {
    id: string;
    owner_id: string;
    name?: string | null;
    patient_code?: string | null;
    side?: string | null;
    notes?: string | null;
    grid_rows?: number | null;
    grid_cols?: number | null;
    mapping_method?: string | null;
    max_kpa?: number | null;
    sample_hz?: number | null;
    pressure_unit?: string | null;
    device_names?: string[] | null;
    created_at?: string | null;
  }[],
  sessions: {
    id?: string;
    patient_id: string;
    owner_id: string;
    session_code?: string | null;
    source_device?: string | null;
    start_ms?: number | null;
    end_ms?: number | null;
    duration_s?: number | null;
    row_count?: number | null;
    notes?: string | null;
    created_at?: string | null;
  }[],
  users: {
    id: string;
    email?: string | null;
    created_at: string;
    last_sign_in_at?: string | null;
    email_confirmed_at?: string | null;
    user_metadata?: { full_name?: string; [k: string]: unknown };
  }[],
  nowMs: number
): RawSnapshot {
  return {
    nowMs,
    patients: patients.map((p) => ({
      id: p.id,
      owner_id: p.owner_id,
      name: p.name ?? null,
      patient_code: p.patient_code ?? null,
      side: p.side ?? null,
      notes: p.notes ?? null,
      grid_rows: p.grid_rows ?? null,
      grid_cols: p.grid_cols ?? null,
      mapping_method: p.mapping_method ?? null,
      max_kpa: p.max_kpa ?? null,
      sample_hz: p.sample_hz ?? null,
      pressure_unit: p.pressure_unit ?? null,
      device_names: p.device_names ?? null,
      created_at: p.created_at ?? null,
    })),
    sessions: sessions.map((s) => ({
      id: s.id ?? null,
      patient_id: s.patient_id,
      owner_id: s.owner_id,
      session_code: s.session_code ?? null,
      source_device: s.source_device ?? null,
      start_ms: s.start_ms ?? null,
      end_ms: s.end_ms ?? null,
      duration_s: s.duration_s ?? null,
      row_count: s.row_count ?? null,
      notes: s.notes ?? null,
      created_at: s.created_at ?? null,
    })),
    users: users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      full_name: typeof u.user_metadata?.full_name === "string" ? u.user_metadata.full_name : null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
    })),
  };
}
