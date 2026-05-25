import { Router } from "express";
import fetch from "node-fetch";
import { z } from "zod";

const router = Router();

// Discord OAuth codeの最大長は妥当な上限で制限（Discordは通常30文字以下）
const bodySchema = z.object({ code: z.string().min(1).max(512) });

router.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "code is required" });
    return;
  }

  const { code } = parsed.data;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID ?? "",
      client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code,
    }),
    signal: controller.signal,
  }).catch((err: unknown) => {
    console.error("Discord token exchange network error:", err);
    return null;
  }).finally(() => clearTimeout(timeoutId));

  if (!response) {
    res.status(502).json({ error: "Discord token exchange failed" });
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "(unreadable)");
    console.error("Discord token exchange failed:", text);
    res.status(502).json({ error: "Discord token exchange failed" });
    return;
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    console.error("Discord token exchange: access_token missing in response");
    res.status(502).json({ error: "Discord token exchange failed" });
    return;
  }
  // access_tokenのみを返却。refresh_tokenはクライアントに渡さない
  res.json({ access_token: data.access_token });
});

export default router;
