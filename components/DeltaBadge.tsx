import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import clsx from "clsx";

/** "+18% vs prior period" pill — null delta (no prior-period baseline) renders as neutral. */
export default function DeltaBadge({ delta, suffix = "vs prior period" }: { delta: number | null; suffix?: string }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-muted">
        <Minus size={11} /> new
      </span>
    );
  }
  const rounded = Math.round(delta);
  const flat = rounded === 0;
  const positive = rounded > 0;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        flat
          ? "bg-surface-2 text-text-muted"
          : positive
            ? "bg-status-good/10 text-status-good"
            : "bg-status-critical/10 text-status-critical"
      )}
    >
      {flat ? <Minus size={11} /> : positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {flat ? "flat" : `${positive ? "+" : ""}${rounded}%`} <span className="text-text-muted">{suffix}</span>
    </span>
  );
}
