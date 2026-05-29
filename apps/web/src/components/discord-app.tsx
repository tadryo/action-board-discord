"use client";

import { useEffect, useState } from "react";
import { DiscordProvider, useDiscordAuth } from "@/components/discord-provider";
import LoadingScreen from "@/components/loading-screen";
import ErrorScreen from "@/components/error-screen";
import NavBar from "@/components/nav-bar";
import MissionsPage from "@/components/missions-page";
import LeaderboardPage from "@/components/leaderboard-page";
import ProfilePage from "@/components/profile-page";
import AdminDashboard from "@/components/admin-dashboard";
import type { AdminScope } from "@/types/database";

type Tab = "missions" | "leaderboard" | "profile";

function AppContent() {
  const { status, user, accessToken, error, guildId } = useDiscordAuth();
  const [tab, setTab] = useState<Tab>("missions");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminScope, setAdminScope] = useState<AdminScope | null>(null);
  const [selfDiscordId, setSelfDiscordId] = useState<string | null>(null);

  // 自分が管理者（代表・副代表・部門長・開発者）か確認し、該当時のみ承認ボタンを出す。
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    fetch("/api/admin/whoami", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { scope: AdminScope; discord_user_id: string } | null) => {
        if (!cancelled && data) {
          setAdminScope(data.scope);
          setSelfDiscordId(data.discord_user_id);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [accessToken]);

  if (status === "loading" || status === "idle") return <LoadingScreen />;
  if (status === "error") return <ErrorScreen message={error ?? "エラーが発生しました"} />;
  if (!user || !accessToken) return <ErrorScreen message="認証に失敗しました" />;

  if (showAdmin && adminScope) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <div
          className="bg-gradient-hero px-5 pb-5 sticky top-0 z-10"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.75rem)" }}
        >
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setShowAdmin(false)} className="text-sm font-bold mb-2 inline-flex items-center gap-1" style={{ color: "var(--primary-700)" }}>← 戻る</button>
            <h1 className="text-2xl font-black" style={{ color: "#0a0a0a" }}>🛠 承認・管理</h1>
            <p className="text-sm mt-1 font-semibold" style={{ color: "var(--primary-deep)" }}>提案の承認やミッション・権限を管理します。</p>
          </div>
        </div>
        <main style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1rem", paddingBottom: "env(safe-area-inset-bottom)" }}>
          <AdminDashboard scope={adminScope} accessToken={accessToken} selfDiscordId={selfDiscordId} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <NavBar tab={tab} onTabChange={setTab} username={user.username} onAdmin={adminScope ? () => setShowAdmin(true) : undefined} />
      {/* 各タブは常にマウントしたままにし、表示のみ切り替える。
          起動時に全タブが裏で読み込まれるため、切り替え時は再取得もスピナーも発生しない。 */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: tab === "missions" ? "block" : "none" }}>
          <MissionsPage user={user} accessToken={accessToken} />
        </div>
        <div style={{ display: tab === "leaderboard" ? "block" : "none" }}>
          <LeaderboardPage guildId={guildId} currentUser={user} />
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
