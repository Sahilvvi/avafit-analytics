"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { verifyAdminCredentials, needsSetup } from "@/lib/adminAuth";

export interface LoginState {
  error?: string;
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
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
