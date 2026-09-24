import Link from "next/link";
import { Activity, UserPlus } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { toMs } from "@/lib/aggregate";
import type { AuthUser, Session } from "@/lib/types";

type ActivityItem =
  | { kind: "session"; ms: number; patientName: string; patientId: string; ownerEmail: string; device?: string | null }
  | { kind: "signup"; ms: number; email: string };

export default function RecentActivity({
  sessions,
  authUsers,
  patientNames,
  ownerEmails,
  limit = 8,
}: {
  sessions: Session[];
  authUsers: AuthUser[];
  patientNames: Map<string, string>;
  ownerEmails: Map<string, string>;
  limit?: number;
}) {
  const items: ActivityItem[] = [
    ...sessions.map((s) => ({
      kind: "session" as const,
      ms: toMs(s.start_ms ?? s.created_at) ?? 0,
      patientName: patientNames.get(s.patient_id) ?? s.patient_id.slice(0, 8),
      patientId: s.patient_id,
      ownerEmail: ownerEmails.get(s.owner_id) ?? s.owner_id.slice(0, 8),
      device: s.source_device,
    })),
    ...authUsers.map((u) => ({
      kind: "signup" as const,
      ms: toMs(u.created_at) ?? 0,
      email: u.email ?? u.id.slice(0, 8),
    })),
  ]
    .filter((i) => i.ms > 0)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, limit);

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No activity yet.</p>;
  }

  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span
            className={
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
              (item.kind === "session" ? "bg-accent/10 text-accent" : "bg-status-good/10 text-status-good")
            }
          >
            {item.kind === "session" ? <Activity size={14} /> : <UserPlus size={14} />}
          </span>
          <div className="min-w-0 flex-1">
            {item.kind === "session" ? (
              <p className="truncate text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{item.ownerEmail}</span> logged a session for{" "}
                <Link href={`/patients/${item.patientId}`} className="font-medium text-text-primary hover:text-accent">
                  {item.patientName}
                </Link>
              </p>
            ) : (
              <p className="truncate text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{item.email}</span> signed up
              </p>
            )}
          </div>
          <span className="shrink-0 font-mono text-xs text-text-muted">{formatRelative(item.ms)}</span>
        </li>
      ))}
    </ul>
  );
}
