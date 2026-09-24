import type { DPatient, DSession, Model } from "./types";
import { dayLabelOf, dayWord, isoDay } from "./format";

export const DAY = 864e5;

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface DayPoint {
  ms: number;
  iso: string;
  label: string;
  sessions: number;
  patients: number;
  rows: number;
  durS: number;
  avgDurS: number | null;
}

/** Trailing per-day buckets (oldest → newest, ending today) of real session activity. */
export function dailySeries(model: Model, days = 90): DayPoint[] {
  const today = startOfDay(model.nowMs);
  const pts: DayPoint[] = [];
  const idx = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ms = d.getTime();
    idx.set(isoDay(ms), pts.length);
    pts.push({ ms, iso: isoDay(ms), label: dayLabelOf(ms), sessions: 0, patients: 0, rows: 0, durS: 0, avgDurS: null });
  }
  const seen = pts.map(() => new Set<string>());
  for (const s of model.sessions) {
    if (s.startMs == null) continue;
    const i = idx.get(isoDay(s.startMs));
    if (i == null) continue;
    pts[i].sessions++;
    pts[i].rows += s.rows ?? 0;
    pts[i].durS += s.durS ?? 0;
    seen[i].add(s.pid);
  }
  pts.forEach((p, i) => {
    p.patients = seen[i].size;
    p.avgDurS = p.sessions ? p.durS / p.sessions : null;
  });
  return pts;
}

export interface WindowStats {
  sessions: number;
  patients: number;
  avgDurS: number | null;
  rows: number;
}

/** Stats for sessions starting in [from, to). */
export function windowStats(model: Model, from: number, to: number): WindowStats {
  const ss = model.sessions.filter((s) => s.startMs != null && s.startMs >= from && s.startMs < to);
  const durs = ss.map((s) => s.durS).filter((n): n is number => n != null);
  return {
    sessions: ss.length,
    patients: new Set(ss.map((s) => s.pid)).size,
    avgDurS: durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : null,
    rows: ss.reduce((a, s) => a + (s.rows ?? 0), 0),
  };
}

export function sparkSeries(model: Model, from: number, to: number, n: number, pick: (w: WindowStats) => number): number[] {
  const step = (to - from) / n;
  return Array.from({ length: n }, (_, i) => pick(windowStats(model, from + i * step, from + (i + 1) * step)));
}

export interface Delta {
  text: string;
  tone: "up" | "down" | "flat";
}

export function deltaOf(cur: number, prev: number): Delta {
  if (prev === 0) return cur > 0 ? { text: "New", tone: "up" } : { text: "—", tone: "flat" };
  const pct = ((cur - prev) / prev) * 100;
  if (Math.abs(pct) < 0.05) return { text: "0%", tone: "flat" };
  return { text: `${pct > 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`, tone: pct > 0 ? "up" : "down" };
}

/** Sessions-per-week counts for the last `weeks` weeks (oldest → newest). */
export function weeklyCounts(sessions: DSession[], nowMs: number, weeks = 10): number[] {
  const out = Array<number>(weeks).fill(0);
  for (const s of sessions) {
    if (s.startMs == null) continue;
    const w = Math.floor((nowMs - s.startMs) / (7 * DAY));
    if (w >= 0 && w < weeks) out[weeks - 1 - w]++;
  }
  return out;
}

export function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function average(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

export function countBy<T>(items: T[], key: (i: T) => string | null | undefined): [string, number][] {
  const m = new Map<string, number>();
  for (const i of items) {
    const k = key(i);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

export interface NoteRow {
  by: string;
  when: string;
  text: string;
}

export function sessionNotes(s: DSession, nowMs: number): NoteRow[] {
  return s.note ? [{ by: s.tester, when: s.startMs != null ? dayWord(s.startMs, nowMs) : "—", text: s.note }] : [];
}

export function patientNotes(p: DPatient, nowMs: number): NoteRow[] {
  const out: NoteRow[] = [];
  if (p.notes) out.push({ by: p.tester, when: "Patient profile", text: p.notes });
  for (const s of p.sessions) out.push(...sessionNotes(s, nowMs));
  return out;
}
