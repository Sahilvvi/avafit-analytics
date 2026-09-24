"use server";

import { revalidatePath } from "next/cache";
import { updateAdminProfile } from "@/lib/data";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";

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
    maxAge: 60 * 60 * 12,
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}
