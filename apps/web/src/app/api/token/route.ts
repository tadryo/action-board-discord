import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";

const bodySchema = z.object({ code: z.string().min(1).max(512) });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID ?? "",
      client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code: parsed.data.code,
    }),
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));

  if (!response?.ok) {
    return NextResponse.json({ error: "Discord token exchange failed" }, { status: 502 });
  }

  const data = await response.json() as { access_token?: string };
  if (!data.access_token) {
    return NextResponse.json({ error: "Discord token exchange failed" }, { status: 502 });
  }

  return NextResponse.json({ access_token: data.access_token });
}
