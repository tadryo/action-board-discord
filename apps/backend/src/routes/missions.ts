import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("is_hidden", false)
    .order("category_slug");

  if (error) {
    console.error("missions select error:", error);
    res.status(500).json({ error: "Failed to fetch missions" });
    return;
  }

  res.json(data);
});

export default router;
