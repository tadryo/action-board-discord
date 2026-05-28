import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const bodySchema = z.object({
  mission_id: z.string().uuid(),
  submission_text: z.string().max(2000).optional(),
});

interface DiscordUser { id: string }

async function getSupabaseUserId(accessToken: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));

  if (!res?.ok) return null;
  const discordUser = await res.json() as DiscordUser;

  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("id")
    .eq("discord_user_id", discordUser.id)
    .single();

  return data?.id as string | null;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length);

  const userId = await getSupabaseUserId(accessToken);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("achievements")
    .select("*, mission:missions(*)")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
  });
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
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = await getSupabaseUserId(accessToken);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin().rpc("record_achievement", {
    p_user_id: userId,
    p_mission_id: parsed.data.mission_id,
    p_submission_text: parsed.data.submission_text ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save achievement" }, { status: 500 });
  }

  const row = (data as { error_code: string | null }[])[0];
  if (!row) return NextResponse.json({ error: "Failed to save achievement" }, { status: 500 });
  if (row.error_code === "MISSION_NOT_FOUND") return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  if (row.error_code === "LIMIT_REACHED") return NextResponse.json({ error: "Achievement limit reached" }, { status: 409 });

  return NextResponse.json(row, { status: 201 });
}
