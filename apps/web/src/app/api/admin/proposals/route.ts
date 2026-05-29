import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// 管理側の提案一覧。dept は自部門のみ、super/developer は全部門。却下理由も含む。
export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let query = getSupabaseAdmin()
    .from("mission_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (guard.session.scope === "dept" && guard.session.dept) {
    query = query.eq("department", guard.session.dept);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  return NextResponse.json({ proposals: data }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
