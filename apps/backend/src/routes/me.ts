import { Router } from "express";
import fetch from "node-fetch";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";

const router = Router();

function securityLog(event: string, detail: Record<string, unknown>) {
  console.warn(JSON.stringify({ event, timestamp: new Date().toISOString(), ...detail }));
}

// Discord snowflake: 17-19桁の数字
const bodySchema = z.object({
  guild_id: z.string().regex(/^\d{17,19}$/).or(z.literal("dm")),
});

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

router.post("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    securityLog("me_missing_token", { ip: req.ip });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const accessToken = authHeader.slice("Bearer ".length);

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid guild_id" });
    return;
  }
  const { guild_id } = parsed.data;

  // Discordトークンを検証し、ユーザー情報を取得
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const discordRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: controller.signal,
  }).catch(() => null).finally(() => clearTimeout(timeoutId));

  if (!discordRes?.ok) {
    securityLog("me_invalid_token", { ip: req.ip, status: discordRes?.status });
    res.status(401).json({ error: "Invalid Discord token" });
    return;
  }

  const discordUser = (await discordRes.json()) as DiscordUser;

  // service_roleキーを持つバックエンドがupsertすることでRLSを通過
  const { data: user, error } = await supabase
    .from("users")
    .upsert(
      [{
        discord_user_id: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar ?? null,
        guild_id,
      }],
      { onConflict: "discord_user_id" }
    )
    .select()
    .single();

  if (error || !user) {
    console.error("user upsert error:", error);
    res.status(500).json({ error: "Failed to register user" });
    return;
  }

  res.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.json(user);
});

export default router;
