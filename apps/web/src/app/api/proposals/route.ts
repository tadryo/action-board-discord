import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  difficulty: z.number().int().min(1).max(5),
  points: z.number().int().positive(),
  submission_type: z.enum(["TEXT", "LINK", "NONE"]),
  department: z.string().min(1),
});

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
}

async function verifyDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));
  if (!res?.ok) return null;
  return (await res.json()) as DiscordUser;
}

// メンバーに公開する提案一覧（却下理由 review_reason は含めない）。
export async function GET(req: NextRequest) {
  const department = req.nextUrl.searchParams.get("department");

  let query = getSupabaseAdmin()
    .from("mission_proposals")
    .select("id, title, description, difficulty, points, submission_type, department, proposed_by_username, status, reviewed_at, approved_mission_slug, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (department) query = query.eq("department", department);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  return NextResponse.json({ proposals: data }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = authHeader.slice("Bearer ".length);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: dept } = await supabase
    .from("departments")
    .select("slug")
    .eq("slug", parsed.data.department)
    .maybeSingle<{ slug: string }>();
  if (!dept) {
    return NextResponse.json({ error: "部門が不正です" }, { status: 400 });
  }

  const user = await verifyDiscordUser(accessToken);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("mission_proposals")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      difficulty: parsed.data.difficulty,
      points: parsed.data.points,
      submission_type: parsed.data.submission_type,
      department: parsed.data.department,
      proposed_by_discord_id: user.id,
      proposed_by_username: user.global_name || user.username,
      status: "pending",
    })
    .select("id, title, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "提案の保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ proposal: data }, { status: 201 });
}
