import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySession, type AdminSession } from "@/lib/admin-session";
import { resolveAdmin } from "@/lib/admin-auth";

// アクティビティ内（Discord埋め込みSDK）からの Bearer トークンで管理者を解決する。
async function fromBearer(req: NextRequest): Promise<AdminSession | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` },
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));
  if (!res?.ok) return null;

  const user = (await res.json()) as { id: string; username: string; global_name: string | null };
  const admin = await resolveAdmin(user.id, user.global_name || user.username);
  if (!admin) return null;

  return { sub: admin.discord_user_id, name: admin.username, scope: admin.scope, dept: admin.department, exp: 0 };
}

// APIルート用のガード。
// 認証方法は2通り: アクティビティからの Bearer トークン、または /admin の署名Cookie。
// セッションが無効なら 401、scope不足なら 403 を返す。成功時は { session } を返す。
export async function requireAdmin(
  req: NextRequest,
  allowed?: AdminSession["scope"][],
): Promise<{ session: AdminSession } | { error: NextResponse }> {
  let session = await fromBearer(req);
  if (!session) {
    const cookieStore = await cookies();
    session = verifySession(cookieStore.get(ADMIN_COOKIE)?.value);
  }
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (allowed && !allowed.includes(session.scope)) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}
