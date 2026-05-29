"use client";

import { useEffect, useState } from "react";

interface Stats {
  members: number;
  members_today: number;
  achievements: number;
  achievements_today: number;
}

function StatRow({ label, value, delta, unit, divider }: {
  label: string;
  value: number;
  delta: number;
  unit: string;
  divider: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-3"
      style={{ borderBottom: divider ? "1px solid var(--border-soft)" : "none" }}>
      <span className="text-sm font-bold" style={{ color: "var(--fg)" }}>{label}</span>
      <div className="text-right">
        <span className="text-xl font-black" style={{ color: "var(--fg)" }}>
          {value.toLocaleString("ja-JP")}{unit}
        </span>
        {delta > 0 && (
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            1日で <span className="font-bold" style={{ color: "var(--primary-deep)" }}>+{delta.toLocaleString("ja-JP")}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ホーム上部に出す学生チームの活動状況サマリー。
export default function TeamStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`/api/stats?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Stats | null) => { if (data) setStats(data); })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="mt-4 card p-4">
      <h2 className="text-sm font-extrabold mb-1" style={{ color: "var(--fg)" }}>🚀 学生チームの活動状況</h2>
      <StatRow label="メンバー数" value={stats.members} delta={stats.members_today} unit="人" divider />
      <StatRow label="達成アクション数" value={stats.achievements} delta={stats.achievements_today} unit="件" divider={false} />
    </div>
  );
}
