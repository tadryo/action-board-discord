"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaderboardEntry, UserRow } from "@/types/database";

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=64`;
}

const RANK_BADGES = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage({ guildId, currentUser }: { guildId: string; currentUser: UserRow }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 自分の行は認証コンテキストの最新値（名前・アバター・ポイント）で上書きし、再ソート・再採番する。
  // /api/leaderboard 由来の値が古くても、自分の表示はプロフィール/ナビと常に一致する。
  const rankedEntries = useMemo(() => {
    const patched = entries.map((e) =>
      e.discord_user_id === currentUser.discord_user_id
        ? { ...e, username: currentUser.username, avatar: currentUser.avatar, total_points: currentUser.total_points }
        : e,
    );
    patched.sort((a, b) => b.total_points - a.total_points);
    return patched.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries, currentUser]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard/${encodeURIComponent(guildId)}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) setEntries(await res.json() as LeaderboardEntry[]);
      } catch (e) {
        console.error("leaderboard load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [guildId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-black mb-4">🏆 サーバーランキング</h1>
      {rankedEntries.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>まだデータがありません</p>
      ) : (
        <div className="card p-2 flex flex-col">
          {rankedEntries.map((e, idx) => {
            const isMe = e.discord_user_id === currentUser.discord_user_id;
            return (
              <div key={e.discord_user_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: isMe ? "var(--primary-50)" : "transparent",
                  borderBottom: idx !== rankedEntries.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}>
                <span className={`w-8 text-center font-extrabold ${e.rank <= 3 ? "text-lg" : "text-sm"}`}
                  style={{ color: e.rank > 3 ? "var(--muted)" : undefined }}>
                  {RANK_BADGES[e.rank - 1] ?? e.rank}
                </span>
                <img src={avatarUrl(e.discord_user_id, e.avatar)} alt={e.username}
                  className="w-9 h-9 rounded-full" style={{ background: "var(--primary-50)" }}
                  onError={(ev) => { (ev.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }} />
                <span className="flex-1 text-sm font-bold truncate" style={{ color: "var(--fg)" }}>
                  {e.username}
                  {isMe && <span className="ml-1.5 text-xs font-bold" style={{ color: "var(--primary-deep)" }}>(あなた)</span>}
                </span>
                <span className="badge">{e.total_points}P</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
