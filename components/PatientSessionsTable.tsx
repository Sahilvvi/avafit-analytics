"use client";

import DataTable, { type Column } from "./DataTable";
import DeviceBadge from "./DeviceBadge";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import type { Session } from "@/lib/types";

/**
 * Client wrapper around DataTable for the patient detail page. DataTable is
 * a Client Component (it owns click-to-sort state), and a Server Component
 * can't pass column-renderer functions straight into a Client Component
 * across the RSC boundary — only serializable props can cross it. So this
 * takes just the raw `sessions` array from the server page and builds the
 * (function-typed) column defs here, entirely on the client side.
 */
export default function PatientSessionsTable({ sessions }: { sessions: Session[] }) {
  const columns: Column<Session>[] = [
    {
      header: "Session",
      cell: (s) => s.session_code ?? (s.id ? s.id.slice(0, 8) : "—"),
      sortValue: (s) => s.session_code ?? s.id ?? "",
    },
    { header: "Device", cell: (s) => <DeviceBadge device={s.source_device} />, sortValue: (s) => s.source_device ?? "" },
    { header: "Started", cell: (s) => formatDateTime(s.start_ms), sortValue: (s) => s.start_ms ?? 0 },
    { header: "Duration", cell: (s) => formatDuration(s.duration_s), sortValue: (s) => s.duration_s ?? 0 },
    {
      header: "Rows",
      cell: (s) => formatNumber(s.row_count),
      className: "text-right font-mono tabular-nums text-text-primary",
      sortValue: (s) => s.row_count ?? 0,
    },
    { header: "Notes", cell: (s) => s.notes || "—" },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sessions}
      keyFor={(s) => s.id ?? `${s.patient_id}-${s.start_ms}`}
      emptyLabel="No sessions logged for this patient yet."
      defaultSort={{ header: "Started" }}
    />
  );
}
