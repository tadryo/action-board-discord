import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// 空文字は「未設定」として NULL に正規化する。URL のみ許可。
const urlOrEmpty = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "URLを入力してください")
  .transform((v) => (v === "" ? null : v));

const bodySchema = z.object({
  twitter_url: urlOrEmpty.optional(),
  github_url: urlOrEmpty.optional(),
  instagram_url: urlOrEmpty.optional(),
});

interface DiscordUser { id: string }

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: parsed.success ? "invalid" : parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }

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

  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .update(parsed.data)
    .eq("discord_user_id", discordUser.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 400 });
  }

  return NextResponse.json(data);
}
