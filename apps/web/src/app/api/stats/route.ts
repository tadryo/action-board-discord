import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// JST（UTC+9）の本日0時を ISO 文字列で返す。「1日で +N」の集計境界に使う。
function jstMidnightIso(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  const midnight = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()) - 9 * 3600 * 1000;
  return new Date(midnight).toISOString();
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const since = jstMidnightIso();

  const [members, membersToday, achievements, achievementsToday] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("achievements").select("*", { count: "exact", head: true }),
    supabase.from("achievements").select("*", { count: "exact", head: true }).gte("achieved_at", since),
  ]);

  return NextResponse.json(
    {
      members: members.count ?? 0,
      members_today: membersToday.count ?? 0,
      achievements: achievements.count ?? 0,
      achievements_today: achievementsToday.count ?? 0,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
