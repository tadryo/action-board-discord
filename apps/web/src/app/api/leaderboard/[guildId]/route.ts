import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const guildIdSchema = z.string().regex(/^\d{17,19}$/).or(z.literal("dm"));

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const parsed = guildIdSchema.safeParse(guildId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid guild_id" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("discord_user_id, username, avatar, total_points")
    .eq("guild_id", parsed.data)
    .order("total_points", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }

  const ranked = data.map((u, i) => ({ rank: i + 1, ...u }));
  return NextResponse.json(ranked);
}
