"use client";

import { useId, useState } from "react";

/**
 * Masks a sensitive number/string by default (dots, not the real value —
 * nothing to scrape from the DOM while hidden) and reveals it as an inline
 * SVG <text> node on hover or tap, rather than a normal DOM text node. This
 * doesn't stop a screenshot of the revealed state, but it does two real
 * things: (1) a screenshot can no longer grab every value on the page in one
 * shot — each one has to be revealed individually, and (2) copy-paste /
 * view-source / a DOM scraper gets nothing while values sit masked, and even
 * once revealed there's no selectable text node to copy, only rendered
 * pixels (an SVG glyph). See the data-protection plan for the honest scope
 * of what this can and can't do.
 */
export function SecureValue({
  value,
  fontSize = 13,
  weight = 500,
  color = "#0F172A",
  mono = true,
}: {
  value: string | number;
  fontSize?: number;
  weight?: number;
  color?: string;
  mono?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const revealed = hover || open;
  const id = useId();
  const text = String(value);
  const charW = mono ? fontSize * 0.62 : fontSize * 0.56;
  const width = Math.max(fontSize, text.length * charW) + 2;
  const height = fontSize * 1.35;

  return (
    <svg
      role="button"
      aria-label={revealed ? text : "Hidden value — tap or hover to reveal"}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      style={{ display: "inline-block", verticalAlign: "middle", cursor: "pointer", overflow: "visible" }}
    >
      <title>{revealed ? text : "Tap to reveal"}</title>
      {revealed ? (
        <text
          key={id}
          x={0}
          y={height * 0.74}
          fontFamily={mono ? "var(--hc-mono)" : "var(--hc-sans)"}
          fontSize={fontSize}
          fontWeight={weight}
          fill={color}
        >
          {text}
        </text>
      ) : (
        Array.from({ length: Math.min(text.length, 6) }, (_, i) => (
          <circle key={i} cx={i * (charW * 0.9) + charW / 2} cy={height / 2} r={fontSize * 0.11} fill="#94A3B8" />
        ))
      )}
    </svg>
  );
}
