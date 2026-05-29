"use client";

import { useEffect, useState } from "react";
import { useDiscordActions } from "@/components/discord-provider";
import { levelFromPoints } from "@/lib/levels";
import SocialLinks from "@/components/social-links";
import type { AchievementRow, BadgeWithEarned, MissionRow, UserRow } from "@/types/database";

interface AchievementDetail extends AchievementRow {
  mission: MissionRow | null;
}

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=128`;
}

export default function ProfilePage({ user, accessToken }: { user: UserRow; accessToken: string }) {
  const [achievements, setAchievements] = useState<AchievementDetail[]>([]);
  const [badges, setBadges] = useState<BadgeWithEarned[]>([]);
  const [loading, setLoading] = useState(true);
  const { achievementVersion } = useDiscordActions();

  const [twitter, setTwitter] = useState(user.twitter_url ?? "");
  const [github, setGithub] = useState(user.github_url ?? "");
  const [editSocial, setEditSocial] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  const level = levelFromPoints(user.total_points);

  useEffect(() => {
    async function load() {
      try {
        const [achRes, badgeRes] = await Promise.all([
          fetch(`/api/achievements?user_id=${user.id}&t=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/badges?user_id=${user.id}&t=${Date.now()}`, { cache: "no-store" }),
        ]);
        if (achRes.ok) setAchievements(await achRes.json() as AchievementDetail[]);
        if (badgeRes.ok) setBadges(await badgeRes.json() as BadgeWithEarned[]);
      } catch (e) {
        console.error("profile load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id, achievementVersion]);

  const saveSocial = async () => {
    setSavingSocial(true);
    setSocialError(null);
    const res = await fetch("/api/me/social", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ twitter_url: twitter, github_url: github }),
    });
    setSavingSocial(false);
    if (res.ok) {
      setEditSocial(false);
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setSocialError(data.error ?? "更新に失敗しました");
    }
  };

  const earnedBadges = badges.filter((b) => b.earned);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-mirai-gradient rounded-[14px] p-5 flex items-center gap-4 mb-4 shadow-soft">
        <img src={avatarUrl(user.discord_user_id, user.avatar)} alt={user.username}
          className="w-16 h-16 rounded-full"
          style={{ background: "white", boxShadow: "0 0 0 3px rgba(255,255,255,0.6)" }}
          onError={(ev) => { (ev.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black truncate" style={{ color: "#0a0a0a" }}>{user.username}</h2>
            <span className="text-xs font-black px-2 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(255,255,255,0.7)", color: "#0f766e" }}>Lv.{level.level}</span>
          </div>
          <p className="font-black text-2xl leading-tight" style={{ color: "#0f766e" }}>
            {user.total_points}<span className="text-base ml-1">P</span>
          </p>
          {/* レベル進捗 */}
          <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.5)" }}>
            <div className="h-full rounded-full" style={{ width: `${level.progress}%`, background: "#0f766e" }} />
          </div>
          <p className="text-[0.7rem] mt-0.5" style={{ color: "#0f766e" }}>
            次のレベルまで {Math.max(0, level.nextLevelAt - user.total_points)}P
          </p>
        </div>
      </div>

      {/* SNS / GitHub */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-extrabold" style={{ color: "var(--fg)" }}>リンク</h3>
          {!editSocial && (
            <button onClick={() => setEditSocial(true)} className="text-xs font-bold" style={{ color: "var(--primary-deep)" }}>編集</button>
          )}
        </div>
        {editSocial ? (
          <div className="flex flex-col gap-2">
            {socialError && <p className="text-xs" style={{ color: "var(--destructive)" }}>{socialError}</p>}
            <label className="text-xs font-bold" style={{ color: "var(--muted-fg)" }}>X (Twitter) URL
              <input className="block w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white" style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                placeholder="https://x.com/..." value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </label>
            <label className="text-xs font-bold" style={{ color: "var(--muted-fg)" }}>GitHub URL
              <input className="block w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white" style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                placeholder="https://github.com/..." value={github} onChange={(e) => setGithub(e.target.value)} />
            </label>
            <div className="flex gap-2 mt-1">
              <button disabled={savingSocial} onClick={saveSocial}
                className="bg-gradient-primary text-white rounded-full px-4 py-2 text-sm font-bold transition-transform active:scale-95 disabled:opacity-50">
                {savingSocial ? "保存中…" : "保存"}
              </button>
              <button onClick={() => { setEditSocial(false); setTwitter(user.twitter_url ?? ""); setGithub(user.github_url ?? ""); }}
                className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: "var(--secondary)", color: "var(--muted-fg)" }}>キャンセル</button>
            </div>
          </div>
        ) : (
          <SocialLinks twitterUrl={twitter || null} githubUrl={github || null} emptyText="未設定（編集から追加できます）" />
        )}
      </div>

      {/* バッジ */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-extrabold mb-2" style={{ color: "var(--fg)" }}>
          バッジ <span className="badge-soft">{earnedBadges.length}/{badges.length}</span>
        </h3>
        {badges.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--muted)" }}>読み込み中…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {badges.map((b) => (
              <div key={b.id} className="flex flex-col items-center text-center rounded-xl py-2 px-1"
                style={{ background: b.earned ? "var(--primary-50)" : "var(--bg-deep)", opacity: b.earned ? 1 : 0.5 }}>
                <span className="text-2xl" style={{ filter: b.earned ? "none" : "grayscale(1)" }}>{b.icon}</span>
                <span className="text-[0.7rem] font-bold mt-0.5 leading-tight" style={{ color: "var(--fg)" }}>{b.name}</span>
                <span className="text-[0.6rem] mt-0.5 leading-tight" style={{ color: "var(--muted)" }}>{b.description}</span>
              </div>
            ))}
          </div>
        )}
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
