import type { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import { supabase } from "../lib/supabase.js";

declare global {
  namespace Express {
    interface Request {
      supabaseUserId?: string;
      discordUserId?: string;
    }
  }
}

interface DiscordUser {
  id: string;
  username: string;
}

// 構造化セキュリティログ（本番ではDatadog等に転送する）
function securityLog(event: string, detail: Record<string, unknown>) {
  console.warn(JSON.stringify({ event, timestamp: new Date().toISOString(), ...detail }));
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    securityLog("auth_missing_token", { ip: req.ip, path: req.path });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const accessToken = authHeader.slice("Bearer ".length);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const discordRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));

  if (!discordRes?.ok) {
    // トークンの内容はログに含めない（機密情報の漏洩防止）
    securityLog("auth_invalid_token", { ip: req.ip, path: req.path, status: discordRes?.status });
    res.status(401).json({ error: "Invalid Discord token" });
    return;
  }

  const discordUser = (await discordRes.json()) as DiscordUser;

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("discord_user_id", discordUser.id)
    .single();

  if (!user) {
    securityLog("auth_user_not_registered", { ip: req.ip, discordUserId: discordUser.id });
    res.status(401).json({ error: "User not registered" });
    return;
  }

  req.supabaseUserId = user.id as string;
  req.discordUserId = discordUser.id;
  next();
}
