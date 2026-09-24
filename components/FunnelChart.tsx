"use client";

import { motion } from "framer-motion";
import type { FunnelStep } from "@/lib/aggregate";

/** Horizontal engagement funnel — each stage's bar is scaled to the first
 *  stage's value, with the conversion % from the previous stage called out. */
export default function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, steps[0]?.value ?? 1);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = max > 0 ? (step.value / max) * 100 : 0;
        const prevValue = i > 0 ? steps[i - 1].value : null;
        const conv = prevValue && prevValue > 0 ? Math.round((step.value / prevValue) * 100) : null;
        return (
          <div key={step.label}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-text-primary">{step.label}</span>
              <span className="font-mono tabular-nums text-text-secondary">
                {step.value}
                {conv !== null ? <span className="ml-2 text-xs text-text-muted">{conv}% of prior</span> : null}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, var(--accent), var(--series-3))` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
