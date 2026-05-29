import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("app_settings")
    .select("key, value");

  if (error) {
    return NextResponse.json(
      { app_name: "アクションボード", app_tagline: "アクションでポイントを貯めよう。" },
      { status: 200 }
    );
  }

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({
    app_name: settings["app_name"] ?? "アクションボード",
    app_tagline: settings["app_tagline"] ?? "アクションでポイントを貯めよう。",
    group_label_general: settings["group_label_general"] ?? "みんなでやろう",
    group_label_dept: settings["group_label_dept"] ?? "部門タスク",
  });
}
