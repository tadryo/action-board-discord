import { useEffect, useReducer } from "react";
import { discordSdk } from "../lib/discordSdk";
import type { AuthState, UserRow } from "../types/database";

type Action =
  | { type: "LOADING" }
  | { type: "SUCCESS"; user: UserRow; accessToken: string }
  | { type: "ERROR"; error: string };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case "LOADING":
      return { ...state, status: "loading", error: null };
    case "SUCCESS":
      return { status: "authenticated", user: action.user, accessToken: action.accessToken, error: null };
    case "ERROR":
      return { ...state, status: "error", error: action.error };
  }
}

const initialState: AuthState = {
  status: "idle",
  user: null,
  accessToken: null,
  error: null,
};

export function useDiscordAuth() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;

    async function authenticate() {
      dispatch({ type: "LOADING" });
      try {
        await discordSdk.ready();

        // Step 1: Discordに認可コードを要求
        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_CLIENT_ID,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "guilds"],
        });

        // Step 2: バックエンドでaccess_tokenに交換
        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
        const { access_token } = (await res.json()) as { access_token: string };

        // Step 3: Discord SDKで認証完了（SDK内部の状態を確定させるために必要）
        await discordSdk.commands.authenticate({ access_token });

        // Step 4: guildId取得
        const guildId = discordSdk.guildId ?? "dm";

        // Step 5: バックエンド経由でユーザーを登録・更新（service_roleでRLSを通過）
        const meRes = await fetch("/api/me", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({ guild_id: guildId }),
        });

        if (!meRes.ok) throw new Error(`User registration failed: ${meRes.status}`);
        const user = (await meRes.json()) as UserRow;

        if (!cancelled) dispatch({ type: "SUCCESS", user, accessToken: access_token });
      } catch (err) {
        console.error("Discord auth error:", err);
        if (!cancelled) dispatch({ type: "ERROR", error: `${(err as Error).message}` });
      }
    }

    authenticate();
    return () => { cancelled = true; };
  }, []);

  return state;
}
