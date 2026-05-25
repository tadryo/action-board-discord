import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { CategoryRow, MissionRow, MissionWithAchievements } from "../types/database";

export function useMissions(userId: string | undefined) {
  const [missions, setMissions] = useState<MissionWithAchievements[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const [missionsRes, categoriesRes, achievementsRes] = await Promise.all([
          supabase.from("missions").select("*").eq("is_hidden", false).order("category_slug"),
          supabase.from("categories").select("*").order("sort_no"),
          supabase.from("achievements").select("mission_id").eq("user_id", userId!),
        ]);

        if (missionsRes.error) throw missionsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (achievementsRes.error) throw achievementsRes.error;

        const rawAchievements = achievementsRes.data as { mission_id: string }[];
        const achievementCounts = rawAchievements.reduce<Record<string, number>>((acc, a) => {
          acc[a.mission_id] = (acc[a.mission_id] ?? 0) + 1;
          return acc;
        }, {});

        const rawMissions = missionsRes.data as MissionRow[];
        const enriched: MissionWithAchievements[] = rawMissions.map((m) => {
          const count = achievementCounts[m.id] ?? 0;
          const max = m.max_achievement_count;
          return {
            ...m,
            achievement_count: count,
            is_completed: max !== null && count >= max,
          };
        });

        setMissions(enriched);
        setCategories(categoriesRes.data as CategoryRow[]);
      } catch {
        setError("ミッションの読み込みに失敗しました");
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [userId]);

  async function refresh() {
    if (!userId) return;
    const [missionsRes, achievementsRes] = await Promise.all([
      supabase.from("missions").select("*").eq("is_hidden", false),
      supabase.from("achievements").select("mission_id").eq("user_id", userId),
    ]);
    if (missionsRes.error || achievementsRes.error) return;

    const rawA = achievementsRes.data as { mission_id: string }[];
    const counts = rawA.reduce<Record<string, number>>((acc, a) => {
      acc[a.mission_id] = (acc[a.mission_id] ?? 0) + 1;
      return acc;
    }, {});

    const rawM = missionsRes.data as MissionRow[];
    setMissions(rawM.map((m) => ({
      ...m,
      achievement_count: counts[m.id] ?? 0,
      is_completed: m.max_achievement_count !== null && (counts[m.id] ?? 0) >= m.max_achievement_count,
    })));
  }

  return { missions, categories, loading, error, refresh };
}
