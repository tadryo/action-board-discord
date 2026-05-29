import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { TimelineEntry } from "@/types/database";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  achieved_at: string;
  points_earned: number;
  user: { discord_user_id: string; username: string; avatar: string | null } | null;
  mission: { title: string } | null;
}

// 全メンバーの直近の達成を活動フィードとして返す。
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("achievements")
    .select("id, achieved_at, points_earned, user:users(discord_user_id, username, avatar), mission:missions(title)")
    .order("achieved_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }

  const entries: TimelineEntry[] = (data as unknown as Row[])
    .filter((r) => r.user !== null)
    .map((r) => ({
      id: r.id,
      achieved_at: r.achieved_at,
      points_earned: r.points_earned,
      discord_user_id: r.user!.discord_user_id,
      username: r.user!.username,
      avatar: r.user!.avatar,
      mission_title: r.mission?.title ?? null,
    }));

  return NextResponse.json(entries, {
    headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
  });
}
