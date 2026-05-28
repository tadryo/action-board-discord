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
      {/* 各タブは常にマウントしたままにし、表示のみ切り替える。
          起動時に全タブが裏で読み込まれるため、切り替え時は再取得もスピナーも発生しない。 */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: tab === "missions" ? "block" : "none" }}>
          <MissionsPage user={user} accessToken={accessToken} />
        </div>
        <div style={{ display: tab === "leaderboard" ? "block" : "none" }}>
          <LeaderboardPage guildId={guildId} currentUserId={user.discord_user_id} />
        </div>
        <div style={{ display: tab === "profile" ? "block" : "none" }}>
          <ProfilePage user={user} />
        </div>
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
