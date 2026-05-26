import { useMissions } from "../hooks/useMissions";
import MissionCard from "../components/MissionCard";
import type { UserRow } from "../types/database";

interface Props {
  user: UserRow;
  accessToken: string;
}

export default function MissionsPage({ user, accessToken }: Props) {
  const { missions, categories, loading, error, refresh } = useMissions(user.id);

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

  if (error) {
    return <p className="text-sm p-4" style={{ color: "#dc2626" }}>{error}</p>;
  }

  const completedCount = missions.filter((m) => m.is_completed).length;
  const progress = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  const grouped = categories
    .map((c) => ({ category: c, items: missions.filter((m) => m.category_slug === c.slug) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="pb-8">
      {/* ヒーロー */}
      <div className="bg-gradient-hero px-4 pt-6 pb-7">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-black" style={{ color: "#0a0a0a" }}>
            🎯 アクションボード
          </h1>
          <p className="text-sm mt-1 font-semibold" style={{ color: "#0f766e" }}>
            政治をもっと身近に。アクションでポイントを貯めよう。
          </p>
          <div className="mt-4 card p-4">
            <div className="flex items-center justify-between text-sm font-bold mb-1.5">
              <span style={{ color: "#374151" }}>
                {completedCount}/{missions.length} ミッション達成
              </span>
              <span style={{ color: "var(--primary-deep)" }}>{user.total_points}P</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* カテゴリ別 横スクロール */}
      <div className="max-w-3xl mx-auto pt-5 flex flex-col gap-7">
        {grouped.map(({ category, items }) => (
          <section key={category.slug}>
            <h2 className="text-[1.05rem] font-extrabold px-4 mb-1.5" style={{ color: "#111827" }}>
              {category.title}
            </h2>
            <div className="h-scroll px-4">
              {items.map((m) => (
                <MissionCard key={m.id} mission={m} accessToken={accessToken} onAchieved={refresh} />
              ))}
              <div style={{ flex: "0 0 0.5rem" }} />
            </div>
          </section>
        ))}
        {missions.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>
            ミッションがありません
          </p>
        )}
      </div>
    </div>
  );
}
