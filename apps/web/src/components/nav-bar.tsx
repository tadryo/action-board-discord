"use client";

import { useMemo } from "react";
import { isMobilePlatform } from "@/lib/platform";

type Tab = "missions" | "leaderboard" | "profile";

interface Props {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  username: string;
  onAdmin?: () => void;
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "missions",    label: "ミッション",   icon: "🎯" },
  { id: "leaderboard", label: "アクションリーダー", icon: "🏆" },
  { id: "profile",     label: "プロフィール", icon: "👤" },
];

export default function NavBar({ tab, onTabChange, username, onAdmin }: Props) {
  const mobile = useMemo(() => isMobilePlatform(), []);
  return (
    <nav
      className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white sticky top-0 z-10"
      style={{
        borderBottom: "1px solid var(--border-soft)",
        // モバイル(Discord)では上部バー+ノッチを避けるため固定オフセットを上乗せ。
        // env(safe-area-inset-top) が 0 を返す環境でもナビが隠れないようにする。
        paddingTop: mobile
          ? "calc(env(safe-area-inset-top) + 3.75rem)"
          : "calc(0.625rem + env(safe-area-inset-top))",
      }}
    >
      <span className="text-sm font-extrabold truncate flex-1 min-w-0 mr-2 flex items-center gap-1.5" style={{ color: "var(--fg)" }}>
        <span style={{ color: "var(--primary)" }}>●</span>
        {username}
      </span>
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onTabChange(t.id)} className={`tab ${tab === t.id ? "active" : ""} flex items-center gap-1.5`}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
        {onAdmin && (
          <button onClick={onAdmin} className="tab flex items-center gap-1.5">
            <span>🛠</span>
            <span className="hidden sm:inline">承認・管理</span>
          </button>
        )}
      </div>
    </nav>
  );
}
