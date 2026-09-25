"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminInfo, Model, RawSnapshot } from "@/lib/halcyon/types";
import { buildModel } from "@/lib/halcyon/model";
import { logoutAction, autoLogoutAction } from "@/app/login/actions";

export interface SortState {
  k: string | null;
  d: 1 | -1;
}

export interface Toast {
  id: number;
  msg: string;
  tone: "ok" | "warn";
}

export interface UiState {
  range: "7D" | "30D" | "90D";
  cr: [number, number] | null;
  pickerOpen: boolean;
  q: string;
  pStatus: string;
  page: number;
  expanded: string | null;
  sort: SortState;
  sq: string;
  sDevice: string;
  ssort: SortState;
  drawer: string | null;
  collapsed: boolean;
  mobileNav: boolean;
  notifOpen: boolean;
  palette: boolean;
  pq: string;
  pi: number;
  toasts: Toast[];
  report: string;
  paused: boolean;
  hidden: boolean;
}

export interface Prefs {
  compact: boolean;
}

const INITIAL: UiState = {
  range: "30D",
  cr: null,
  pickerOpen: false,
  q: "",
  pStatus: "All",
  page: 0,
  expanded: null,
  sort: { k: null, d: 1 },
  sq: "",
  sDevice: "All",
  ssort: { k: null, d: 1 },
  drawer: null,
  collapsed: false,
  mobileNav: false,
  notifOpen: false,
  palette: false,
  pq: "",
  pi: 0,
  toasts: [],
  report: "roster",
  paused: false,
  hidden: false,
};

const REFRESH_MS = 15_000;
const PREFS_KEY = "hc_prefs";
const SEEN_KEY = "hc_notif_seen";

// Data-protection timers (see the "data-protection hardening" plan): the tab
// blurs the instant it's hidden, and auto-signs-out after either the tab
// stays hidden or the admin stays idle past these thresholds.
const HIDDEN_LOGOUT_MS = 60_000;
const IDLE_LOGOUT_MS = 5 * 60_000;

interface DashCtx {
  model: Model;
  admin: AdminInfo;
  nowMs: number;
  ready: boolean;
  mobile: boolean;
  ui: UiState;
  set: (patch: Partial<UiState> | ((s: UiState) => Partial<UiState>)) => void;
  go: (href: string, patch?: Partial<UiState>) => void;
  toast: (msg: string, tone?: "ok" | "warn") => void;
  prefs: Prefs;
  setPref: (k: keyof Prefs, v: boolean) => void;
  notifSeen: number;
  markNotifsRead: () => void;
  refreshedAt: number | null;
  refreshNow: () => void;
  signOut: () => void;
}

const Ctx = createContext<DashCtx | null>(null);

export function useDash(): DashCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDash must be used inside <DashProvider>");
  return v;
}

const subscribeNoop = () => () => {};
const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

