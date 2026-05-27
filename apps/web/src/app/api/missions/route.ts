import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("missions")
    .select("*")
    .eq("is_hidden", false)
    .order("category_slug");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 });
  }

  return NextResponse.json(data);
}
