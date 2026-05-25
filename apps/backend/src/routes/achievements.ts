import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// user_id はクライアントから受け取らず、認証ミドルウェアで確定したIDのみ使用
const bodySchema = z.object({
  mission_id: z.string().uuid(),
  submission_text: z.string().max(2000).optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { mission_id, submission_text } = parsed.data;
  const user_id = req.supabaseUserId!;

  // アトミック関数で達成記録（TOCTOU競合を防ぐ）
  const { data, error } = await supabase.rpc("record_achievement", {
    p_user_id: user_id,
    p_mission_id: mission_id,
    p_submission_text: submission_text ?? null,
  });

  if (error) {
    console.error("record_achievement error:", error);
    res.status(500).json({ error: "Failed to save achievement" });
    return;
  }

  const row = (data as { error_code: string | null }[])[0];
  if (!row) {
    res.status(500).json({ error: "Failed to save achievement" });
    return;
  }

  if (row.error_code === "MISSION_NOT_FOUND") {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  if (row.error_code === "LIMIT_REACHED") {
    res.status(409).json({ error: "Achievement limit reached" });
    return;
  }

  res.status(201).json(row);
});

export default router;
