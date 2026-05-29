import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";
import type { MissionProposalRow } from "@/types/database";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), review_reason: z.string().min(10, "却下理由は10文字以上で詳述してください").max(2000) }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;

  const { id } = await params;
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: proposal } = await supabase
    .from("mission_proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle<MissionProposalRow>();

  if (!proposal) {
    return NextResponse.json({ error: "提案が見つかりません" }, { status: 404 });
  }
  if (proposal.status !== "pending") {
    return NextResponse.json({ error: "この提案は既に処理済みです" }, { status: 409 });
  }

  // dept 権限は自部門のみ処理可能
  if (guard.session.scope === "dept" && guard.session.dept !== proposal.department) {
    return NextResponse.json({ error: "この部門の提案を処理する権限がありません" }, { status: 403 });
  }

  const reviewed = {
    reviewed_by_discord_id: guard.session.sub,
    reviewed_at: new Date().toISOString(),
  };

  if (parsed.data.action === "reject") {
    const { error } = await supabase
      .from("mission_proposals")
      .update({ status: "rejected", review_reason: parsed.data.review_reason, ...reviewed })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: "却下に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // approve: 部門カテゴリを特定してミッションを作成する
  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("department", proposal.department)
    .eq("group_key", "dept")
    .maybeSingle<{ slug: string }>();

  if (!category) {
    return NextResponse.json({ error: "対応する部門カテゴリがありません" }, { status: 400 });
  }

  const slug = `prop-${id.replace(/-/g, "").slice(0, 16)}`;

  const { error: missionError } = await supabase.from("missions").insert({
    slug,
    title: proposal.title,
    description: proposal.description,
    difficulty: proposal.difficulty,
    points: proposal.points,
    submission_type: proposal.submission_type,
    category_slug: category.slug,
    is_hidden: false,
  });

  if (missionError) {
    return NextResponse.json({ error: "ミッション作成に失敗しました" }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("mission_proposals")
    .update({ status: "approved", approved_mission_slug: slug, ...reviewed })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "提案の更新に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "approved", mission_slug: slug });
}
