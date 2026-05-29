import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const upsertSchema = z
  .object({
    discord_user_id: z.string().min(1).max(40).regex(/^\d+$/, "DiscordユーザーIDは数字のみ"),
    username: z.string().max(100).nullable().optional(),
    title: z.string().min(1).max(60),
    scope: z.enum(["developer", "super", "dept"]),
    department: z.string().min(1).nullable().optional(),
  })
  .refine((d) => d.scope !== "dept" || !!d.department, {
    message: "部門権限には部門の指定が必要です",
    path: ["department"],
  });

export async function GET() {
  const guard = await requireAdmin(["super", "developer"]);
  if ("error" in guard) return guard.error;

  const supabase = getSupabaseAdmin();
  const [adminsRes, departmentsRes] = await Promise.all([
    supabase.from("admins").select("*").order("created_at"),
    supabase.from("departments").select("*").order("sort_no"),
  ]);

  if (adminsRes.error || departmentsRes.error) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }

  return NextResponse.json(
    { admins: adminsRes.data, departments: departmentsRes.data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(["super", "developer"]);
  if ("error" in guard) return guard.error;

  const parsed = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("admins")
    .upsert(
      {
        discord_user_id: parsed.data.discord_user_id,
        username: parsed.data.username ?? null,
        title: parsed.data.title,
        scope: parsed.data.scope,
        department: parsed.data.scope === "dept" ? parsed.data.department : null,
      },
      { onConflict: "discord_user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 400 });
  }

  return NextResponse.json({ admin: data });
}
