"use client";

import clsx from "clsx";
import SearchableTable from "./SearchableTable";
import type { Column } from "./DataTable";
import { formatDate, formatRelative } from "@/lib/format";
import type { AuthUser, UserSettings } from "@/lib/types";

export default function UsersTable({
  authUsers,
  patientCounts,
  sessionCounts,
  settings,
}: {
  authUsers: AuthUser[];
  patientCounts: Map<string, number>;
  sessionCounts: Map<string, number>;
  settings: Map<string, UserSettings>;
}) {
  const columns: Column<AuthUser>[] = [
    {
      header: "Tester",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-bold uppercase text-text-secondary">
            {(u.user_metadata?.full_name ?? u.email ?? "?").slice(0, 1)}
          </span>
          <div>
            <p className="font-semibold text-text-primary">{u.email ?? u.id.slice(0, 8)}</p>
            {u.user_metadata?.full_name ? <p className="text-xs text-text-muted">{u.user_metadata.full_name}</p> : null}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (u) => (
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            u.email_confirmed_at
              ? "border-status-good/25 bg-status-good/10 text-status-good"
              : "border-status-warning/25 bg-status-warning/10 text-status-warning"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {u.email_confirmed_at ? "Verified" : "Unverified"}
        </span>
      ),
    },
    { header: "Signed up", cell: (u) => formatDate(u.created_at), sortValue: (u) => new Date(u.created_at).getTime() },
    {
      header: "Last active",
      cell: (u) => <LastActiveBadge value={u.last_sign_in_at} />,
      sortValue: (u) => (u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0),
    },
    {
      header: "Patients",
      cell: (u) => String(patientCounts.get(u.id) ?? 0),
      className: "text-right tabular-nums",
      sortValue: (u) => patientCounts.get(u.id) ?? 0,
    },
    {
      header: "Sessions",
      cell: (u) => String(sessionCounts.get(u.id) ?? 0),
      className: "text-right tabular-nums",
      sortValue: (u) => sessionCounts.get(u.id) ?? 0,
    },
    {
      header: "Prefs",
      cell: (u) => {
        const s = settings.get(u.id);
        if (!s) return "—";
        const parts = [s.pressure_unit, s.theme, s.num_rows && s.num_cols ? `${s.num_rows}×${s.num_cols}` : null].filter(Boolean);
        return parts.length ? <span className="font-mono text-xs text-text-muted">{parts.join(" · ")}</span> : "—";
      },
    },
  ];

  return (
    <SearchableTable
      rows={authUsers}
      columns={columns}
      keyFor={(u) => u.id}
      searchPlaceholder="Search by email…"
      searchText={(u) => u.email ?? ""}
      emptyLabel="No testers have signed up yet."
      defaultSort={{ header: "Last active" }}
      exportFileName="ava-fit-testers.csv"
      exportColumns={[
        { header: "Email", value: (u) => u.email },
        { header: "Verified", value: (u) => (u.email_confirmed_at ? "yes" : "no") },
        { header: "Signed up", value: (u) => u.created_at },
        { header: "Last active", value: (u) => u.last_sign_in_at },
        { header: "Patients", value: (u) => patientCounts.get(u.id) ?? 0 },
        { header: "Sessions", value: (u) => sessionCounts.get(u.id) ?? 0 },
      ]}
    />
  );
}

/** Days-since-active, color coded: recently active testers matter more to a
 *  team checking in on an ongoing study than a bare timestamp communicates. */
function LastActiveBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-text-muted">Never</span>;
  const days = (Date.now() - new Date(value).getTime()) / 86_400_000;
  const tone = days <= 3 ? "text-status-good" : days <= 14 ? "text-status-warning" : "text-status-critical";
  return <span className={tone}>{formatRelative(value)}</span>;
}
