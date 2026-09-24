"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { createAdmin, needsSetup } from "@/lib/adminAuth";

export interface SetupState {
  error?: string;
}

export async function setupAction(_prevState: SetupState, formData: FormData): Promise<SetupState> {
  // Re-check at submit time too — this route must permanently disable itself
  // the moment the first account exists, even under a race.
  if (!(await needsSetup())) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const result = await createAdmin({ name, email, password });
  if (!result.ok) {
    return { error: result.error };
  }

  const token = await createSessionToken(result.id, name.trim());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/");
}
