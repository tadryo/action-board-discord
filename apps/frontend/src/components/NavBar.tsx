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
    <nav className="bg-discord-card border-b border-black/30 px-4 py-2 flex items-center gap-1">
      <span className="text-discord-muted text-sm mr-auto font-medium truncate max-w-[120px]">
        {username}
      </span>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === t.id
              ? "bg-discord-brand text-white"
              : "text-discord-muted hover:text-discord-text hover:bg-white/5"
          }`}
        >
          <span>{t.icon}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
