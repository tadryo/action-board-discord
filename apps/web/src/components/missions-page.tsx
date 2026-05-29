"use client";

import { useEffect, useState, useCallback } from "react";
import { useDiscordActions } from "@/components/discord-provider";
import { APP_NAME_DEFAULT, APP_TAGLINE_DEFAULT } from "@/lib/app-config";
import MissionCard from "@/components/mission-card";
import type { CategoryRow, MissionRow, MissionWithAchievements, UserRow } from "@/types/database";

interface Props {
  user: UserRow;
  accessToken: string;
}

export default function MissionsPage({ user, accessToken }: Props) {
  const [missions, setMissions] = useState<MissionWithAchievements[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appName, setAppName] = useState(APP_NAME_DEFAULT);
  const [appTagline, setAppTagline] = useState(APP_TAGLINE_DEFAULT);
  const { recordAchievement } = useDiscordActions();

  useEffect(() => {
    fetch("/api/app-settings")
      .then((r) => r.json())
      .then((data: { app_name?: string; app_tagline?: string }) => {
        if (data.app_name) setAppName(data.app_name);
        if (data.app_tagline) setAppTagline(data.app_tagline);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = Date.now();
      const [missionsRes, achievementsRes] = await Promise.all([
        fetch(`/api/missions?t=${t}`, { cache: "no-store" }),
        fetch(`/api/achievements?user_id=${user.id}&t=${t}`, { cache: "no-store" }),
      ]);
      if (!missionsRes.ok) throw new Error(`missions ${missionsRes.status}`);
      if (!achievementsRes.ok) throw new Error(`achievements ${achievementsRes.status}`);

      const { missions: missionRows, categories: categoryRows } = await missionsRes.json() as {
        missions: (MissionRow & { total_achievements: number })[];
        categories: CategoryRow[];
      };
      const achievements = await achievementsRes.json() as { mission_id: string }[];

      const counts = achievements.reduce<Record<string, number>>((acc, a) => {
        acc[a.mission_id] = (acc[a.mission_id] ?? 0) + 1;
        return acc;
      }, {});

      setMissions(
        missionRows.map((m) => {
          const count = counts[m.id] ?? 0;
          return { ...m, achievement_count: count, is_completed: m.max_achievement_count !== null && count >= m.max_achievement_count };
        }),
      );
      setCategories(categoryRows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      console.error("missions load error:", e);
      setError("ミッションの読み込みに失敗しました: " + msg);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  // 達成記録後はその場でローカル更新（全件再取得・スピナーを出さない）
  const handleAchieved = useCallback((missionId: string, pointsEarned: number) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== missionId) return m;
        const count = m.achievement_count + 1;
        return {
          ...m,
          achievement_count: count,
          total_achievements: (m.total_achievements ?? 0) + 1,
          is_completed: m.max_achievement_count !== null && count >= m.max_achievement_count,
        };
      }),
    );
    recordAchievement(pointsEarned);
  }, [recordAchievement]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (error) return <p className="text-sm p-4" style={{ color: "#dc2626" }}>{error}</p>;

  const completedCount = missions.filter((m) => m.is_completed).length;
  const progress = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;
  const grouped = categories
    .map((c) => ({ category: c, items: missions.filter((m) => m.category_slug === c.slug) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="pb-8">
      <div className="bg-gradient-hero px-5 pt-6 pb-7">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-black" style={{ color: "#0a0a0a" }}>🎯 {appName}</h1>
          <p className="text-sm mt-1 font-semibold" style={{ color: "#0f766e" }}>
            {appTagline}
          </p>
          <div className="mt-4 card p-4">
            <div className="flex items-center justify-between text-sm font-bold mb-1.5">
              <span style={{ color: "#374151" }}>{completedCount}/{missions.length} ミッション達成</span>
              <span style={{ color: "var(--primary-deep)" }}>{user.total_points}P</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-5 flex flex-col gap-7">
        {grouped.map(({ category, items }) => (
          <section key={category.slug}>
            <h2 className="text-[1.05rem] font-extrabold px-5 mb-1.5" style={{ color: "#111827" }}>
              {category.title}
            </h2>
            <div className="h-scroll px-4">
              {items.map((m) => (
                <MissionCard key={m.id} mission={m} accessToken={accessToken} onAchieved={(pts) => handleAchieved(m.id, pts)} />
              ))}
              <div style={{ flex: "0 0 0.5rem" }} />
            </div>
          </section>
        ))}
        {missions.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>ミッションがありません</p>
        )}
      </div>
    </div>
  );
}
