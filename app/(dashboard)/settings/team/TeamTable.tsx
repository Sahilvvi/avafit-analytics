"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/format";
import { removeTeammateAction } from "./actions";
import type { AdminUser } from "@/lib/types";

export default function TeamTable({ admins, currentId }: { admins: AdminUser[]; currentId?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60">
              <th className="eyebrow whitespace-nowrap px-5 py-3 font-medium">Name</th>
              <th className="eyebrow whitespace-nowrap px-5 py-3 font-medium">Email</th>
              <th className="eyebrow whitespace-nowrap px-5 py-3 font-medium">Joined</th>
              <th className="eyebrow whitespace-nowrap px-5 py-3 font-medium">Last login</th>
              <th className="eyebrow whitespace-nowrap px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {admins.map((a) => {
              const isYou = a.id === currentId;
              return (
                <tr key={a.id} className="transition-colors hover:bg-surface-2/70">
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-bold uppercase text-text-secondary">
                        {a.name.slice(0, 1)}
                      </span>
                      <span className="font-semibold text-text-primary">
                        {a.name}
                        {isYou ? <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">You</span> : null}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{a.email}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{formatDate(a.created_at)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-text-secondary">{formatRelative(a.last_login_at)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={isYou || isPending}
                      title={isYou ? "You can't remove the account you're signed in with" : "Remove teammate"}
                      onClick={() => startTransition(() => removeTeammateAction(a.id))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-status-critical/10 hover:text-status-critical disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
