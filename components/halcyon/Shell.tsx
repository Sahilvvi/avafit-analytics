"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

function activeIndex(pathname: string): number {
  if (pathname === "/") return 0;
  const i = NAV.findIndex((n, k) => k > 0 && pathname.startsWith(n.href));
  return i < 0 ? 0 : i;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { ui, set, go, mobile, admin, signOut, ready, model } = useDash();
  const pathname = usePathname();
  const idx = activeIndex(pathname);
  const collapsed = !mobile && ui.collapsed;
  const sw = mobile ? 264 : collapsed ? 76 : 248;
  const lblOp = collapsed ? 0 : 1;
  const { unread } = useNotifications();
  const [isMac, setIsMac] = useState(true);
  useEffect(() => setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform)), []);

  const flagTip = useMemo(() => `${model.patients.length} patients · ${model.sessions.length} sessions`, [model]);

  return (
    <div style={{ minHeight: "100vh", background: "#F6F7FB", color: "#0F172A", position: "relative", animation: "hcAppIn .7s cubic-bezier(.2,.8,.2,1) backwards" }}>
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 30,
          width: sw,
          transform: mobile && !ui.mobileNav ? "translateX(-100%)" : "none",
          transition: "width .4s cubic-bezier(.3,.9,.25,1),transform .4s cubic-bezier(.3,.9,.25,1)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          padding: "22px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          background: "rgba(255,255,255,.86)",
          backdropFilter: "saturate(160%) blur(24px)",
          WebkitBackdropFilter: "saturate(160%) blur(24px)",
          borderRight: "1px solid rgba(15,23,42,0.066)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px" }}>
          <Orb />
          <span className="hc-brand" style={{ fontSize: 17, opacity: lblOp, transition: "opacity .25s" }}>{BRAND}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="hc-eyebrow" style={{ color: "#8A94A6", letterSpacing: ".08em", padding: "0 12px", opacity: lblOp, transition: "opacity .25s" }}>
            WORKSPACE
          </span>
          <nav style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
            <motion.div
              animate={{ top: idx * 46 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 42,
                borderRadius: 11,
                background: "linear-gradient(90deg,rgba(67, 52, 220,.14),rgba(15,23,42,0.044))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7),inset 0 0 0 1px rgba(67, 52, 220,.18)",
              }}
            >
              <div style={{ position: "absolute", left: -16, top: 11, width: 3, height: 20, borderRadius: "0 3px 3px 0", background: "#4334DC", boxShadow: "0 0 12px #4334DC" }} />
            </motion.div>
            {NAV.map((n, i) => (
              <motion.button
                key={n.href}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className="hc-nav-item"
                title={n.label}
                style={cssVars({ "--fg": i === idx ? "#0F172A" : "#5B6577" })}
                onClick={() => go(n.href)}
              >
                <span style={{ display: "flex", flex: "none", color: i === idx ? "#4334DC" : "#64748B", transition: "color .25s" }}>
                  <Icon name={n.icon} />
                </span>
                <span style={{ flex: 1, opacity: lblOp, transition: "opacity .25s", textAlign: "left" }}>{n.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => (mobile ? set({ mobileNav: false }) : set({ collapsed: !ui.collapsed }))}
            className="hc-btn"
            style={{ height: 40, border: 0, background: "transparent", color: "#64748B", font: "500 13.5px var(--hc-sans)", padding: "0 12px", gap: 12 }}
          >
            <span style={{ display: "flex", flex: "none", transform: collapsed ? "rotate(180deg)" : "none", transition: "transform .4s cubic-bezier(.3,.9,.25,1)" }}>
              <Icon name="collapse" />
            </span>
            <span style={{ opacity: lblOp, transition: "opacity .25s" }}>{collapsed ? "Expand" : "Collapse"}</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 6px 0", borderTop: "1px solid rgba(15,23,42,0.066)" }}>
            <div
              title={flagTip}
              style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: "linear-gradient(135deg,#E2E8F0,#CBD5E1)", border: "1px solid rgba(15,23,42,0.110)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12px var(--hc-sans)" }}
            >
              {initialsOf(admin.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.25, opacity: lblOp, transition: "opacity .25s" }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{admin.name}</span>
              <span style={{ fontSize: 12, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis" }}>{admin.email}</span>
            </div>
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="hc-iconbtn"
              style={{ width: 32, height: 32, borderRadius: 9, background: "transparent", color: "#64748B", opacity: lblOp }}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div style={{ marginLeft: mobile ? 0 : sw, minWidth: 0, transition: "margin-left .4s cubic-bezier(.3,.9,.25,1)" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "rgba(246,247,251,.78)",
            backdropFilter: "saturate(160%) blur(20px)",
            WebkitBackdropFilter: "saturate(160%) blur(20px)",
            borderBottom: "1px solid rgba(15,23,42,0.066)",
          }}
        >
          <div style={{ maxWidth: 1440, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            {mobile ? (
              <button className="hc-glass" onClick={() => set({ mobileNav: true })} aria-label="Menu" style={{ width: 36, height: 36, flex: "none", borderRadius: 10, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="menu" size={17} />
              </button>
            ) : null}
            <div style={{ position: "relative", flex: "0 1 360px", minWidth: 0 }}>
              <span style={{ position: "absolute", left: 12, top: 10, color: "#64748B", display: "flex" }}>
                <Icon name="search" size={16} sw={2} />
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
                  style={{ position: "absolute", right: 6, top: 6, height: 24, font: "500 11px var(--hc-mono)", color: "#5B6577", padding: "0 7px", border: "1px solid rgba(15,23,42,0.132)", borderRadius: 6, background: "rgba(15,23,42,0.044)", cursor: "pointer" }}
                >
                  {isMac ? "⌘K" : "Ctrl K"}
                </button>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => set({ paused: !ui.paused })}
              title={ui.paused ? "Auto-refresh paused — click to resume" : "Auto-refresh every 15s — click to pause"}
              style={{ display: "flex", alignItems: "center", gap: 8, font: "500 12px var(--hc-mono)", color: "#64748B", background: "none", border: 0, cursor: "pointer", padding: 0 }}
            >
              {ui.paused ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#94A3B8" }} /> : <LiveDot />}
              {ui.paused ? "PAUSED" : "LIVE"}
            </button>
            <button
              className="hc-glass"
              onClick={() => set({ notifOpen: !ui.notifOpen })}
              aria-label="Notifications"
              style={{ position: "relative", width: 36, height: 36, borderRadius: 10, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
            >
              <Icon name="bell" size={17} />
              {ready && unread > 0 ? (
                <span style={{ position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#E11D48", boxShadow: "0 0 0 2px #F6F7FB,0 0 10px #E11D48" }} />
              ) : null}
            </button>
          </div>
        </header>

        <main
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1440,
            margin: "0 auto",
            padding: mobile ? "20px 16px 64px" : "32px 28px 64px",
            filter: ui.hidden ? "blur(20px)" : "none",
            transition: ui.hidden ? "none" : "filter .2s ease",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Watermark />

      {mobile && ui.mobileNav ? (
        <div onClick={() => set({ mobileNav: false })} style={{ position: "fixed", inset: 0, zIndex: 29, background: "rgba(15,23,42,.28)", backdropFilter: "blur(3px)", animation: "hcFadeIn .25s both" }} />
      ) : null}

      <Drawer />
      <Notifications />
      <Palette />
      <Toasts />
    </div>
  );
}
