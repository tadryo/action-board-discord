"use client";

import { useState } from "react";
import { DiscordProvider, useDiscordAuth } from "@/components/discord-provider";
import LoadingScreen from "@/components/loading-screen";
import ErrorScreen from "@/components/error-screen";
import NavBar from "@/components/nav-bar";
import MissionsPage from "@/components/missions-page";
import LeaderboardPage from "@/components/leaderboard-page";
import ProfilePage from "@/components/profile-page";

type Tab = "missions" | "leaderboard" | "profile";

function AppContent() {
  const { status, user, accessToken, error, guildId } = useDiscordAuth();
  const [tab, setTab] = useState<Tab>("missions");

  if (status === "loading" || status === "idle") return <LoadingScreen />;
  if (status === "error") return <ErrorScreen message={error ?? "エラーが発生しました"} />;
  if (!user || !accessToken) return <ErrorScreen message="認証に失敗しました" />;

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <NavBar tab={tab} onTabChange={setTab} username={user.username} />
      <main style={{ flex: 1, overflowY: "auto" }}>
        {tab === "missions"    && <MissionsPage user={user} accessToken={accessToken} />}
        {tab === "leaderboard" && <LeaderboardPage guildId={guildId} currentUserId={user.discord_user_id} />}
        {tab === "profile"     && <ProfilePage user={user} accessToken={accessToken} />}
      </main>
    </div>
  );
}

export default function DiscordApp() {
  return (
    <DiscordProvider>
      <AppContent />
    </DiscordProvider>
  );
}
