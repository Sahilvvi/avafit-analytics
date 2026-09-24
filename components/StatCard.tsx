import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import AnimatedNumber from "./motion/AnimatedNumber";
import Sparkline from "./charts/Sparkline";
import DeltaBadge from "./DeltaBadge";

export default function StatCard({
  label,
  value,
  numericValue,
  icon: Icon,
  hint,
  tone = "default",
  size = "md",
  sparkline,
  deltaPct,
}: {
  label: string;
  value: string;
  /** When set, animates the displayed value as a count-up from 0 using this
   *  number (falls back to the static `value` string when omitted). */
  numericValue?: number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "good" | "warning" | "critical";
  size?: "md" | "sm";
  /** Last-N-day trend shape rendered as a tiny inline chart. */
  sparkline?: number[];
  /** Week-over-week (or period-over-period) percent change badge. */
  deltaPct?: number | null;
}) {
  const toneClass = {
    default: "text-text-primary",
    good: "text-status-good",
    warning: "text-status-warning",
    critical: "text-status-critical",
  }[tone];

  return (
    <div className="card group relative overflow-hidden p-4 transition hover:border-border-strong sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow leading-snug">{label}</p>
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon size={15} strokeWidth={2.2} />
          </span>
        ) : null}
      </div>
      <p
        className={clsx(
          "font-bold tabular-nums tracking-tight",
          size === "md" ? "mt-3 text-[28px] leading-none sm:text-[32px]" : "mt-2 text-2xl leading-none",
          toneClass
        )}
      >
        {numericValue !== undefined ? <AnimatedNumber value={numericValue} /> : value}
      </p>
      {deltaPct !== undefined ? (
        <div className="mt-2.5">
          <DeltaBadge delta={deltaPct} suffix="vs last week" />
        </div>
      ) : hint ? (
        <p className="mt-2.5 text-xs text-text-muted">{hint}</p>
      ) : null}
      {sparkline ? <Sparkline values={sparkline} /> : null}
    </div>
  );
}
