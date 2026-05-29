import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AdminScope, AdminRow } from "@/types/database";

export interface ResolvedAdmin {
  discord_user_id: string;
  username: string;
  scope: AdminScope;
  department: string | null;
}

function seededSuperIds(): string[] {
  return (process.env.ADMIN_SUPER_DISCORD_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Discordユーザーを管理者として解決する。
// 1) admins テーブルに登録があればそれを使う
// 2) なければ ADMIN_SUPER_DISCORD_IDS に含まれる場合 super として扱い、テーブルに種まきする
// 権限がなければ null
export async function resolveAdmin(discordUserId: string, username: string): Promise<ResolvedAdmin | null> {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("admins")
    .select("discord_user_id, username, title, scope, department")
    .eq("discord_user_id", discordUserId)
    .maybeSingle<AdminRow>();

  if (existing) {
    return {
      discord_user_id: existing.discord_user_id,
      username: existing.username ?? username,
      scope: existing.scope,
      department: existing.department,
    };
  }

  if (seededSuperIds().includes(discordUserId)) {
    await supabase.from("admins").upsert(
      { discord_user_id: discordUserId, username, title: "代表", scope: "super", department: null },
      { onConflict: "discord_user_id" },
    );
    return { discord_user_id: discordUserId, username, scope: "super", department: null };
  }

  return null;
}
