import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// 管理側の提案一覧。dept は自部門のみ、super/developer は全部門。却下理由も含む。
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;

  const admin = getSupabaseAdmin();
  let pendingQuery = admin
    .from("mission_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  let rejectedQuery = admin
    .from("rejected_proposals")
    .select("*")
    .order("rejected_at", { ascending: false })
    .limit(300);

  if (guard.session.scope === "dept" && guard.session.dept) {
    pendingQuery = pendingQuery.eq("department", guard.session.dept);
    rejectedQuery = rejectedQuery.eq("department", guard.session.dept);
  }

  const [proposalsRes, rejectedRes] = await Promise.all([pendingQuery, rejectedQuery]);
  if (proposalsRes.error || rejectedRes.error) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  return NextResponse.json({ proposals: proposalsRes.data, rejected: rejectedRes.data }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
