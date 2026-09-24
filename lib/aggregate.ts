import type { AuthUser, Patient, Session, UserSettings } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toMs(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const ms = typeof value === "number" ? value : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Buckets timestamps into a fixed trailing window of `days`, including empty days (0-filled). */
export function countPerDay(
  timestamps: (number | null)[],
  days: number
): { key: string; label: string; count: number }[] {
  const now = Date.now();
  const start = now - (days - 1) * DAY_MS;
  const buckets = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const key = dayKey(start + i * DAY_MS);
    buckets.set(key, 0);
  }

  for (const ts of timestamps) {
    if (ts === null || ts < start - DAY_MS) continue;
    const key = dayKey(ts);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([key, count]) => ({ key, label: dayLabel(key), count }));
}

/** Like countPerDay but sums a numeric value per day instead of counting rows. */
export function sumPerDay(
  points: { ms: number | null; value: number | null | undefined }[],
  days: number
): { key: string; label: string; count: number }[] {
  const now = Date.now();
  const start = now - (days - 1) * DAY_MS;
  const buckets = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    buckets.set(dayKey(start + i * DAY_MS), 0);
  }

  for (const { ms, value } of points) {
    if (ms === null || ms < start - DAY_MS) continue;
    const key = dayKey(ms);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + (value ?? 0));
  }

  return Array.from(buckets.entries()).map(([key, count]) => ({ key, label: dayLabel(key), count }));
}

