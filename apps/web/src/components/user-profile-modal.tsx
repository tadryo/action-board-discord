"use client";

import { useEffect, useState } from "react";
import { levelFromPoints } from "@/lib/levels";
import SocialLinks from "@/components/social-links";
import type { BadgeWithEarned } from "@/types/database";

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=128`;
}

interface PublicUser {
  discord_user_id: string;
  username: string;
  avatar: string | null;
  total_points: number;
  created_at: string;
  twitter_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
}

interface PublicAchievement {
  id: string;
  achieved_at: string;
  points_earned: number;
  mission_title: string | null;
}

export default function UserProfileModal({ discordId, onClose }: { discordId: string; onClose: () => void }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [badges, setBadges] = useState<BadgeWithEarned[]>([]);
  const [achievements, setAchievements] = useState<PublicAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(discordId)}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { user: PublicUser; badges: BadgeWithEarned[]; achievements: PublicAchievement[] };
          setUser(data.user);
          setBadges(data.badges);
          setAchievements(data.achievements);
        }
      } catch (e) {
        console.error("public profile load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [discordId]);

  const level = user ? levelFromPoints(user.total_points) : null;
  const earnedBadges = badges.filter((b) => b.earned);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end -mt-1 -mr-1">
          <button onClick={onClose} className="text-xl font-bold w-8 h-8 rounded-full" style={{ color: "var(--muted)" }} aria-label="閉じる">×</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          </div>
        ) : !user || !level ? (
          <p className="text-sm text-center py-12" style={{ color: "var(--muted)" }}>プロフィールを取得できませんでした</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(user.discord_user_id, user.avatar)} alt={user.username}
                className="w-16 h-16 rounded-full object-cover" style={{ background: "var(--primary-50)" }}
                onError={(ev) => { (ev.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black truncate" style={{ color: "var(--fg)" }}>{user.username}</h2>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--primary-50)", color: "var(--primary-700)" }}>Lv.{level.level}</span>
                </div>
                <p className="font-black text-xl leading-tight" style={{ color: "var(--primary-deep)" }}>
                  {user.total_points}<span className="text-sm ml-1">P</span>
                </p>
                <div className="mt-1.5 progress-track">
                  <div className="progress-fill" style={{ width: `${level.progress}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <SocialLinks twitterUrl={user.twitter_url} githubUrl={user.github_url} instagramUrl={user.instagram_url} />
            </div>

            {badges.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-extrabold mb-2" style={{ color: "var(--fg)" }}>
                  バッジ <span className="badge-soft">{earnedBadges.length}/{badges.length}</span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {badges.map((b) => (
                    <div key={b.id} className="flex flex-col items-center text-center rounded-xl py-2 px-1"
                      style={{ background: b.earned ? "var(--primary-50)" : "var(--bg-deep)", opacity: b.earned ? 1 : 0.5 }}>
                      <span className="text-2xl" style={{ filter: b.earned ? "none" : "grayscale(1)" }}>{b.icon}</span>
                      <span className="text-[0.7rem] font-bold mt-0.5 leading-tight" style={{ color: "var(--fg)" }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-extrabold mb-2" style={{ color: "var(--fg)" }}>直近の達成</h3>
              {achievements.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--muted)" }}>まだ達成がありません</p>
              ) : (
                <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                  {achievements.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <span style={{ color: "var(--primary-deep)" }}>✓</span>
                      <span className="flex-1 truncate" style={{ color: "var(--fg)" }}>{a.mission_title ?? "ミッション"}</span>
                      <span className="badge">+{a.points_earned}P</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
