"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useState } from "react";
import type { AuthState, UserRow } from "@/types/database";

type Action =
  | { type: "LOADING" }
  | { type: "SUCCESS"; user: UserRow; accessToken: string; guildId: string }
  | { type: "ERROR"; error: string }
  | { type: "ADD_POINTS"; delta: number };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case "LOADING": return { ...state, status: "loading", error: null };
    case "SUCCESS": return { status: "authenticated", user: action.user, accessToken: action.accessToken, error: null, guildId: action.guildId };
    case "ERROR":   return { ...state, status: "error", error: action.error };
    case "ADD_POINTS":
      if (!state.user) return state;
      return { ...state, user: { ...state.user, total_points: state.user.total_points + action.delta } };
  }
}

const DiscordAuthContext = createContext<AuthState>({
  status: "idle", user: null, accessToken: null, error: null, guildId: "dm",
});

interface DiscordActions {
  // 達成記録時に呼ぶ: ポイントを楽観更新し、達成バージョンを進める（履歴の再取得トリガー）
  recordAchievement: (pointsEarned: number) => void;
  // 達成のたびに増えるカウンタ。プロフィール等が達成履歴を再取得する依存値に使う
  achievementVersion: number;
}

const DiscordActionsContext = createContext<DiscordActions>({
  recordAchievement: () => {},
  achievementVersion: 0,
});

export function useDiscordAuth() {
  return useContext(DiscordAuthContext);
}

export function useDiscordActions() {
  return useContext(DiscordActionsContext);
}

export function DiscordProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    status: "loading", user: null, accessToken: null, error: null, guildId: "dm",
  });
  const [achievementVersion, setAchievementVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function authenticate() {
      dispatch({ type: "LOADING" });
      try {
        const { getDiscordSdk } = await import("@/lib/discord-sdk");
        const sdk = await getDiscordSdk();

        await sdk.ready();
        const guildId = sdk.guildId ?? "dm";

        const { code } = await sdk.commands.authorize({
          client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "guilds"],
        });

        const tokenRes = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
        const { access_token } = await tokenRes.json() as { access_token: string };

        await sdk.commands.authenticate({ access_token });

        const meRes = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
          body: JSON.stringify({ guild_id: guildId }),
        });
        if (!meRes.ok) throw new Error(`User registration failed: ${meRes.status}`);
        const user = await meRes.json() as UserRow;

        if (!cancelled) dispatch({ type: "SUCCESS", user, accessToken: access_token, guildId });
      } catch (err) {
        console.error("Discord auth error:", err);
        if (!cancelled) dispatch({ type: "ERROR", error: (err as Error).message });
      }
    }

    authenticate();
    return () => { cancelled = true; };
  }, []);

  const recordAchievement = useCallback((pointsEarned: number) => {
    dispatch({ type: "ADD_POINTS", delta: pointsEarned });
    setAchievementVersion((v) => v + 1);
  }, []);

  return (
    <DiscordActionsContext.Provider value={{ recordAchievement, achievementVersion }}>
      <DiscordAuthContext.Provider value={state}>
        {children}
      </DiscordAuthContext.Provider>
    </DiscordActionsContext.Provider>
  );
}
