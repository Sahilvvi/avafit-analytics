/**
 * Session signing uses the Web Crypto API (`crypto.subtle`) rather than
 * Node's `crypto` module on purpose — this file is imported from
 * `middleware.ts`, which Next.js runs on the Edge runtime, and Edge doesn't
 * have Node's `crypto`. Web Crypto (and btoa/atob, used for the payload
 * encoding below) works in both Node (18+) and Edge, so one implementation
 * covers middleware, server actions, and route handlers.
 */

export const SESSION_COOKIE = "avafit_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface SessionPayload {
  adminId: string;
  name: string;
  expiry: number;
}

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string): Promise<string> {
  const key = await hmacKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(sig);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function encodePayload(payload: SessionPayload): string {
  // base64url (RFC 4648 §5) so it's cookie-safe without percent-encoding.
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodePayload(encoded: string): SessionPayload | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const parsed = JSON.parse(json);
    if (typeof parsed?.adminId === "string" && typeof parsed?.expiry === "number") {
      return { adminId: parsed.adminId, name: String(parsed.name ?? ""), expiry: parsed.expiry };
    }
    return null;
  } catch {
    return null;
  }
}

/** Builds a signed "payload.signature" token — no server-side session store needed. */
export async function createSessionToken(adminId: string, name: string): Promise<string> {
  const payload = encodePayload({ adminId, name, expiry: Date.now() + SESSION_TTL_MS });
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await sign(payload);
  if (!constantTimeEqual(expected, signature)) return null;

  const decoded = decodePayload(payload);
  if (!decoded) return null;
  if (Date.now() > decoded.expiry) return null;

  return decoded;
}
