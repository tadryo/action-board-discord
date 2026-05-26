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
        <div className="w-6 h-6 border-2 border-mirai-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-mirai-danger text-sm p-4">{error}</p>;
  }

  const completedCount = missions.filter((m) => m.is_completed).length;
  const progress = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  const visibleCategories =
    activeCategory === "all" ? categories : categories.filter((c) => c.slug === activeCategory);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-mirai-primary to-mirai-primaryDark rounded-2xl p-5 mb-5 text-white shadow-card">
        <h1 className="text-xl font-bold">🎯 アクションボード</h1>
        <p className="text-white/90 text-sm mt-1">
          政治をもっと身近に。アクションでポイントを貯めよう。
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm font-medium mb-1.5">
            <span>{completedCount}/{missions.length} ミッション達成</span>
            <span>{user.total_points}pt</span>
          </div>
          <div className="h-2 bg-white/25 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        <button
          onClick={() => setActiveCategory("all")}
          className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-mirai-primary text-white"
              : "bg-mirai-surface text-mirai-muted border border-mirai-border hover:text-mirai-text"
          }`}
        >
          すべて
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActiveCategory(c.slug)}
            className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
              activeCategory === c.slug
                ? "bg-mirai-primary text-white"
                : "bg-mirai-surface text-mirai-muted border border-mirai-border hover:text-mirai-text"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* カテゴリ別セクション */}
      <div className="flex flex-col gap-6">
        {visibleCategories.map((c) => {
          const items = missions.filter((m) => m.category_slug === c.slug);
          if (items.length === 0) return null;
          return (
            <section key={c.slug}>
              <h2 className="text-base font-bold text-mirai-text mb-3 flex items-center gap-2">
                <span className="w-1 h-5 bg-mirai-primary rounded-full" />
                {c.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((m) => (
                  <MissionCard key={m.id} mission={m} accessToken={accessToken} onAchieved={refresh} />
                ))}
              </div>
            </section>
          );
        })}
        {missions.length === 0 && (
          <p className="text-mirai-muted text-sm text-center py-8">ミッションがありません</p>
        )}
      </div>
    </div>
  );
}
