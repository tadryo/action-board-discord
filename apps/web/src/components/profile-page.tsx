"use client";

import { useEffect, useState } from "react";
import type { AchievementRow, MissionRow, UserRow } from "@/types/database";

interface AchievementDetail extends AchievementRow {
  mission: MissionRow | null;
}

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=128`;
}

export default function ProfilePage({ user }: { user: UserRow }) {
  const [achievements, setAchievements] = useState<AchievementDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/achievements?user_id=${user.id}&t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) setAchievements(await res.json() as AchievementDetail[]);
      } catch (e) {
        console.error("achievements load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-mirai-gradient rounded-[14px] p-5 flex items-center gap-4 mb-6 shadow-soft">
        <img src={avatarUrl(user.discord_user_id, user.avatar)} alt={user.username}
          className="w-16 h-16 rounded-full"
          style={{ background: "white", boxShadow: "0 0 0 3px rgba(255,255,255,0.6)" }}
          onError={(ev) => { (ev.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }} />
        <div className="min-w-0">
          <h2 className="text-lg font-black truncate" style={{ color: "#0a0a0a" }}>{user.username}</h2>
          <p className="font-black text-2xl leading-tight" style={{ color: "#0f766e" }}>
            {user.total_points}<span className="text-base ml-1">P</span>
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#0f766e" }}>
            参加: {new Date(user.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </div>

      <h3 className="text-base font-extrabold mb-3">あなたの達成履歴</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>まだミッションを達成していません</p>
      ) : (
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {achievements.map((a) => (
            <li key={a.id} className="card px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--primary-50)", color: "var(--primary-deep)" }}>✓</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {new Date(a.achieved_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>
                  {a.mission?.title ?? "不明なミッション"}
                </p>
              </div>
              <span className="badge">+{a.points_earned}P</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
