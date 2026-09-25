"use client";

import { useId, useState } from "react";

/**
 * Masks a sensitive number/string by default and reveals it as an inline
 * SVG <text> node on hover or tap, rather than a normal DOM text node — no
 * plain text to scrape while hidden, and no selectable node once revealed
 * (screenshots of the revealed pixels are the honest limit here, see the
 * data-protection plan). The masked state renders as a small pill with an
 * eye glyph, not a bare dot, so it reads as a deliberate "hidden — tap to
 * reveal" control instead of a loading/error state.
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
  const textWidth = Math.max(fontSize, text.length * charW) + 2;
  const height = Math.max(fontSize * 1.35, 20);
  const pillWidth = fontSize * 2.6;
  const width = revealed ? textWidth : pillWidth;

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
        <g>
          <rect x={0} y={0} width={pillWidth} height={height} rx={height / 2} fill="rgba(67,52,220,0.08)" />
          {/* simplified eye-off glyph */}
          <g transform={`translate(${pillWidth * 0.28}, ${height / 2})`} stroke="#6D64E8" strokeWidth={1.4} fill="none" strokeLinecap="round">
            <path d={`M -${fontSize * 0.42} 0 Q 0 -${fontSize * 0.32} ${fontSize * 0.42} 0 Q 0 ${fontSize * 0.32} -${fontSize * 0.42} 0 Z`} />
            <circle cx={0} cy={0} r={fontSize * 0.11} fill="#6D64E8" stroke="none" />
          </g>
        </g>
      )}
    </svg>
  );
}
