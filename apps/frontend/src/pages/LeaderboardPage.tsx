import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { LeaderboardEntry } from "../types/database";

interface Props {
  guildId: string;
  currentUserId: string;
}

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=64`;
}

export default function LeaderboardPage({ guildId, currentUserId }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("users")
        .select("discord_user_id, username, avatar, total_points")
        .eq("guild_id", guildId)
        .order("total_points", { ascending: false })
        .limit(50);

      if (!error && data) {
        type Row = { discord_user_id: string; username: string; avatar: string | null; total_points: number };
        setEntries(
          (data as Row[]).map((u, i) => ({
            rank: i + 1,
            discord_user_id: u.discord_user_id,
            username: u.username,
            avatar: u.avatar,
            total_points: u.total_points,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [guildId]);

  const RANK_BADGES = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-black mb-4">🏆 サーバーランキング</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>
          まだデータがありません
        </p>
      ) : (
        <div className="card p-2 flex flex-col">
          {entries.map((e, idx) => {
            const isMe = e.discord_user_id === currentUserId;
            const isTop3 = e.rank <= 3;
            return (
              <div
                key={e.discord_user_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: isMe ? "var(--primary-50)" : "transparent",
                  borderBottom: idx !== entries.length - 1 ? "1px solid var(--border-soft)" : "none",
                }}
              >
                <span
                  className={`w-8 text-center font-extrabold ${isTop3 ? "text-lg" : "text-sm"}`}
                  style={{ color: isTop3 ? undefined : "var(--muted)" }}
                >
                  {RANK_BADGES[e.rank - 1] ?? e.rank}
                </span>
                <img
                  src={avatarUrl(e.discord_user_id, e.avatar)}
                  alt={e.username}
                  className="w-9 h-9 rounded-full"
                  style={{ background: "var(--primary-50)" }}
                  onError={(ev) => {
                    (ev.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
                  }}
                />
                <span className="flex-1 text-sm font-bold truncate" style={{ color: "var(--fg)" }}>
                  {e.username}
                  {isMe && (
                    <span className="ml-1.5 text-xs font-bold" style={{ color: "var(--primary-deep)" }}>
                      (あなた)
                    </span>
                  )}
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
