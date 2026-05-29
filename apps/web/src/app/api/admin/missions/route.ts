import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const missionSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "slugは英小文字・数字・ハイフンのみ"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  difficulty: z.number().int().min(1).max(5),
  points: z.number().int().positive(),
  submission_type: z.enum(["TEXT", "LINK", "NONE"]),
  max_achievement_count: z.number().int().positive().nullable().optional(),
  category_slug: z.string().min(1),
});

export async function GET() {
  const guard = await requireAdmin(["super", "developer"]);
  if ("error" in guard) return guard.error;

  const supabase = getSupabaseAdmin();
  const [missionsRes, categoriesRes] = await Promise.all([
    supabase.from("missions").select("*").order("category_slug"),
    supabase.from("categories").select("*").order("sort_no"),
  ]);

  if (missionsRes.error || categoriesRes.error) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  return NextResponse.json(
    { missions: missionsRes.data, categories: categoriesRes.data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(["super", "developer"]);
  if ("error" in guard) return guard.error;

  const parsed = missionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 「みんなでやろう」（general）カテゴリのみ作成可能。dept はアクティビティからの提案で作る。
  const { data: category } = await supabase
    .from("categories")
    .select("slug, group_key")
    .eq("slug", parsed.data.category_slug)
    .maybeSingle<{ slug: string; group_key: string }>();

  if (!category) {
    return NextResponse.json({ error: "category not found" }, { status: 400 });
  }
  if (category.group_key === "dept") {
    return NextResponse.json({ error: "dept missions must come from proposals" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("missions")
    .insert({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      difficulty: parsed.data.difficulty,
      points: parsed.data.points,
      submission_type: parsed.data.submission_type,
      max_achievement_count: parsed.data.max_achievement_count ?? null,
      category_slug: parsed.data.category_slug,
      is_hidden: false,
    })
    .select()
    .single();

  if (error) {
    const msg = error.code === "23505" ? "そのslugは既に使われています" : "作成に失敗しました";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ mission: data });
}
