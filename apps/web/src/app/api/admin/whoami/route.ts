import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// アクティビティから自分の管理権限を確認する。
// 管理者でなければ 401/403 を返すので、フロントは「ボタンを出すか」の判定に使う。
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  return NextResponse.json(
    { scope: guard.session.scope, department: guard.session.dept, name: guard.session.name },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
