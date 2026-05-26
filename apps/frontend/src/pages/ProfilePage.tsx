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
      <div className="bg-mirai-surface rounded-2xl p-5 border border-mirai-border shadow-card flex items-center gap-4 mb-6">
        <img
          src={avatarUrl(user.discord_user_id, user.avatar)}
          alt={user.username}
          className="w-16 h-16 rounded-full bg-mirai-bg ring-2 ring-mirai-primary/30"
          onError={(ev) => {
            (ev.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
          }}
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-mirai-text truncate">{user.username}</h2>
          <p className="text-mirai-primaryDark font-bold text-2xl leading-tight">{user.total_points}<span className="text-base ml-1">pt</span></p>
          <p className="text-mirai-muted text-xs mt-0.5">
            参加: {new Date(user.created_at).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </div>

      {/* 達成履歴 */}
      <h3 className="text-sm font-bold text-mirai-text mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-mirai-primary rounded-full" />
        達成履歴
      </h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-mirai-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-mirai-muted text-sm text-center py-8">まだミッションを達成していません</p>
      ) : (
        <div className="flex flex-col gap-2">
          {achievements.map((a) => (
            <div key={a.id} className="bg-mirai-surface rounded-xl px-3 py-2.5 flex items-center gap-3 border border-mirai-border shadow-card">
              <span className="text-mirai-success text-base">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-mirai-text">{a.mission?.title ?? "不明なミッション"}</p>
                <p className="text-mirai-muted text-xs">
                  {new Date(a.achieved_at).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-mirai-primaryDark text-sm font-bold flex-shrink-0">+{a.points_earned}pt</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
