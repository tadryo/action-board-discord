import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { BadgeRow, BadgeWithEarned, UserBadgeRow, UserRow } from "@/types/database";

export const dynamic = "force-dynamic";

// 公開プロフィール: 任意のメンバーのレベル算出元(ポイント)・バッジ・直近の達成を返す。
export async function GET(_req: NextRequest, { params }: { params: Promise<{ discordId: string }> }) {
  const { discordId } = await params;
  if (!/^\d{17,19}$/.test(discordId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: user } = await admin
    .from("users")
    .select("id, discord_user_id, username, avatar, total_points, created_at, twitter_url, github_url, instagram_url")
    .eq("discord_user_id", discordId)
    .maybeSingle<Pick<UserRow, "id" | "discord_user_id" | "username" | "avatar" | "total_points" | "created_at" | "twitter_url" | "github_url" | "instagram_url">>();

  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [badgesRes, earnedRes, achRes] = await Promise.all([
    admin.from("badges").select("*").order("sort_no"),
    admin.from("user_badges").select("badge_id, awarded_at").eq("user_id", user.id),
    admin.from("achievements").select("id, achieved_at, points_earned, mission:missions(title)").eq("user_id", user.id).order("achieved_at", { ascending: false }).limit(20),
  ]);

  const earnedMap = new Map<string, string>();
  for (const ub of ((earnedRes.data ?? []) as Pick<UserBadgeRow, "badge_id" | "awarded_at">[])) {
    earnedMap.set(ub.badge_id, ub.awarded_at);
  }
  const badges: BadgeWithEarned[] = ((badgesRes.data ?? []) as BadgeRow[]).map((b) => ({
    ...b,
    earned: earnedMap.has(b.id),
    awarded_at: earnedMap.get(b.id) ?? null,
  }));

  const achievements = ((achRes.data ?? []) as unknown as { id: string; achieved_at: string; points_earned: number; mission: { title: string } | null }[])
    .map((a) => ({ id: a.id, achieved_at: a.achieved_at, points_earned: a.points_earned, mission_title: a.mission?.title ?? null }));

  return NextResponse.json({ user, badges, achievements }, {
    headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
  });
}
