/**
 * Dashboard view-model types. Every field here is either read straight from
 * Supabase or is a plain aggregate (count / sum / average) of those fields —
 * nothing is invented.
 */

/** Trimmed, JSON-serialisable snapshot the server hands to the client. */
export interface RawPatient {
  id: string;
  owner_id: string;
  name: string | null;
  patient_code: string | null;
  side: string | null;
  notes: string | null;
  grid_rows: number | null;
  grid_cols: number | null;
  mapping_method: string | null;
  max_kpa: number | null;
  sample_hz: number | null;
  pressure_unit: string | null;
  device_names: string[] | null;
  created_at: string | null;
}

export interface RawSession {
  id: string | null;
  patient_id: string;
  owner_id: string;
  session_code: string | null;
  source_device: string | null;
  start_ms: number | null;
  end_ms: number | null;
  duration_s: number | null;
  row_count: number | null;
  notes: string | null;
  created_at: string | null;
}

export interface RawUser {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export interface RawSnapshot {
  nowMs: number;
  patients: RawPatient[];
  sessions: RawSession[];
  users: RawUser[];
}

export interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type SessionStatus = "Live" | "Completed";
export type PatientStatus = "Active" | "Idle";

export interface DSession {
  /** Route key — Supabase id, or a stable composite when the row has none. */
  id: string;
  code: string;
  pid: string;
  patient: string;
  initials: string;
  hue: number;
  ownerId: string;
  tester: string;
  device: string;
  durS: number | null;
  rows: number | null;
  startMs: number | null;
  endMs: number | null;
  status: SessionStatus;
  note: string;
}

export interface DPatient {
  id: string;
  code: string;
  name: string;
  initials: string;
  hue: number;
  side: string | null;
  ownerId: string;
  tester: string;
  notes: string;
  grid: string | null;
  mapping: string | null;
  maxKpa: number | null;
  sampleHz: number | null;
  unit: string | null;
  devices: string[];
  createdMs: number | null;
  /** Newest first. */
  sessions: DSession[];
  totalS: number;
  rows: number;
  lastMs: number | null;
  status: PatientStatus;
}

export interface DTester {
  id: string;
  name: string;
  email: string;
  initials: string;
  hue: number;
  joinedMs: number | null;
  lastSignInMs: number | null;
  verified: boolean;
  sessions: DSession[];
  patients: DPatient[];
  totalS: number;
  rows: number;
  lastMs: number | null;
}

export interface Model {
  nowMs: number;
  patients: DPatient[];
  /** Newest first. */
  sessions: DSession[];
  testers: DTester[];
  patientById: Map<string, DPatient>;
  sessionById: Map<string, DSession>;
  testerById: Map<string, DTester>;
  devices: string[];
}
