import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySession, type AdminSession } from "@/lib/admin-session";

// APIルート用のガード。
// セッションが無効なら NextResponse(401)、scope不足なら NextResponse(403) を返す。
// 成功時は { session } を返す。
export async function requireAdmin(
  allowed?: AdminSession["scope"][],
): Promise<{ session: AdminSession } | { error: NextResponse }> {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (allowed && !allowed.includes(session.scope)) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}
