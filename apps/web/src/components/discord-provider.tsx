"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import type { AuthState, UserRow } from "@/types/database";

type Action =
  | { type: "LOADING" }
  | { type: "SUCCESS"; user: UserRow; accessToken: string; guildId: string }
  | { type: "ERROR"; error: string };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case "LOADING": return { ...state, status: "loading", error: null };
    case "SUCCESS": return { status: "authenticated", user: action.user, accessToken: action.accessToken, error: null, guildId: action.guildId };
    case "ERROR":   return { ...state, status: "error", error: action.error };
  }
}

const DiscordAuthContext = createContext<AuthState>({
  status: "idle", user: null, accessToken: null, error: null, guildId: "dm",
});

export function useDiscordAuth() {
  return useContext(DiscordAuthContext);
}

export function DiscordProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    status: "loading", user: null, accessToken: null, error: null, guildId: "dm",
  });

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

  return (
    <DiscordAuthContext.Provider value={state}>
      {children}
    </DiscordAuthContext.Provider>
  );
}
