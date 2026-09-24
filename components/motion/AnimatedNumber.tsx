"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * Counts up from 0 to `value` on mount (spring physics, not a linear tween —
 * it overshoots and settles slightly, which is what makes it read as
 * "alive" rather than a progress bar). Re-triggers if `value` changes later
 * (e.g. after a 15s live refresh pulls a new total).
 */
export default function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = format(v);
    });
    return unsub;
  }, [spring, format]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
