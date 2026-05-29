import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data } = await getSupabaseAdmin()
    .from("seasons")
    .select("id, slug, name, starts_at")
    .eq("is_active", true)
    .maybeSingle();

  return NextResponse.json({ season: data ?? null }, { headers: { "Cache-Control": "private, no-store" } });
}
