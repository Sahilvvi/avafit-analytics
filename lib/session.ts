import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./auth";

/** Reads and verifies the current request's session cookie. Server
 *  components/actions only (uses next/headers) — middleware reads the
 *  cookie itself via `request.cookies`. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
