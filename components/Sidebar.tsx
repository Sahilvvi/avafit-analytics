"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Activity,
  UserCog,
  LineChart,
  LogOut,
  Database,
  Settings,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/sessions", label: "Sessions", icon: Activity },
  { href: "/users", label: "Testers", icon: UserCog },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/settings/team", label: "Team", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Sidebar({ adminName }: { adminName?: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop */}
      <aside className="card-glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col rounded-none border-y-0 border-l-0 md:flex">
        <div className="px-6 pb-6 pt-7">
          <Image src="/logo-wordmark.png" alt="AVA Fit" width={160} height={51} priority className="h-auto w-[104px]" />
          <p className="eyebrow mt-3">Admin console</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <p className="eyebrow px-3 pb-2 pt-1">Workspace</p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-accent/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-xl bg-surface-2 opacity-0 transition group-hover:opacity-100" />
                )}
                {active ? (
                  <motion.span
                    layoutId="nav-bar"
                    className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon
                  size={17}
                  strokeWidth={2}
                  className={clsx("relative", active ? "text-accent" : "text-text-muted group-hover:text-text-secondary")}
                />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          {adminName ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-bold uppercase text-text-secondary">
                {adminName.slice(0, 1)}
              </span>
              <p className="truncate text-xs font-medium text-text-secondary">{adminName}</p>
            </div>
          ) : null}
          <div className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2.5">
            <Database size={14} className="shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-text-secondary">Quorum Prosthetic</p>
              <p className="font-mono text-[10px] text-text-muted">supabase · connected</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition hover:bg-status-critical/10 hover:text-status-critical"
            >
              <LogOut size={17} strokeWidth={2} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile */}
      <header className="card-glass sticky top-0 z-30 rounded-none border-x-0 border-t-0 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Image src="/logo-wordmark.png" alt="AVA Fit" width={160} height={51} priority className="h-auto w-[72px]" />
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost h-8" aria-label="Sign out">
              <LogOut size={14} /> Sign out
            </button>
          </form>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  active ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-primary"
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
