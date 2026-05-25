import { useState } from "react";
import { useMissions } from "../hooks/useMissions";
import MissionCard from "../components/MissionCard";
import type { UserRow } from "../types/database";

interface Props {
  user: UserRow;
  accessToken: string;
}

export default function MissionsPage({ user, accessToken }: Props) {
  const { missions, categories, loading, error, refresh } = useMissions(user.id);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-discord-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-discord-red text-sm p-4">{error}</p>;
  }

  const filtered =
    activeCategory === "all" ? missions : missions.filter((m) => m.category_slug === activeCategory);

  const completedCount = missions.filter((m) => m.is_completed).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-4">
        <h1 className="text-lg font-bold">🎯 アクションボード</h1>
        <p className="text-discord-muted text-xs mt-1">
          {completedCount}/{missions.length} ミッション達成 ・ 合計 {user.total_points}pt
        </p>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        <button
          onClick={() => setActiveCategory("all")}
          className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-discord-brand text-white"
              : "bg-discord-surface text-discord-muted hover:text-discord-text"
          }`}
        >
          すべて
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActiveCategory(c.slug)}
            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors ${
              activeCategory === c.slug
                ? "bg-discord-brand text-white"
                : "bg-discord-surface text-discord-muted hover:text-discord-text"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* ミッション一覧 */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-discord-muted text-sm text-center py-8">ミッションがありません</p>
        ) : (
          filtered.map((m) => (
            <MissionCard key={m.id} mission={m} accessToken={accessToken} onAchieved={refresh} />
          ))
        )}
      </div>
    </div>
  );
}
