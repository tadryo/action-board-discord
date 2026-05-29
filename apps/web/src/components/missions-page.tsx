"use client";

import { useEffect, useState, useCallback } from "react";
import { useDiscordActions } from "@/components/discord-provider";
import { APP_NAME_DEFAULT, APP_TAGLINE_DEFAULT } from "@/lib/app-config";
import MissionCard from "@/components/mission-card";
import ProposeTaskModal from "@/components/propose-task-modal";
import LeaderboardTop3 from "@/components/leaderboard-top3";
import type { CategoryRow, MissionRow, MissionWithAchievements, UserRow } from "@/types/database";

function CategorySection({ category, items, accessToken, onAchieved, onPropose }: {
  category: CategoryRow;
  items: MissionWithAchievements[];
  accessToken: string;
  onAchieved: (id: string, pts: number) => void;
  onPropose?: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-2 px-5 mb-1.5">
        <h2 className="text-[1.05rem] font-extrabold" style={{ color: "#111827" }}>
          {category.title}
        </h2>
        {onPropose && (
          <button
            onClick={onPropose}
            className="shrink-0 bg-gradient-primary text-white rounded-full px-4 py-1.5 font-bold text-xs transition-transform active:scale-95"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            ＋ タスクを提案
          </button>
        )}
      </div>
      <div className="h-scroll px-4">
        {items.map((m) => (
          <MissionCard key={m.id} mission={m} accessToken={accessToken} onAchieved={(pts) => onAchieved(m.id, pts)} />
        ))}
        <div style={{ flex: "0 0 0.5rem" }} />
      </div>
    </section>
  );
}

interface Props {
  user: UserRow;
  accessToken: string;
  guildId: string;
  onSeeLeaderboard?: () => void;
}

export default function MissionsPage({ user, accessToken, guildId, onSeeLeaderboard }: Props) {
  const [missions, setMissions] = useState<MissionWithAchievements[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appName, setAppName] = useState(APP_NAME_DEFAULT);
  const [appTagline, setAppTagline] = useState(APP_TAGLINE_DEFAULT);
  const [groupLabelGeneral, setGroupLabelGeneral] = useState("みんなでやろう");
  const [groupLabelDept, setGroupLabelDept] = useState("部門別ミッション");
  const [activeGroup, setActiveGroup] = useState<"general" | "dept">("general");
  const [proposeDept, setProposeDept] = useState<string | null>(null);
  const { recordAchievement } = useDiscordActions();

  useEffect(() => {
    fetch("/api/app-settings")
      .then((r) => r.json())
      .then((data: { app_name?: string; app_tagline?: string; group_label_general?: string; group_label_dept?: string }) => {
        if (data.app_name) setAppName(data.app_name);
        if (data.app_tagline) setAppTagline(data.app_tagline);
        if (data.group_label_general) setGroupLabelGeneral(data.group_label_general);
        if (data.group_label_dept) setGroupLabelDept(data.group_label_dept);
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
  const allGrouped = categories
    .map((c) => ({ category: c, items: missions.filter((m) => m.category_slug === c.slug) }))
    .filter((g) => g.items.length > 0);
  const generalGroups = allGrouped.filter((g) => g.category.group_key !== "dept");
  const deptGroups = allGrouped.filter((g) => g.category.group_key === "dept");
  const deptOptions = categories
    .filter((c) => c.group_key === "dept" && c.department)
    .map((c) => ({ slug: c.department as string, title: c.title }));

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
          <LeaderboardTop3 guildId={guildId} currentUser={user} onSeeAll={onSeeLeaderboard} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-4">
        <div className="flex gap-2 px-5 mb-5">
          <button
            onClick={() => setActiveGroup("general")}
            className="px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
            style={activeGroup === "general"
              ? { background: "var(--primary)", color: "#fff" }
              : { background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--border-soft)" }}
          >
            {groupLabelGeneral}
          </button>
          {deptGroups.length > 0 && (
            <button
              onClick={() => setActiveGroup("dept")}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
              style={activeGroup === "dept"
                ? { background: "var(--primary)", color: "#fff" }
                : { background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--border-soft)" }}
            >
              {groupLabelDept}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-7">
          {activeGroup === "general" && generalGroups.map(({ category, items }) => (
            <CategorySection key={category.slug} category={category} items={items} accessToken={accessToken} onAchieved={handleAchieved} />
          ))}
          {activeGroup === "dept" && deptGroups.map(({ category, items }) => (
            <CategorySection
              key={category.slug}
              category={category}
              items={items}
              accessToken={accessToken}
              onAchieved={handleAchieved}
              onPropose={category.department ? () => setProposeDept(category.department) : undefined}
            />
          ))}
          {missions.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>ミッションがありません</p>
          )}
        </div>
      </div>

      {proposeDept && (
        <ProposeTaskModal
          accessToken={accessToken}
          departments={deptOptions}
          initialDepartment={proposeDept}
          onClose={() => setProposeDept(null)}
          onSubmitted={() => {}}
        />
      )}
    </div>
  );
}
