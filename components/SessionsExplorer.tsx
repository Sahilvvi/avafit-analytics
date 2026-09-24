"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import DataTable, { type Column } from "./DataTable";
import DeviceBadge from "./DeviceBadge";
import ExportCsvButton from "./ExportCsvButton";
import ChartCard from "./ChartCard";
import CategoryBarChart from "./charts/CategoryBarChart";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import type { Session } from "@/lib/types";

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: 0 },
];

const DURATION_BUCKETS: { label: string; max: number }[] = [
  { label: "< 1 min", max: 60 },
  { label: "1–5 min", max: 300 },
  { label: "5–15 min", max: 900 },
  { label: "15–30 min", max: 1800 },
  { label: "30–60 min", max: 3600 },
  { label: "60 min+", max: Infinity },
];

function durationHistogram(sessions: Session[]) {
  const counts = DURATION_BUCKETS.map(() => 0);
  for (const s of sessions) {
    const d = s.duration_s ?? 0;
    const idx = DURATION_BUCKETS.findIndex((b) => d < b.max);
    counts[idx === -1 ? counts.length - 1 : idx]++;
  }
  return DURATION_BUCKETS.map((b, i) => ({ name: b.label, value: counts[i] }));
}

export default function SessionsExplorer({
  sessions,
  patientNames,
  ownerEmails,
}: {
  sessions: Session[];
  patientNames: Map<string, string>;
  ownerEmails: Map<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [device, setDevice] = useState("all");
  const [rangeDays, setRangeDays] = useState(30);

  const devices = useMemo(() => {
    const set = new Set(sessions.map((s) => s.source_device || "unknown"));
    return Array.from(set);
  }, [sessions]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = rangeDays > 0 ? now - rangeDays * 86_400_000 : 0;
    const q = query.trim().toLowerCase();

    return sessions
      .filter((s) => (s.start_ms ?? 0) >= cutoff)
      .filter((s) => device === "all" || (s.source_device || "unknown") === device)
      .filter((s) => {
        if (!q) return true;
        const patient = patientNames.get(s.patient_id) ?? "";
        const owner = ownerEmails.get(s.owner_id) ?? "";
        return `${patient} ${owner} ${s.session_code ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.start_ms ?? 0) - (a.start_ms ?? 0));
  }, [sessions, query, device, rangeDays, patientNames, ownerEmails]);

  const histogram = useMemo(() => durationHistogram(filtered), [filtered]);

  const columns: Column<Session>[] = [
    {
      header: "Patient",
      cell: (s) => (
        <Link href={`/patients/${s.patient_id}`} className="font-semibold text-text-primary transition hover:text-accent">
          {patientNames.get(s.patient_id) ?? s.patient_id.slice(0, 8)}
        </Link>
      ),
      sortValue: (s) => patientNames.get(s.patient_id) ?? s.patient_id,
    },
    {
      header: "Tester",
      cell: (s) => ownerEmails.get(s.owner_id) ?? s.owner_id.slice(0, 8),
      sortValue: (s) => ownerEmails.get(s.owner_id) ?? s.owner_id,
    },
    { header: "Device", cell: (s) => <DeviceBadge device={s.source_device} />, sortValue: (s) => s.source_device ?? "" },
    { header: "Started", cell: (s) => formatDateTime(s.start_ms), sortValue: (s) => s.start_ms ?? 0 },
    {
      header: "Duration",
      cell: (s) => formatDuration(s.duration_s),
      className: "font-mono tabular-nums",
      sortValue: (s) => s.duration_s ?? 0,
    },
    {
      header: "Rows",
      cell: (s) => formatNumber(s.row_count),
      className: "text-right font-mono tabular-nums text-text-primary",
      sortValue: (s) => s.row_count ?? 0,
    },
  ];

  return (
    <div>
      {sessions.length > 0 ? (
        <div className="mb-4">
          <ChartCard title="Session duration distribution" description="How long logging sessions in this view actually run">
            <CategoryBarChart data={histogram} color="var(--series-2)" height={170} />
          </ChartCard>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient, tester, session code…"
            className="field pl-10"
          />
        </div>
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          className="field w-auto cursor-pointer pr-8 text-text-secondary"
        >
          <option value="all">All devices</option>
          {devices.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={rangeDays}
          onChange={(e) => setRangeDays(Number(e.target.value))}
          className="field w-auto cursor-pointer pr-8 text-text-secondary"
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r.label} value={r.days}>
              {r.label}
            </option>
          ))}
        </select>
        <span className="font-mono text-xs text-text-muted">
          {filtered.length} / {sessions.length}
        </span>
        <ExportCsvButton
          filename="ava-fit-sessions.csv"
          rows={filtered}
          columns={[
            { header: "Patient", value: (s) => patientNames.get(s.patient_id) ?? s.patient_id },
            { header: "Tester", value: (s) => ownerEmails.get(s.owner_id) ?? s.owner_id },
            { header: "Device", value: (s) => s.source_device },
            { header: "Started", value: (s) => (s.start_ms ? new Date(s.start_ms).toISOString() : "") },
            { header: "Duration (s)", value: (s) => s.duration_s },
            { header: "Rows", value: (s) => s.row_count },
            { header: "Session code", value: (s) => s.session_code },
          ]}
        />
      </div>
      <DataTable
        columns={columns}
        rows={filtered}
        keyFor={(s) => s.id ?? `${s.patient_id}-${s.start_ms}`}
        emptyLabel="No sessions match these filters."
      />
    </div>
  );
}
