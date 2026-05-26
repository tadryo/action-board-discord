import { useState } from "react";
import { useDiscordAuth } from "./hooks/useDiscordAuth";
import MissionsPage from "./pages/MissionsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import LoadingScreen from "./components/LoadingScreen";
import ErrorScreen from "./components/ErrorScreen";
import NavBar from "./components/NavBar";

type Tab = "missions" | "leaderboard" | "profile";

export default function App() {
  const auth = useDiscordAuth();
  const [tab, setTab] = useState<Tab>("missions");

  if (auth.status === "idle" || auth.status === "loading") {
    return <LoadingScreen />;
  }

  if (auth.status === "error" || !auth.user) {
    return <ErrorScreen message={auth.error ?? "認証に失敗しました"} />;
  }

  return (
    <div className="flex flex-col h-screen bg-mirai-bg text-mirai-text">
      <NavBar tab={tab} onTabChange={setTab} username={auth.user.username} />
      <main className="flex-1 overflow-y-auto">
        {tab === "missions" && <MissionsPage user={auth.user} accessToken={auth.accessToken!} />}
        {tab === "leaderboard" && <LeaderboardPage guildId={auth.user.guild_id} currentUserId={auth.user.discord_user_id} />}
        {tab === "profile" && <ProfilePage user={auth.user} />}
      </main>
    </div>
  );
}
