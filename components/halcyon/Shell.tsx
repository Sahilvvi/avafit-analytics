"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Icon, type IconName } from "./icons";
import { useDash } from "./store";
import { BRAND, LiveDot, Orb, Watermark, cssVars } from "./ui";
import { initialsOf } from "@/lib/halcyon/format";
import { Drawer, Notifications, Palette, Toasts, useNotifications } from "./Overlays";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/patients", label: "Patients", icon: "users" },
  { href: "/sessions", label: "Sessions", icon: "activity" },
  { href: "/testers", label: "Testers", icon: "testers" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

const ITEM_H = 36;
const ITEM_GAP = 2;
const EASE = [0.2, 0.8, 0.2, 1] as const;

function activeIndex(pathname: string): number {
  if (pathname === "/") return 0;
  const i = NAV.findIndex((n, k) => k > 0 && pathname.startsWith(n.href));
  return i < 0 ? 0 : i;
}

/** Tracks the cursor inside whichever glass card it's over and exposes it as
 *  --mx/--my, which globals.css turns into a soft spotlight. One delegated
 *  listener for the whole app instead of a handler per card. */
function useCardSpotlight() {
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = (e.target as Element | null)?.closest?.(".hc-card, .hc-kpi") as HTMLElement | null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { ui, set, go, mobile, admin, signOut, ready, model } = useDash();
  const pathname = usePathname();
  const idx = activeIndex(pathname);
  const collapsed = !mobile && ui.collapsed;
  const sw = mobile ? 264 : collapsed ? 72 : 240;
  const lblOp = collapsed ? 0 : 1;
  const { unread } = useNotifications();
  const [isMac, setIsMac] = useState(true);
  useEffect(() => setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform)), []);
  useCardSpotlight();

  const flagTip = useMemo(() => `${model.patients.length} patients · ${model.sessions.length} sessions`, [model]);
  const section = NAV[idx]?.label ?? "Overview";

  return (
    <div style={{ minHeight: "100vh", color: "#EDEEF2", position: "relative" }}>
      {/* Framer owns this element's transform, so the mobile off-canvas
          position goes through `animate`, not an inline transform. */}
      <motion.aside
        initial={{ opacity: 0, x: mobile ? "-100%" : -12 }}
        animate={{ opacity: 1, x: mobile && !ui.mobileNav ? "-100%" : 0 }}
        transition={{ duration: mobile ? 0.35 : 0.5, ease: EASE }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 30,
          width: sw,
          transition: "width .4s cubic-bezier(.3,.9,.25,1)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          padding: "18px 12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          background: "linear-gradient(180deg, rgba(14,15,20,.72), rgba(9,10,13,.62))",
          backdropFilter: "saturate(160%) blur(28px)",
          WebkitBackdropFilter: "saturate(160%) blur(28px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset -1px 0 0 rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 8px" }}>
          <Orb size={28} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: lblOp, transition: "opacity .25s" }}>
            <span className="hc-brand" style={{ fontSize: 15.5 }}>{BRAND}</span>
            <span style={{ font: "500 10px var(--hc-mono)", letterSpacing: ".08em", color: "#8C909B", padding: "2px 6px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)" }}>ADMIN</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="hc-eyebrow" style={{ padding: "0 10px", opacity: lblOp, transition: "opacity .25s" }}>Workspace</span>
          <nav style={{ position: "relative", display: "flex", flexDirection: "column", gap: ITEM_GAP }}>
            <motion.div
              initial={false}
              animate={{ top: idx * (ITEM_H + ITEM_GAP) }}
              transition={{ type: "spring", stiffness: 480, damping: 38 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: ITEM_H,
                borderRadius: 9,
                background: "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.06), 0 6px 16px -8px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ position: "absolute", left: -12, top: 10, width: 2, height: 16, borderRadius: "0 2px 2px 0", background: "#8083FF", boxShadow: "0 0 10px rgba(128,131,255,.8)" }} />
            </motion.div>
            {NAV.map((n, i) => {
              const on = i === idx;
              return (
                <motion.button
                  key={n.href}
                  whileTap={{ scale: 0.98 }}
                  className="hc-nav-item"
                  title={n.label}
                  style={cssVars({ "--fg": on ? "#EDEEF2" : "#8C909B" })}
                  onClick={() => go(n.href)}
                >
                  <span style={{ display: "flex", flex: "none", color: on ? "#B4B6FF" : "#6B6F7B", transition: "color .25s" }}>
                    <Icon name={n.icon} size={17} />
                  </span>
                  <span style={{ flex: 1, opacity: lblOp, transition: "opacity .25s", textAlign: "left" }}>{n.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => (mobile ? set({ mobileNav: false }) : set({ collapsed: !ui.collapsed }))}
            className="hc-nav-item"
            style={cssVars({ "--fg": "#6B6F7B" })}
          >
            <span style={{ display: "flex", flex: "none", transform: collapsed ? "rotate(180deg)" : "none", transition: "transform .4s cubic-bezier(.3,.9,.25,1)" }}>
              <Icon name="collapse" size={17} />
            </span>
            <span style={{ opacity: lblOp, transition: "opacity .25s" }}>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
          <div className="hc-hairline" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 0" }}>
            <div
              title={flagTip}
              style={{ width: 32, height: 32, flex: "none", borderRadius: 9, background: "linear-gradient(135deg,#34364A,#1B1C24)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11.5px var(--hc-sans)", color: "#EDEEF2" }}
            >
              {initialsOf(admin.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3, opacity: lblOp, transition: "opacity .25s" }}>
              <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{admin.name}</span>
              <span style={{ fontSize: 11.5, color: "#6B6F7B", overflow: "hidden", textOverflow: "ellipsis" }}>{admin.email}</span>
            </div>
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="hc-iconbtn"
              style={{ width: 30, height: 30, border: 0, background: "transparent", color: "#6B6F7B", opacity: lblOp }}
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>
      </motion.aside>

      <div style={{ marginLeft: mobile ? 0 : sw, minWidth: 0, transition: "margin-left .4s cubic-bezier(.3,.9,.25,1)" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "linear-gradient(180deg, rgba(8,9,12,.78), rgba(8,9,12,.52))",
            backdropFilter: "saturate(160%) blur(22px)",
            WebkitBackdropFilter: "saturate(160%) blur(22px)",
          }}
        >
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "11px 28px", display: "flex", alignItems: "center", gap: 14 }}>
            {mobile ? (
              <button className="hc-iconbtn" onClick={() => set({ mobileNav: true })} aria-label="Menu">
                <Icon name="menu" size={16} />
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, font: "500 13px var(--hc-sans)", color: "#6B6F7B", whiteSpace: "nowrap" }}>
                <span>AVA Fit</span>
                <span style={{ color: "#3A3D47" }}>/</span>
                <motion.span key={section} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }} style={{ color: "#EDEEF2" }}>
                  {section}
                </motion.span>
              </div>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ position: "relative", flex: "0 1 320px", minWidth: 0 }}>
              <span style={{ position: "absolute", left: 11, top: 9, color: "#6B6F7B", display: "flex" }}>
                <Icon name="search" size={15} sw={2} />
              </span>
              <input
                className="hc-search-head"
                value={ui.q}
                onChange={(e) => {
                  set({ q: e.target.value, page: 0 });
                  if (pathname !== "/patients") go("/patients", { q: e.target.value, page: 0 });
                }}
                placeholder={mobile ? "Search…" : "Search patients, codes, testers"}
              />
              {mobile ? null : (
                <button
                  onClick={() => set({ palette: true, pq: "", pi: 0 })}
                  title="Command palette"
                  style={{ position: "absolute", right: 6, top: 6, height: 22, font: "500 10.5px var(--hc-mono)", color: "#8C909B", padding: "0 6px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, background: "rgba(255,255,255,0.04)", boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.4)", cursor: "pointer" }}
                >
                  {isMac ? "⌘K" : "Ctrl K"}
                </button>
              )}
            </div>
            <button
              onClick={() => set({ paused: !ui.paused })}
              title={ui.paused ? "Auto-refresh paused — click to resume" : "Auto-refresh every 15s — click to pause"}
              style={{ display: "flex", alignItems: "center", gap: 7, height: 30, padding: "0 10px", borderRadius: 999, font: "500 10.5px var(--hc-mono)", letterSpacing: ".08em", color: ui.paused ? "#8C909B" : "#7FE0B4", background: ui.paused ? "rgba(255,255,255,0.04)" : "rgba(62,207,142,0.08)", border: `1px solid ${ui.paused ? "rgba(255,255,255,0.08)" : "rgba(62,207,142,0.22)"}`, cursor: "pointer" }}
            >
              {ui.paused ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5E626D" }} /> : <LiveDot size={6} />}
              {ui.paused ? "PAUSED" : "LIVE"}
            </button>
            <button className="hc-iconbtn" onClick={() => set({ notifOpen: !ui.notifOpen })} aria-label="Notifications" style={{ position: "relative" }}>
              <Icon name="bell" size={16} />
              {ready && unread > 0 ? (
                <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#F4606C", boxShadow: "0 0 0 2px #0B0C10" }} />
              ) : null}
            </button>
          </div>
          <div className="hc-hairline" />
        </header>

        <main
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1400,
            margin: "0 auto",
            padding: mobile ? "20px 16px 64px" : "30px 28px 72px",
            filter: ui.hidden ? "blur(20px)" : "none",
            transition: ui.hidden ? "none" : "filter .2s ease",
          }}
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <Watermark />

      {mobile && ui.mobileNav ? (
        <div onClick={() => set({ mobileNav: false })} style={{ position: "fixed", inset: 0, zIndex: 29, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", animation: "hcFadeIn .25s both" }} />
      ) : null}

      <Drawer />
      <Notifications />
      <Palette />
      <Toasts />
    </div>
  );
}