export function topByCount<T>(
  items: T[],
  keyFn: (item: T) => string | null | undefined,
  nameFn: (key: string) => string,
  n = 10
): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, value]) => ({ name: nameFn(key), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function cumulativeSeries(series: { key: string; label: string; count: number }[], startOffset = 0) {
  let running = startOffset;
  return series.map((point) => {
    running += point.count;
    return { ...point, total: running };
  });
}

export function groupCount<T>(items: T[], keyFn: (item: T) => string | null | undefined): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function sumBy<T>(items: T[], valueFn: (item: T) => number | null | undefined): number {
  return items.reduce((acc, item) => acc + (valueFn(item) ?? 0), 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface OverviewStats {
  totalPatients: number;
  totalSessions: number;
  totalUsers: number;
  newSignups7d: number;
  activeUsers7d: number;
  totalSessionHours: number;
  totalLoggedRows: number;
  avgSessionDurationS: number;
  sessionsPerDay30: { key: string; label: string; count: number }[];
  signupsPerDay30: { key: string; label: string; count: number }[];
  cumulativeUsers30: { key: string; label: string; count: number; total: number }[];
  deviceSplit: { name: string; value: number }[];
  mappingMethodSplit: { name: string; value: number }[];
  gridSizeSplit: { name: string; value: number }[];
  /** Week-over-week deltas + last-14-day sparkline shape for each headline stat. */
  deltas: {
    users: { pct: number | null; sparkline: number[] };
    sessions: { pct: number | null; sparkline: number[] };
    patients: { pct: number | null; sparkline: number[] };
    active: { pct: number | null; sparkline: number[] };
  };
}

export function buildOverviewStats(
  patients: Patient[],
  sessions: Session[],
  authUsers: AuthUser[]
): OverviewStats {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * DAY_MS;

  const sessionStarts = sessions.map((s) => toMs(s.start_ms ?? s.created_at));
  const signupTimes = authUsers.map((u) => toMs(u.created_at));

  const activeOwners = new Set(
    sessions.filter((s) => (toMs(s.start_ms ?? s.created_at) ?? 0) >= sevenDaysAgo).map((s) => s.owner_id)
  );

  const sessionsPerDay30 = countPerDay(sessionStarts, 30);
  const signupsPerDay30 = countPerDay(signupTimes, 30);

  const usersBeforeWindow = authUsers.filter((u) => (toMs(u.created_at) ?? 0) < now - 30 * DAY_MS).length;
  const cumulativeUsers30 = cumulativeSeries(signupsPerDay30, usersBeforeWindow);

  const durations = sessions.map((s) => s.duration_s).filter((d): d is number => typeof d === "number");

  const patientTimes = patients.map((p) => toMs(p.created_at));
  const sessionTimes14 = countPerDay(sessionStarts, 14).map((p) => p.count);
  const signupTimes14 = countPerDay(signupTimes, 14).map((p) => p.count);
  const patientTimes14 = countPerDay(patientTimes, 14).map((p) => p.count);

  const activeThisWeek = activeOwners.size;
  const activeLastWeek = new Set(
    sessions
      .filter((s) => {
        const ms = toMs(s.start_ms ?? s.created_at) ?? 0;
        return ms >= now - 14 * DAY_MS && ms < sevenDaysAgo;
      })
      .map((s) => s.owner_id)
  ).size;

  const sessions7d = sessions.filter((s) => (toMs(s.start_ms ?? s.created_at) ?? 0) >= sevenDaysAgo).length;
  const sessionsPrior7d = sessions.filter((s) => {
    const ms = toMs(s.start_ms ?? s.created_at) ?? 0;
    return ms >= now - 14 * DAY_MS && ms < sevenDaysAgo;
  }).length;

  const patients7d = patients.filter((p) => (toMs(p.created_at) ?? 0) >= sevenDaysAgo).length;
  const patientsPrior7d = patients.filter((p) => {
    const ms = toMs(p.created_at) ?? 0;
    return ms >= now - 14 * DAY_MS && ms < sevenDaysAgo;
  }).length;

  const signupsPrior7d = authUsers.filter((u) => {
    const ms = toMs(u.created_at) ?? 0;
    return ms >= now - 14 * DAY_MS && ms < sevenDaysAgo;
  }).length;

  return {
    totalPatients: patients.length,
    totalSessions: sessions.length,
    totalUsers: authUsers.length,
    newSignups7d: authUsers.filter((u) => (toMs(u.created_at) ?? 0) >= sevenDaysAgo).length,
    activeUsers7d: activeOwners.size,
    totalSessionHours: sumBy(sessions, (s) => s.duration_s) / 3600,
    totalLoggedRows: sumBy(sessions, (s) => s.row_count),
    avgSessionDurationS: average(durations),
    sessionsPerDay30,
    signupsPerDay30,
    cumulativeUsers30,
    deviceSplit: groupCount(sessions, (s) => s.source_device),
    mappingMethodSplit: groupCount(patients, (p) => p.mapping_method),
    gridSizeSplit: groupCount(patients, (p) =>
      p.grid_rows && p.grid_cols ? `${p.grid_rows}×${p.grid_cols}` : null
    ),
    deltas: {
      users: { pct: percentDelta(authUsers.filter((u) => (toMs(u.created_at) ?? 0) >= sevenDaysAgo).length, signupsPrior7d), sparkline: signupTimes14 },
      sessions: { pct: percentDelta(sessions7d, sessionsPrior7d), sparkline: sessionTimes14 },
      patients: { pct: percentDelta(patients7d, patientsPrior7d), sparkline: patientTimes14 },
      active: { pct: percentDelta(activeThisWeek, activeLastWeek), sparkline: sessionTimes14 },
    },
  };
}

export function ownerEmailMap(users: AuthUser[]): Map<string, string> {
  return new Map(users.map((u) => [u.id, u.email ?? u.id.slice(0, 8)]));
}

export function patientDisplayName(p: Patient): string {
  return p.name || p.patient_code || p.id.slice(0, 8);
}

/** Shortens a long label for a fixed-width chart axis (e.g. an email on a
 *  horizontal bar chart) — keeping the start (what identifies it) rather
 *  than letting the axis clip an arbitrary tail off it. */
export function truncateLabel(value: string, max = 18): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function patientNameMap(patients: Patient[]): Map<string, string> {
  return new Map(patients.map((p) => [p.id, patientDisplayName(p)]));
}

export function userSettingsMap(rows: UserSettings[]): Map<string, UserSettings> {
  return new Map(rows.map((r) => [r.user_id, r]));
}

// --- Richer analytics helpers ------------------------------------------

/** Percent change from `previous` to `current`, null when previous is 0 (undefined growth rate). */
export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Two aligned series — the trailing `days` window ("current") and the
 * `days` window immediately before it ("previous") — for period-over-period
 * comparison charts. `label` comes from the current window's calendar date
 * so the x-axis reads as real dates, with `previousCount` plotted alongside.
 */
export function periodComparison(
  timestamps: (number | null)[],
  days: number
): { key: string; label: string; current: number; previous: number }[] {
  const now = Date.now();
  const currentSeries = countPerDay(timestamps, days);
  const start = now - (days - 1) * DAY_MS;
  const prevStart = start - days * DAY_MS;

  const prevBuckets = new Map<string, number>();
  for (let i = 0; i < days; i++) prevBuckets.set(dayKey(prevStart + i * DAY_MS), 0);
  for (const ts of timestamps) {
    if (ts === null || ts < prevStart || ts >= start) continue;
    const key = dayKey(ts);
    if (prevBuckets.has(key)) prevBuckets.set(key, (prevBuckets.get(key) ?? 0) + 1);
  }
  const prevValues = Array.from(prevBuckets.values());

  return currentSeries.map((point, i) => ({
    key: point.key,
    label: point.label,
    current: point.count,
    previous: prevValues[i] ?? 0,
  }));
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Counts events by day-of-week (Sun..Sat reordered to Mon..Sun) — reveals a
 *  usage pattern (e.g. "mostly weekday mornings") a plain time series can't. */
export function weekdayDistribution(timestamps: (number | null)[]): { name: string; value: number }[] {
  const counts = new Array(7).fill(0);
  for (const ts of timestamps) {
    if (ts === null) continue;
    counts[new Date(ts).getDay()]++;
  }
  // Reorder Sun-first counts to Mon-first for display.
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dayIdx) => ({ name: WEEKDAY_LABELS[dayIdx], value: counts[dayIdx] }));
}

/** Last-30-day trend shape for a StatCard sparkline — just the counts, no labels needed. */
export function sparklineFrom(series: { count: number }[]): number[] {
  return series.map((p) => p.count);
}

export interface FunnelStep {
  label: string;
  value: number;
}

/** Signed up -> created a patient -> logged >=1 session -> logged a repeat
 *  session within 7 days of their first. A simple, real engagement funnel
 *  computed entirely from data already fetched (no new tables needed). */
export function engagementFunnel(patients: Patient[], sessions: Session[], authUsers: AuthUser[]): FunnelStep[] {
  const signedUp = authUsers.length;

  const ownersWithPatients = new Set(patients.map((p) => p.owner_id));
  const createdPatient = ownersWithPatients.size;

  const sessionsByOwner = new Map<string, number[]>();
  for (const s of sessions) {
    const ms = toMs(s.start_ms ?? s.created_at);
    if (ms === null) continue;
    const list = sessionsByOwner.get(s.owner_id) ?? [];
    list.push(ms);
    sessionsByOwner.set(s.owner_id, list);
  }
  const loggedSession = sessionsByOwner.size;

  let repeatWithin7d = 0;
  for (const times of sessionsByOwner.values()) {
    if (times.length < 2) continue;
    const sorted = [...times].sort((a, b) => a - b);
    if (sorted[1] - sorted[0] <= 7 * DAY_MS) repeatWithin7d++;
  }

  return [
    { label: "Signed up", value: signedUp },
    { label: "Created a patient", value: createdPatient },
    { label: "Logged a session", value: loggedSession },
    { label: "Repeat within 7d", value: repeatWithin7d },
  ];
}
