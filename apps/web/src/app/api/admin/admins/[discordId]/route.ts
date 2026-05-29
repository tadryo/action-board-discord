import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ discordId: string }> }) {
  const guard = await requireAdmin(["super", "developer"]);
  if ("error" in guard) return guard.error;

  const { discordId } = await params;
  if (discordId === guard.session.sub) {
    return NextResponse.json({ error: "自分自身の権限は削除できません" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from("admins").delete().eq("discord_user_id", discordId);
  if (error) {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
