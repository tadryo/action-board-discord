"use client";

import { useEffect, useState } from "react";
import { useDiscordActions } from "@/components/discord-provider";
import type { TimelineEntry } from "@/types/database";

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=64`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { achievementVersion } = useDiscordActions();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/timeline?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) setEntries(await res.json() as TimelineEntry[]);
      } catch (e) {
        console.error("timeline load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [achievementVersion]);

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
      <h1 className="text-xl font-black mb-4">⏱ タイムライン</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>まだ活動がありません</p>
      ) : (
        <div className="card p-2 flex flex-col">
          {entries.map((e, idx) => (
            <div key={e.id}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{ borderBottom: idx !== entries.length - 1 ? "1px solid var(--border-soft)" : "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(e.discord_user_id, e.avatar)} alt={e.username}
                className="w-9 h-9 rounded-full object-cover shrink-0" style={{ background: "var(--primary-50)" }}
                onError={(ev) => { (ev.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png"; }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: "var(--fg)" }}>
                  <span className="font-bold">{e.username}</span>
                  <span style={{ color: "var(--muted)" }}> が </span>
                  <span className="font-semibold">{e.mission_title ?? "ミッション"}</span>
                  <span style={{ color: "var(--muted)" }}> を達成</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{relativeTime(e.achieved_at)}</p>
              </div>
              <span className="badge shrink-0">+{e.points_earned}P</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
