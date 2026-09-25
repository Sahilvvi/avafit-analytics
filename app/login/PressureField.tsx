"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative socket pressure map for the sign-in screen: a sensor-cell grid
 * lit by a few slow-moving contact points, the way a residual limb loads a
 * socket. Purely illustrative — it renders no numbers, so it can't be
 * mistaken for patient data.
 */
const COLS = 16;
const ROWS = 22;

// Load 0..1 → colour. Near-black → indigo → violet → warm → white-hot.
const STOPS: [number, [number, number, number]][] = [
  [0, [22, 23, 31]],
  [0.25, [52, 54, 130]],
  [0.5, [128, 131, 255]],
  [0.72, [196, 136, 255]],
  [0.88, [255, 176, 120]],
  [1, [255, 244, 230]],
];
function ramp(v: number): string {
  const t = Math.min(1, Math.max(0, v));
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i];
    const [p0, c0] = STOPS[i - 1];
    if (t <= p1) {
      const k = (t - p0) / (p1 - p0);
      return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * k)},${Math.round(c0[1] + (c1[1] - c0[1]) * k)},${Math.round(c0[2] + (c1[2] - c0[2]) * k)})`;
    }
  }
  return "rgb(255,244,230)";
}

interface Contact {
  cx: number;
  cy: number;
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  r: number;
  amp: number;
  ph: number;
}
const CONTACTS: Contact[] = [
  { cx: 0.5, cy: 0.3, ax: 0.08, ay: 0.05, sx: 0.23, sy: 0.17, r: 0.22, amp: 1.0, ph: 0 },
  { cx: 0.32, cy: 0.62, ax: 0.06, ay: 0.08, sx: 0.19, sy: 0.27, r: 0.17, amp: 0.8, ph: 1.7 },
  { cx: 0.7, cy: 0.66, ax: 0.07, ay: 0.06, sx: 0.29, sy: 0.21, r: 0.15, amp: 0.72, ph: 3.1 },
  { cx: 0.52, cy: 0.86, ax: 0.1, ay: 0.03, sx: 0.15, sy: 0.33, r: 0.14, amp: 0.55, ph: 4.4 },
];

export default function PressureField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    const start = performance.now();

    const paint = (now: number) => {
      if (!w || !h) return;
      const t = reduce ? 6 : (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      const gap = Math.max(2, w / COLS / 7);
      const cw = (w - gap * (COLS - 1)) / COLS;
      const ch = (h - gap * (ROWS - 1)) / ROWS;
      const rad = Math.min(cw, ch) * 0.28;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const u = (x + 0.5) / COLS;
          const v = (y + 0.5) / ROWS;
          // Socket silhouette: cells outside a tapered ellipse stay dark.
          const half = 0.46 - v * 0.14;
          const edge = Math.abs(u - 0.5) / half;
          if (edge > 1 || v < 0.03 || v > 0.97) continue;
          let load = 0.06 + 0.05 * Math.sin(u * 9 + t * 0.6) * Math.sin(v * 7 - t * 0.4);
          for (const c of CONTACTS) {
            const px = c.cx + Math.sin(t * c.sx + c.ph) * c.ax;
            const py = c.cy + Math.cos(t * c.sy + c.ph) * c.ay;
            const d2 = ((u - px) ** 2 + ((v - py) * 0.8) ** 2) / (c.r * c.r);
            const pulse = 0.82 + 0.18 * Math.sin(t * 1.3 + c.ph);
            load += c.amp * pulse * Math.exp(-d2 * 2.2);
          }
          load *= 1 - edge ** 6 * 0.6;
          const px = x * (cw + gap);
          const py = y * (ch + gap);
          ctx.fillStyle = ramp(load);
          ctx.globalAlpha = 0.35 + Math.min(0.65, load);
          ctx.beginPath();
          ctx.roundRect(px, py, cw, ch, rad);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const draw = (now: number) => {
      paint(now);
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    // Resizing a canvas clears it, so always repaint afterwards — with
    // reduced motion there is no animation loop to do it for us.
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden style={{ width: "100%", height: "100%", display: "block" }} />;
}
