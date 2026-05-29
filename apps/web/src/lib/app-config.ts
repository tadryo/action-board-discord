import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const APP_NAME_DEFAULT = "アクションボード";
export const APP_TAGLINE_DEFAULT = "アクションでポイントを貯めよう。";

export async function getAppSettings(): Promise<{ appName: string; appTagline: string }> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("app_settings")
      .select("key, value");

    if (error) throw error;

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return {
      appName: map["app_name"] ?? APP_NAME_DEFAULT,
      appTagline: map["app_tagline"] ?? APP_TAGLINE_DEFAULT,
    };
  } catch {
    return { appName: APP_NAME_DEFAULT, appTagline: APP_TAGLINE_DEFAULT };
  }
}
