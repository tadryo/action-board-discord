import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const [missionsRes, categoriesRes] = await Promise.all([
    admin.from("missions").select("*").eq("is_hidden", false).order("category_slug"),
    admin.from("categories").select("*").order("sort_no"),
  ]);

  if (missionsRes.error || categoriesRes.error) {
    return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 });
  }

  return NextResponse.json({ missions: missionsRes.data, categories: categoriesRes.data });
}
