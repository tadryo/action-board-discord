import { NextRequest, NextResponse } from "next/server";
import { resolveAdmin } from "@/lib/admin-auth";
import { createSession, ADMIN_COOKIE, cookieMaxAge } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/admin?error=no_code`);
  }

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID ?? process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "",
      client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/admin/callback`,
    }),
  }).catch(() => null);

  if (!tokenRes?.ok) {
    return NextResponse.redirect(`${origin}/admin?error=token`);
  }

  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) {
    return NextResponse.redirect(`${origin}/admin?error=token`);
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  }).catch(() => null);

  if (!userRes?.ok) {
    return NextResponse.redirect(`${origin}/admin?error=user`);
  }

  const me = (await userRes.json()) as { id: string; username: string; global_name?: string };
  const username = me.global_name || me.username;

  const admin = await resolveAdmin(me.id, username);
  if (!admin) {
    return NextResponse.redirect(`${origin}/admin?error=forbidden`);
  }

  const session = createSession({
    sub: admin.discord_user_id,
    name: admin.username,
    scope: admin.scope,
    dept: admin.department,
  });

  const res = NextResponse.redirect(`${origin}/admin`);
  res.cookies.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge,
  });
  return res;
}
