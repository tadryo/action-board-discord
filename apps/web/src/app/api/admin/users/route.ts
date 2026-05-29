import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// アクションボードに参加している（= users テーブルに登録済みの）メンバー一覧。
// 権限付与の宛先をリストから選ぶために使う。
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req, ["super", "developer"]);
  if ("error" in guard) return guard.error;

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("discord_user_id, username, avatar")
    .order("username");

  if (error) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  return NextResponse.json({ users: data }, { headers: { "Cache-Control": "private, no-store" } });
}
