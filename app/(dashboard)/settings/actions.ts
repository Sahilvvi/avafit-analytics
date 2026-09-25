"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateAdminProfile } from "@/lib/data";
import { changeAdminPassword, getAdminById, logAudit } from "@/lib/adminAuth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_S } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { cookies, headers } from "next/headers";

export interface SaveProfileState {
  error?: string;
  success?: boolean;
}

export async function saveProfileAction(_prev: SaveProfileState, formData: FormData): Promise<SaveProfileState> {
  const session = await getSession();
  if (!session) return { error: "Your session expired — sign in again." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (name.length < 2) return { error: "Enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address." };

  const result = await updateAdminProfile(session.adminId, { name, email });
  if (!result.ok) return { error: result.error };

  // Session cookie carries the display name — refresh it so the sidebar
  // updates immediately without a re-login.
  const token = await createSessionToken(session.adminId, name);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

export async function changePasswordAction(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) return { error: "Your session expired — sign in again." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!current || !next) return { error: "Fill in both password fields." };
  if (next !== confirm) return { error: "New passwords don't match." };

  const result = await changeAdminPassword(session.adminId, current, next);
  if (!result.ok) return { error: result.error };

  const admin = await getAdminById(session.adminId);
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  await logAudit(session.adminId, admin?.email ?? session.name, "password_changed", { ip, userAgent: h.get("user-agent") });

  // Force re-authentication with the new password rather than trusting the
  // existing cookie — a password change should prove the new credential
  // works, not just quietly keep the old session alive.
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
