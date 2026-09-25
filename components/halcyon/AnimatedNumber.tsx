"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/** Counts up/down to `value` with spring-like easing instead of snapping,
 *  the same trick Linear/Stripe-style dashboards use to make a number tile
 *  feel alive on load and on every live refresh. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{format(display)}</>;
}
