import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "slugは英小文字・数字・ハイフンのみ").optional(),
  activate: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req, ["super", "developer"]);
  if ("error" in guard) return guard.error;

  const { data, error } = await getSupabaseAdmin()
    .from("seasons")
    .select("*")
    .order("sort_no", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
  return NextResponse.json({ seasons: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req, ["super", "developer"]);
  if ("error" in guard) return guard.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const slug = parsed.data.slug ?? `season-${Date.now()}`;

  const { data: maxRow } = await supabase
    .from("seasons")
    .select("sort_no")
    .order("sort_no", { ascending: false })
    .limit(1)
    .maybeSingle<{ sort_no: number }>();
  const sortNo = (maxRow?.sort_no ?? 0) + 1;

  const { data, error } = await supabase
    .from("seasons")
    .insert({ slug, name: parsed.data.name, sort_no: sortNo, is_active: false })
    .select()
    .single();

  if (error) {
    const msg = error.code === "23505" ? "そのslugは既に使われています" : "作成に失敗しました";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 作成と同時に稼働中へ切り替える場合（他シーズンは終了扱い）。
  if (parsed.data.activate) {
    const { error: actError } = await supabase.rpc("activate_season", { p_id: data.id });
    if (actError) {
      return NextResponse.json({ error: "稼働切り替えに失敗しました" }, { status: 500 });
    }
  }

  return NextResponse.json({ season: data });
}
