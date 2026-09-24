"use client";

import Link from "next/link";
import SearchableTable from "./SearchableTable";
import type { Column } from "./DataTable";
import { patientDisplayName } from "@/lib/aggregate";
import type { Patient } from "@/lib/types";

export default function PatientsTable({
  patients,
  emails,
  sessionCounts,
}: {
  patients: Patient[];
  emails: Map<string, string>;
  sessionCounts: Map<string, number>;
}) {
  const maxKpaInSet = Math.max(0, ...patients.map((p) => p.max_kpa ?? 0));

  const columns: Column<Patient>[] = [
    {
      header: "Patient",
      cell: (p) => (
        <Link href={`/patients/${p.id}`} className="font-semibold text-text-primary transition hover:text-accent">
          {patientDisplayName(p)}
        </Link>
      ),
    },
    {
      header: "Side",
      cell: (p) =>
        p.side ? (
          <span className="rounded-md bg-surface-3 px-2 py-0.5 text-xs font-medium capitalize text-text-secondary">{p.side}</span>
        ) : (
          "—"
        ),
    },
    {
      header: "Grid",
      cell: (p) => (p.grid_rows && p.grid_cols ? <span className="font-mono">{`${p.grid_rows}×${p.grid_cols}`}</span> : "—"),
    },
    { header: "Mapping", cell: (p) => p.mapping_method ?? "—" },
    {
      header: "Max kPa",
      cell: (p) => <MaxPressureBadge kpa={p.max_kpa} maxInSet={maxKpaInSet} />,
      className: "font-mono tabular-nums",
      sortValue: (p) => p.max_kpa ?? -1,
    },
    { header: "Owner", cell: (p) => emails.get(p.owner_id) ?? p.owner_id.slice(0, 8) },
    {
      header: "Sessions",
      cell: (p) => String(sessionCounts.get(p.id) ?? 0),
      className: "text-right font-mono tabular-nums text-text-primary",
      sortValue: (p) => sessionCounts.get(p.id) ?? 0,
    },
  ];

  return (
    <SearchableTable
      rows={patients}
      columns={columns}
      keyFor={(p) => p.id}
      searchPlaceholder="Search by name or patient code…"
      searchText={(p) => `${p.name ?? ""} ${p.patient_code ?? ""}`}
      emptyLabel="No patient profiles have synced yet."
      defaultSort={{ header: "Sessions" }}
      exportFileName="ava-fit-patients.csv"
      exportColumns={[
        { header: "Patient", value: (p) => patientDisplayName(p) },
        { header: "Side", value: (p) => p.side },
        { header: "Grid rows", value: (p) => p.grid_rows },
        { header: "Grid cols", value: (p) => p.grid_cols },
        { header: "Mapping method", value: (p) => p.mapping_method },
        { header: "Max kPa", value: (p) => p.max_kpa },
        { header: "Owner", value: (p) => emails.get(p.owner_id) ?? p.owner_id },
        { header: "Sessions", value: (p) => sessionCounts.get(p.id) ?? 0 },
      ]}
    />
  );
}

/** Color-coded relative to the highest value in this list, not against any
 *  clinical threshold (this dashboard makes no medical claims) — it's a
 *  quick "which patients are logging the highest peak pressure" scan. */
function MaxPressureBadge({ kpa, maxInSet }: { kpa?: number | null; maxInSet: number }) {
  if (kpa == null) return <span>—</span>;
  const ratio = maxInSet > 0 ? kpa / maxInSet : 0;
  const tone = ratio >= 0.85 ? "text-status-critical" : ratio >= 0.6 ? "text-status-warning" : "text-status-good";
  return <span className={tone}>{kpa} kPa</span>;
}
