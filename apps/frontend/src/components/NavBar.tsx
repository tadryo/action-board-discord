type Tab = "missions" | "leaderboard" | "profile";

interface Props {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  username: string;
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "missions", label: "ミッション", icon: "🎯" },
  { id: "leaderboard", label: "ランキング", icon: "🏆" },
  { id: "profile", label: "プロフィール", icon: "👤" },
];

export default function NavBar({ tab, onTabChange, username }: Props) {
  return (
    <nav className="bg-mirai-surface border-b border-mirai-border px-4 py-2.5 flex items-center gap-1 shadow-card">
      <span className="text-mirai-text text-sm mr-auto font-bold truncate max-w-[120px] flex items-center gap-1.5">
        <span className="text-mirai-primary">●</span>
        {username}
      </span>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === t.id
              ? "bg-mirai-primary text-white shadow-sm"
              : "text-mirai-muted hover:text-mirai-text hover:bg-mirai-primarySoft"
          }`}
        >
          <span>{t.icon}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
