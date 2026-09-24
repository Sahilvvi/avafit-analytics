import "server-only";
import bcrypt from "bcryptjs";
import {
  countAdminUsers,
  deleteAdminUser,
  fetchAdminUserByEmail,
  fetchAdminUserById,
  fetchAdminUsers,
  fetchAuditLog,
  insertAdminUser,
  insertAuditLog,
  touchAdminLogin,
} from "./data";
import type { AdminUser, AuditLogEntry } from "./types";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verifies email+password against `admin_users`. Returns the row (never the
 *  hash — callers should discard it) on success, null on any failure. Always
 *  runs a hash comparison even for an unknown email, so response timing
 *  doesn't leak which emails exist. */
export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  const user = await fetchAdminUserByEmail(email.trim());
  const hash = user?.password_hash ?? "$2a$10$invalidsaltinvalidsaltinuwZ0lXk4v6b4b8b8b8b8b8b8b8b8b8"; // dummy hash, constant-time-ish
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) return null;
  await touchAdminLogin(user.id);
  return user;
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  return fetchAdminUserById(id);
}

export async function needsSetup(): Promise<boolean> {
  return (await countAdminUsers()) === 0;
}

export async function listTeam(): Promise<AdminUser[]> {
  return fetchAdminUsers();
}

export async function createAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim()) return { ok: false, error: "Name is required." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const existing = await fetchAdminUserByEmail(email);
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const password_hash = await hashPassword(input.password);
  const result = await insertAdminUser({ name: input.name.trim(), email, password_hash });
  if (!result.ok) return { ok: false, error: "Could not create the account. Try again." };
  return result;
}

export async function removeAdmin(id: string): Promise<void> {
  await deleteAdminUser(id);
}

export async function logAudit(
  adminId: string | null,
  email: string,
  action: AuditLogEntry["action"],
  req: { ip: string | null; userAgent: string | null }
): Promise<void> {
  await insertAuditLog({ admin_id: adminId, admin_email: email, action, ip: req.ip, user_agent: req.userAgent });
}

export async function recentAuditLog(limit = 20): Promise<AuditLogEntry[]> {
  return fetchAuditLog(limit);
}
