"use server";

import { revalidatePath } from "next/cache";
import { createAdmin, removeAdmin } from "@/lib/adminAuth";
import { getSession } from "@/lib/session";

export interface AddTeammateState {
  error?: string;
  success?: boolean;
}

export async function addTeammateAction(_prev: AddTeammateState, formData: FormData): Promise<AddTeammateState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await createAdmin({ name, email, password });
  if (!result.ok) return { error: result.error };

  revalidatePath("/settings/team");
  return { success: true };
}

export async function removeTeammateAction(id: string) {
  const session = await getSession();
  if (session?.adminId === id) {
    // Refuse to let someone remove the account they're currently signed in
    // with — avoids locking yourself out with no one left to undo it.
    return;
  }
  await removeAdmin(id);
  revalidatePath("/settings/team");
}
