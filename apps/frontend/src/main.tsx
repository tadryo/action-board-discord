import React from "react";
import ReactDOM from "react-dom/client";
import { patchUrlMappings } from "@discord/embedded-app-sdk";
import App from "./App";
import "./index.css";

// Discord Activity の CSP は外部ドメインへの直接通信をブロックするため、
// Supabase へのリクエストを /supabase プレフィックス経由で Discord プロキシに通す。
// frame_id クエリは Discord iframe 起動時のみ付与されるので、ローカル開発では適用しない。
if (new URLSearchParams(window.location.search).has("frame_id")) {
  const supabaseHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;
  patchUrlMappings([{ prefix: "/supabase", target: supabaseHost }]);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
