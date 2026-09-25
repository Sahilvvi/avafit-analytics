"use client";

import { useState } from "react";
import { Icon } from "./icons";

/**
 * Blurs a block of genuinely sensitive content (clinical notes, sensor
 * readings) until hovered or tapped. Scoped to the Patient detail page only
 * — an admin already opened this page on purpose to look at one patient, so
 * unlike masking Overview's headline counts (tried and reverted — made the
 * landing page look empty/broken), there's nothing left looking unfinished
 * here: the card title and the "tap to reveal" affordance stay sharp.
 * Same honest limits as the rest of the data-protection plan: this is
 * friction, not prevention — the DOM text is still there, just blurred.
 */
export function RevealBlock({ children, label = "Tap to reveal" }: { children: React.ReactNode; label?: string }) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const revealed = hover || open;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      style={{ position: "relative", cursor: "pointer" }}
    >
      <div
        style={{
          filter: revealed ? "none" : "blur(7px)",
          userSelect: revealed ? undefined : "none",
          transition: "filter .2s ease",
        }}
      >
        {children}
      </div>
      {!revealed ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "rgba(10,10,13,0.35)",
            borderRadius: 10,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, font: "500 11px var(--hc-mono)", color: "#C3C6CF", padding: "6px 11px", borderRadius: 999, background: "rgba(255,255,255,0.08)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
            <Icon name="eye" size={13} sw={2} />
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
