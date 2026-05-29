"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaderboardEntry, UserRow } from "@/types/database";

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=64`;
}

const RANK_BADGES = ["🥇", "🥈", "🥉"];

// ホーム上部に出すコンパクトなトップ3ウィジェット。全件はリーダーボードタブへ。
export default function LeaderboardTop3({ guildId, currentUser, onSeeAll }: {
  guildId: string;
  currentUser: UserRow;
  onSeeAll?: () => void;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 自分の行は認証コンテキストの最新値で上書きし、再ソート・再採番する（フルページと同じ挙動）。
  const top3 = useMemo(() => {
    const patched = entries.map((e) =>
      e.discord_user_id === currentUser.discord_user_id
        ? { ...e, username: currentUser.username, avatar: currentUser.avatar, total_points: currentUser.total_points }
        : e,
    );
    patched.sort((a, b) => b.total_points - a.total_points);
    return patched.slice(0, 3).map((e, i) => ({ ...e, rank: i + 1 }));
  }, [entries, currentUser]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard/${encodeURIComponent(guildId)}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) setEntries(await res.json() as LeaderboardEntry[]);
      } catch (e) {
        console.error("leaderboard top3 load error:", e);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [guildId]);

  if (!loaded || top3.length === 0) return null;

  return (
    <div className="mt-4 card p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-extrabold" style={{ color: "var(--fg)" }}>🏆 アクションリーダー</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-xs font-bold" style={{ color: "var(--primary-deep)" }}>
            全て見る →
          </button>
        )}
      </div>
      <div className="flex flex-col">
        {top3.map((e, idx) => {
          const isMe = e.discord_user_id === currentUser.discord_user_id;
          return (
            <div key={e.discord_user_id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg"
              style={{
                background: isMe ? "var(--primary-50)" : "transparent",
                borderBottom: idx !== top3.length - 1 ? "1px solid var(--border-soft)" : "none",
              }}>
              <span className="w-6 text-center text-base">{RANK_BADGES[e.rank - 1]}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(e.discord_user_id, e.avatar)} alt={e.username}
                className="w-8 h-8 rounded-full object-cover" style={{ background: "var(--primary-50)" }}
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
    </div>
  );
}
