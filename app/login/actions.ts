"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { verifyAdminCredentials, needsSetup, logAudit, getAdminById } from "@/lib/adminAuth";
import { getSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  return { ip, userAgent: h.get("user-agent") };
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (await needsSetup()) {
    redirect("/setup");
  }

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    return { error: "Incorrect email or password." };
  }

  await logAudit(admin.id, admin.email, "login", await requestMeta());

  const token = await createSessionToken(admin.id, admin.name);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Remember me checked: persists 12h. Unchecked: a session cookie that's
    // gone once the browser closes (no maxAge/expires at all).
    ...(remember ? { maxAge: 60 * 60 * 12 } : {}),
  });

  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    const admin = await getAdminById(session.adminId);
    await logAudit(session.adminId, admin?.email ?? session.name, "logout", await requestMeta());
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

/** Called by the client's idle/tab-hidden timers (store.tsx) — same effect
 *  as logoutAction, but tagged with why it happened for the audit log. */
export async function autoLogoutAction(reason: "idle" | "hidden") {
  const session = await getSession();
  if (session) {
    const admin = await getAdminById(session.adminId);
    await logAudit(session.adminId, admin?.email ?? session.name, reason === "idle" ? "idle_logout" : "hidden_logout", await requestMeta());
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