export function DashProvider({
  snapshot,
  admin,
  children,
}: {
  snapshot: RawSnapshot;
  admin: AdminInfo;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const model = useMemo(() => buildModel(snapshot), [snapshot]);

  // Time-dependent text is formatted in the browser's timezone, so nothing
  // derived from it renders until after hydration.
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const vw = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1400);
  const mobile = vw < 900;

  const [ui, setUi] = useState<UiState>(INITIAL);
  const set = useCallback<DashCtx["set"]>((patch) => setUi((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), []);

  const [prefs, setPrefs] = useState<Prefs>({ compact: false });
  const [notifSeen, setNotifSeen] = useState(0);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PREFS_KEY);
      if (p) setPrefs((cur) => ({ ...cur, ...JSON.parse(p) }));
      const s = Number(localStorage.getItem(SEEN_KEY));
      if (Number.isFinite(s)) setNotifSeen(s);
    } catch {}
  }, []);

  const setPref = useCallback((k: keyof Prefs, v: boolean) => {
    setPrefs((cur) => {
      const next = { ...cur, [k]: v };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const markNotifsRead = useCallback(() => {
    const t = Date.now();
    setNotifSeen(t);
    try {
      localStorage.setItem(SEEN_KEY, String(t));
    } catch {}
  }, []);

  const toastRef = useRef(0);
  const toast = useCallback<DashCtx["toast"]>((msg, tone = "ok") => {
    const id = ++toastRef.current;
    setUi((s) => ({ ...s, toasts: [...s.toasts, { id, msg, tone }] }));
    window.setTimeout(() => setUi((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  }, []);

  const go = useCallback<DashCtx["go"]>(
    (href, patch) => {
      setUi((s) => ({ ...s, drawer: null, palette: false, notifOpen: false, mobileNav: false, pickerOpen: false, ...patch }));
      router.push(href);
      try {
        window.scrollTo({ top: 0 });
      } catch {}
    },
    [router]
  );

  const refreshNow = useCallback(() => {
    router.refresh();
    setRefreshedAt(Date.now());
  }, [router]);

  useEffect(() => {
    setRefreshedAt(Date.now());
  }, []);

  useEffect(() => {
    if (ui.paused) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshNow();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [ui.paused, refreshNow]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setUi((s) => ({ ...s, palette: !s.palette, pq: "", pi: 0 }));
      }
      if (e.key === "Escape") {
        setUi((s) => ({ ...s, drawer: null, palette: false, notifOpen: false, pickerOpen: false, mobileNav: false }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Route changes made outside go() (back/forward, links) still dismiss overlays.
  useEffect(() => {
    setUi((s) => (s.drawer || s.notifOpen || s.mobileNav || s.pickerOpen ? { ...s, notifOpen: false, mobileNav: false, pickerOpen: false } : s));
  }, [pathname]);

  const signOut = useCallback(() => {
    void logoutAction();
  }, []);

  const autoSignOut = useCallback((reason: "idle" | "hidden") => {
    void autoLogoutAction(reason);
  }, []);

  // Blur the content the instant the tab is hidden/backgrounded/locked, and
  // auto-logout if it stays hidden past HIDDEN_LOGOUT_MS. This reacts to the
  // browser's normal, always-reliable visibilitychange event — it's not a
  // detector for any particular capture tool, just an instant privacy screen.
  useEffect(() => {
    let hideTimer: number | undefined;
    const onVisibility = () => {
      const isHidden = document.hidden;
      setUi((s) => (s.hidden === isHidden ? s : { ...s, hidden: isHidden }));
      if (isHidden) {
        hideTimer = window.setTimeout(() => autoSignOut("hidden"), HIDDEN_LOGOUT_MS);
      } else if (hideTimer) {
        window.clearTimeout(hideTimer);
        hideTimer = undefined;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [autoSignOut]);

  // Idle auto-logout: any interaction resets the clock.
  useEffect(() => {
    let idleTimer = window.setTimeout(() => autoSignOut("idle"), IDLE_LOGOUT_MS);
    const reset = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => autoSignOut("idle"), IDLE_LOGOUT_MS);
    };
    const events: (keyof DocumentEventMap)[] = ["mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));
    return () => {
      window.clearTimeout(idleTimer);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [autoSignOut]);

  // Deterrent layer only (documented as such — none of this stops a
  // determined user, it just removes the one-click paths): block the
  // right-click menu and the browser's own print/save/devtools shortcuts.
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && (k === "p" || k === "s")) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
      if (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const value = useMemo<DashCtx>(
    () => ({
      model,
      admin,
      nowMs: snapshot.nowMs,
      ready,
      mobile,
      ui,
      set,
      go,
      toast,
      prefs,
      setPref,
      notifSeen,
      markNotifsRead,
      refreshedAt,
      refreshNow,
      signOut,
    }),
    [model, admin, snapshot.nowMs, ready, mobile, ui, set, go, toast, prefs, setPref, notifSeen, markNotifsRead, refreshedAt, refreshNow, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
