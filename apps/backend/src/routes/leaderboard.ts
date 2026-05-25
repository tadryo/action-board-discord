import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";

const router = Router();

const guildIdSchema = z.string().regex(/^\d{17,19}$/).or(z.literal("dm"));

router.get("/:guildId", async (req, res) => {
  const parsed = guildIdSchema.safeParse(req.params.guildId);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid guild_id" });
    return;
  }
  const guildId = parsed.data;

  const { data, error } = await supabase
    .from("users")
    .select("discord_user_id, username, avatar, total_points")
    .eq("guild_id", guildId)
    .order("total_points", { ascending: false })
    .limit(50);

  if (error) {
    console.error("leaderboard select error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
    return;
  }

  const ranked = data.map((u, i) => ({ rank: i + 1, ...u }));
  res.json(ranked);
});

export default router;
