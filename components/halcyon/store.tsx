"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminInfo, Model, RawSnapshot } from "@/lib/halcyon/types";
import { buildModel } from "@/lib/halcyon/model";
import { csvEscape } from "@/lib/halcyon/format";
import { logoutAction } from "@/app/login/actions";

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
}

export interface Prefs {
  compact: boolean;
  glow: boolean;
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
};

const REFRESH_MS = 15_000;
const PREFS_KEY = "hc_prefs";
const SEEN_KEY = "hc_notif_seen";

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
  exportCSV: (name: string, rows: unknown[][]) => void;
  exportPDF: () => void;
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

  const [prefs, setPrefs] = useState<Prefs>({ compact: false, glow: true });
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

  const exportCSV = useCallback<DashCtx["exportCSV"]>(
    (name, rows) => {
      const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`Exported ${name}.csv · ${Math.max(0, rows.length - 1)} rows`);
    },
    [toast]
  );

  const exportPDF = useCallback(() => {
    toast("Preparing PDF…");
    window.setTimeout(() => window.print(), 350);
  }, [toast]);

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
      exportCSV,
      exportPDF,
      prefs,
      setPref,
      notifSeen,
      markNotifsRead,
      refreshedAt,
      refreshNow,
      signOut,
    }),
    [model, admin, snapshot.nowMs, ready, mobile, ui, set, go, toast, exportCSV, exportPDF, prefs, setPref, notifSeen, markNotifsRead, refreshedAt, refreshNow, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
