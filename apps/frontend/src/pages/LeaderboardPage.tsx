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
        <div className="w-6 h-6 border-2 border-mirai-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2">🏆 サーバーランキング</h1>
      {entries.length === 0 ? (
        <p className="text-mirai-muted text-sm text-center py-8">まだデータがありません</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => {
            const isMe = e.discord_user_id === currentUserId;
            const isTop3 = e.rank <= 3;
            return (
              <div
                key={e.discord_user_id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border shadow-card ${
                  isMe
                    ? "bg-mirai-primarySoft border-mirai-primary/40"
                    : "bg-mirai-surface border-mirai-border"
                }`}
              >
                <span className={`w-8 text-center font-bold ${isTop3 ? "text-lg" : "text-sm text-mirai-muted"}`}>
                  {RANK_BADGES[e.rank - 1] ?? e.rank}
                </span>
                <img
                  src={avatarUrl(e.discord_user_id, e.avatar)}
                  alt={e.username}
                  className="w-9 h-9 rounded-full bg-mirai-bg"
                  onError={(ev) => {
                    (ev.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
                  }}
                />
                <span className="flex-1 text-sm font-medium truncate text-mirai-text">
                  {e.username}
                  {isMe && <span className="ml-1.5 text-xs text-mirai-primaryDark font-bold">(あなた)</span>}
                </span>
                <span className="text-mirai-primaryDark text-sm font-bold">{e.total_points}pt</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
