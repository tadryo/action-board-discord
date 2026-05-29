import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  // true=このシーズンを稼働中にする（他シーズンは終了扱い）。activate_season RPC を使う。
  activate: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req, ["super", "developer"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (parsed.data.name !== undefined) {
    const { error } = await supabase
      .from("seasons")
      .update({ name: parsed.data.name })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: "更新に失敗しました" }, { status: 400 });
    }
  }

  if (parsed.data.activate) {
    const { error } = await supabase.rpc("activate_season", { p_id: id });
    if (error) {
      return NextResponse.json({ error: "稼働切り替えに失敗しました" }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 400 });
  }

  return NextResponse.json({ season: data });
}
