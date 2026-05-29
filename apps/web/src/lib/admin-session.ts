import { createHmac, timingSafeEqual } from "crypto";
import type { AdminScope } from "@/types/database";

export const ADMIN_COOKIE = "admin_session";
const MAX_AGE_SEC = 60 * 60 * 8; // 8時間

export interface AdminSession {
  sub: string; // discord_user_id
  name: string;
  scope: AdminScope;
  dept: string | null;
  exp: number; // unix秒
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(payload).digest());
}

export function createSession(data: Omit<AdminSession, "exp">): string {
  const session: AdminSession = { ...data, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC };
  const payload = b64url(Buffer.from(JSON.stringify(session)));
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64").toString()) as AdminSession;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export const cookieMaxAge = MAX_AGE_SEC;
