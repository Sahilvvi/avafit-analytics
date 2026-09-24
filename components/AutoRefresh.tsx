"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";

const INTERVAL_MS = 15_000;

/**
 * Polls the server by re-running the current route's server components
 * (router.refresh()) every 15s. There's no Supabase Realtime subscription
 * here on purpose — the service-role key that can see every tester's rows
 * must never reach the browser, so a client-side realtime channel isn't an
 * option without a lot more plumbing (RLS-safe views, a proxy channel,
 * etc). Polling metadata this size is cheap and keeps the key server-only.
 */
export default function AutoRefresh() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [spinning, setSpinning] = useState(false);

  const refresh = useCallback(() => {
    setSpinning(true);
    router.refresh();
    setLastUpdated(new Date());
    window.setTimeout(() => setSpinning(false), 500);
  }, [router]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(refresh, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setEnabled((e) => !e)}
        aria-pressed={enabled}
        title={enabled ? "Auto-refresh every 15s — click to pause" : "Auto-refresh paused — click to resume"}
        className={clsx(
          "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition",
          enabled
            ? "border-status-good/30 bg-status-good/10 text-status-good"
            : "border-border bg-surface-2 text-text-muted hover:text-text-primary"
        )}
      >
        <span className="relative flex h-2 w-2">
          {enabled ? (
            <span className="absolute inset-0 rounded-full bg-status-good" style={{ animation: "live-ping 1.6s ease-out infinite" }} />
          ) : null}
          <span className={clsx("relative h-2 w-2 rounded-full", enabled ? "bg-status-good" : "bg-text-muted")} />
        </span>
        {enabled ? "Live" : "Paused"}
      </button>
      <button type="button" onClick={refresh} className="btn-ghost" title="Refresh now">
        <RefreshCw size={13} className={clsx(spinning && "animate-spin")} />
        {lastUpdated ? (
          <span suppressHydrationWarning className="font-mono tabular-nums">
            {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        ) : (
          "Refresh"
        )}
      </button>
    </div>
  );
}
