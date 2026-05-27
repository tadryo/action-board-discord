import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  guild_id: z.string().regex(/^\d{17,19}$/).or(z.literal("dm")),
});

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length);

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid guild_id" }, { status: 400 });
  }
  const { guild_id } = parsed.data;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const discordRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));

  if (!discordRes?.ok) {
    return NextResponse.json({ error: "Invalid Discord token" }, { status: 401 });
  }

  const discordUser = await discordRes.json() as DiscordUser;

  const { data: user, error } = await getSupabaseAdmin()
    .from("users")
    .upsert(
      [{ discord_user_id: discordUser.id, username: discordUser.username, avatar: discordUser.avatar ?? null, guild_id }],
      { onConflict: "discord_user_id" },
    )
    .select()
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }

  return NextResponse.json(user, {
    headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
  });
}
