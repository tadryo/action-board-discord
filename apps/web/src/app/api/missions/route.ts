import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const [missionsRes, categoriesRes, achievementsRes] = await Promise.all([
    admin.from("missions").select("*").eq("is_hidden", false).is("archived_at", null).order("category_slug"),
    admin.from("categories").select("*").order("sort_no"),
    // 全ユーザーの達成回数（「みんなで○回達成」用）
    admin.from("achievements").select("mission_id"),
  ]);

  if (missionsRes.error || categoriesRes.error || achievementsRes.error) {
    return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 });
  }

  const totals = (achievementsRes.data as { mission_id: string }[]).reduce<Record<string, number>>((acc, a) => {
    acc[a.mission_id] = (acc[a.mission_id] ?? 0) + 1;
    return acc;
  }, {});

  const missions = (missionsRes.data as { id: string }[]).map((m) => ({
    ...m,
    total_achievements: totals[m.id] ?? 0,
  }));

  return NextResponse.json({ missions, categories: categoriesRes.data }, {
    headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
  });
}
