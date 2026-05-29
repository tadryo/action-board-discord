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
  global_name: string | null;
  avatar: string | null;
}

interface GuildMember {
  nick: string | null;
  user?: { global_name: string | null; username: string };
}

// そのギルドでの表示名（サーバーニックネーム）を取得する。
// 優先順: サーバーニックネーム > グローバル表示名 > ユーザー名。guilds.members.read スコープが必要。
async function fetchGuildDisplayName(accessToken: string, guildId: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const res = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));

  if (!res?.ok) return null;
  const member = await res.json() as GuildMember;
  return member.nick || member.user?.global_name || member.user?.username || null;
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

  // ギルド内ではサーバーニックネームを表示名にする（取得できなければグローバル名にフォールバック）
  const fallbackName = discordUser.global_name || discordUser.username;
  const displayName =
    guild_id !== "dm"
      ? (await fetchGuildDisplayName(accessToken, guild_id)) ?? fallbackName
      : fallbackName;

  const { data: user, error } = await getSupabaseAdmin()
    .from("users")
    .upsert(
      [{ discord_user_id: discordUser.id, username: displayName, avatar: discordUser.avatar ?? null, guild_id }],
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
