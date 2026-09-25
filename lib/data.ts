import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "./supabaseAdmin";
import type { AdminUser, AuditLogEntry, AuthUser, Patient, Session, UserSettings } from "./types";

/**
 * Every page navigation used to call these fresh — 4 Supabase round trips
 * (patients, sessions, user_settings, paginated auth admin listUsers) on
 * every single click, because React's `cache()` only dedupes *within* one
 * request, not across navigations, and the dashboard layout is
 * force-dynamic. That's what made clicking into a patient feel slow.
 *
 * `unstable_cache` caches across requests/navigations for REVALIDATE_S,
 * matching the UI's own 15s "Live" auto-refresh cadence — so data still
 * feels live, but repeat navigations within that window are instant
 * (served from cache, zero network round trips).
 */
const REVALIDATE_S = 10;

export const fetchPatients = unstable_cache(
  async (): Promise<Patient[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("patients").select("*");
    if (error) {
      console.error("fetchPatients failed:", error.message);
      return [];
    }
    return (data ?? []) as Patient[];
  },
  ["patients"],
  { revalidate: REVALIDATE_S, tags: ["patients"] }
);

export const fetchSessions = unstable_cache(
  async (): Promise<Session[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("sessions").select("*");
    if (error) {
      console.error("fetchSessions failed:", error.message);
      return [];
    }
    return (data ?? []) as Session[];
  },
  ["sessions"],
  { revalidate: REVALIDATE_S, tags: ["sessions"] }
);

export const fetchUserSettings = unstable_cache(
  async (): Promise<UserSettings[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("user_settings").select("*");
    if (error) {
      console.error("fetchUserSettings failed:", error.message);
      return [];
    }
    return (data ?? []) as UserSettings[];
  },
  ["user_settings"],
  { revalidate: REVALIDATE_S, tags: ["testers"] }
);

/** Paginates through Supabase Auth's admin user list (not a table, no RLS involved). */
export const fetchAuthUsers = unstable_cache(
  async (): Promise<AuthUser[]> => {
    const supabase = getSupabaseAdmin();
    const users: AuthUser[] = [];
    const perPage = 200;
    const maxPages = 25; // safety cap: 5,000 users

    for (let page = 1; page <= maxPages; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error("fetchAuthUsers failed:", error.message);
        break;
      }
      const batch = (data?.users ?? []) as unknown as AuthUser[];
      users.push(...batch);
      if (batch.length < perPage) break;
    }

    return users;
  },
  ["auth-users"],
  { revalidate: REVALIDATE_S, tags: ["testers"] }
);

export async function fetchAll() {
  const [patients, sessions, userSettings, authUsers] = await Promise.all([
    fetchPatients(),
    fetchSessions(),
    fetchUserSettings(),
    fetchAuthUsers(),
  ]);
  return { patients, sessions, userSettings, authUsers };
}

// --- Admin accounts (per-person sign-in, see lib/adminAuth.ts) ---------

/** Not cached — auth-critical reads must always hit the source of truth. */
export async function fetchAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .ilike("email", email)
    .maybeSingle();
  if (error) {
    console.error("fetchAdminUserByEmail failed:", error.message);
    return null;
  }
  return (data as AdminUser | null) ?? null;
}

export async function fetchAdminUserById(id: string): Promise<AdminUser | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("admin_users").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("fetchAdminUserById failed:", error.message);
    return null;
  }
  return (data as AdminUser | null) ?? null;
}

export async function countAdminUsers(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase.from("admin_users").select("*", { count: "exact", head: true });
  if (error) {
    console.error("countAdminUsers failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("admin_users").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("fetchAdminUsers failed:", error.message);
    return [];
  }
  return (data ?? []) as AdminUser[];
}

export async function insertAdminUser(row: {
  name: string;
  email: string;
  password_hash: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("admin_users").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

export async function deleteAdminUser(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("admin_users").delete().eq("id", id);
}

export async function touchAdminLogin(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", id);
}

export async function updateAdminProfile(
  id: string,
  fields: { name: string; email: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("admin_users").update({ name: fields.name, email: fields.email.toLowerCase() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// --- Audit log (traceability layer — see the data-protection plan) -----

export async function insertAuditLog(entry: {
  admin_id: string | null;
  admin_email: string;
  action: AuditLogEntry["action"];
  ip: string | null;
  user_agent: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("admin_audit_log").insert(entry);
  if (error) console.error("insertAuditLog failed:", error.message);
}

export async function countRecentFailedLogins(email: string, sinceMs: number): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("admin_audit_log")
    .select("*", { count: "exact", head: true })
    .eq("action", "login_failed")
    .ilike("admin_email", email)
    .gte("created_at", new Date(sinceMs).toISOString());
  if (error) {
    console.error("countRecentFailedLogins failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function fetchAuditLog(limit = 20): Promise<AuditLogEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchAuditLog failed:", error.message);
    return [];
  }
  return (data ?? []) as AuditLogEntry[];
}
