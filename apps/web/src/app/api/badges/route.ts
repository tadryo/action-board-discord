import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { BadgeRow, BadgeWithEarned, UserBadgeRow } from "@/types/database";

export const dynamic = "force-dynamic";

// 全バッジ定義に、指定ユーザーが獲得済みかどうかを付与して返す。
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "Invalid user_id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const [badgesRes, earnedRes] = await Promise.all([
    admin.from("badges").select("*").order("sort_no"),
    admin.from("user_badges").select("badge_id, awarded_at").eq("user_id", userId),
  ]);

  if (badgesRes.error || earnedRes.error) {
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }

  const earnedMap = new Map<string, string>();
  for (const ub of (earnedRes.data as Pick<UserBadgeRow, "badge_id" | "awarded_at">[])) {
    earnedMap.set(ub.badge_id, ub.awarded_at);
  }

  const badges: BadgeWithEarned[] = (badgesRes.data as BadgeRow[]).map((b) => ({
    ...b,
    earned: earnedMap.has(b.id),
    awarded_at: earnedMap.get(b.id) ?? null,
  }));

  return NextResponse.json(badges, {
    headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
  });
}
