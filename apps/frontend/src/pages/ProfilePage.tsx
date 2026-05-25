import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AchievementRow, MissionRow, UserRow } from "../types/database";

interface Props {
  user: UserRow;
}

interface AchievementDetail extends AchievementRow {
  mission: MissionRow | null;
}

function avatarUrl(discordUserId: string, avatar: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(discordUserId) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatar}.png?size=128`;
}

export default function ProfilePage({ user }: Props) {
  const [achievements, setAchievements] = useState<AchievementDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("achievements")
        .select("*, mission:missions(*)")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setAchievements(data as AchievementDetail[]);
      }
      setLoading(false);
    }
    load();
  }, [user.id]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* プロフィールヘッダー */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={avatarUrl(user.discord_user_id, user.avatar)}
          alt={user.username}
          className="w-16 h-16 rounded-full bg-discord-card"
          onError={(ev) => {
            (ev.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
          }}
        />
        <div>
          <h2 className="text-lg font-bold">{user.username}</h2>
          <p className="text-discord-brand font-semibold text-lg">{user.total_points} pt</p>
          <p className="text-discord-muted text-xs">
            参加: {new Date(user.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </div>

      {/* 達成履歴 */}
      <h3 className="text-sm font-semibold text-discord-muted uppercase tracking-wide mb-3">達成履歴</h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-discord-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-discord-muted text-sm text-center py-8">まだミッションを達成していません</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {achievements.map((a) => (
            <div key={a.id} className="bg-discord-surface rounded-lg px-3 py-2.5 flex items-center gap-3">
              <span className="text-discord-green text-base">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.mission?.title ?? "不明なミッション"}</p>
                <p className="text-discord-muted text-xs">
                  {new Date(a.achieved_at).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-discord-brand text-sm font-bold flex-shrink-0">+{a.points_earned}pt</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
