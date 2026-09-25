export const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const C = {
  cyan: "#4334DC",
  green: "#10B981",
  amber: "#D97706",
  rose: "#E11D48",
  violet: "#7C3AED",
};

export const pad = (n: number) => String(n).padStart(2, "0");

export const hm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function dayWord(ms: number, nowMs: number): string {
  const a = new Date(nowMs);
  a.setHours(0, 0, 0, 0);
  const d = new Date(ms);
  const b = new Date(ms);
  b.setHours(0, 0, 0, 0);
  const x = Math.round((+a - +b) / 864e5);
  return x === 0 ? "Today" : x === 1 ? "Yesterday" : `${MO[d.getMonth()]} ${d.getDate()}`;
}

export function whenLabel(ms: number | null, nowMs: number): string {
  if (ms == null) return "—";
  return `${dayWord(ms, nowMs)} · ${hm(ms)}`;
}

export function agoLabel(ms: number | null, nowMs: number): string {
  if (ms == null) return "—";
  const h = (nowMs - ms) / 36e5;
  if (h < 0) return "just now";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** "45 min", "1h 5m", "38s" — seconds in, short human string out. */
export function fmtDur(s: number | null | undefined): string {
  if (s == null || Number.isNaN(s)) return "—";
  const t = Math.max(0, Math.round(s));
  if (t < 60) return `${t}s`;
  if (t < 3600) return `${Math.round(t / 60)} min`;
  const h = Math.floor(t / 3600);
  const m = Math.round((t % 3600) / 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const fmtInt = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) ? "—" : new Intl.NumberFormat("en-US").format(Math.round(n));

export const fmtCompact = (n: number | null | undefined) =>
  n == null || Number.isNaN(n) ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function initialsOf(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
}

const HUES = [200, 160, 35, 350, 265, 220, 130];
export function hueOf(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

export const av = (h: number) => `linear-gradient(135deg,oklch(0.92 0.06 ${h}),oklch(0.83 0.09 ${h}))`;

export function deviceLabel(raw: string | null | undefined): string {
  if (!raw) return "Unknown";
  const s = raw.toLowerCase();
  if (s === "ios" || s.includes("iphone") || s.includes("ipad")) return "iOS";
  if (s.includes("desktop")) return "Desktop";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export const STATUS_STYLE: Record<string, [string, string]> = {
  Live: [C.green, "rgba(16,185,129,.12)"],
  Active: [C.green, "rgba(16,185,129,.12)"],
  Completed: [C.cyan, "rgba(67, 52, 220,.10)"],
  Idle: ["#64748B", "rgba(100,116,139,.12)"],
};

export const DEVICE_COLORS = [C.cyan, C.green, C.violet, C.amber];

/** Local yyyy-mm-dd for date inputs / keys. */
export function isoDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayLabelOf(ms: number): string {
  const d = new Date(ms);
  return `${MO[d.getMonth()]} ${d.getDate()}`;
}
