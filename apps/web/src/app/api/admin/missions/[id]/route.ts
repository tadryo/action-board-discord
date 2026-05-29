import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  points: z.number().int().positive().optional(),
  submission_type: z.enum(["TEXT", "LINK", "NONE"]).optional(),
  max_achievement_count: z.number().int().positive().nullable().optional(),
  is_hidden: z.boolean().optional(),
  // アーカイブの解除（復元）に使う。true=復元（archived_at を NULL に戻す）。
  archived: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req, ["super", "developer"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { archived, ...fields } = parsed.data;
  const update: Record<string, unknown> = { ...fields };
  if (archived !== undefined) {
    update.archived_at = archived ? new Date().toISOString() : null;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("missions")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 400 });
  }

  return NextResponse.json({ mission: data });
}

// 物理削除は achievements の参照先を壊すため行わない。archived_at をセットして論理削除する。
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req, ["super", "developer"]);
  if ("error" in guard) return guard.error;

  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from("missions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "アーカイブに失敗しました" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
