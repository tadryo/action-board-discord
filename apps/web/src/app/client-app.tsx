"use client";

import dynamic from "next/dynamic";

// Discord SDK はブラウザ専用のため SSR を無効化（Client Component 内でのみ ssr:false が許可される）
const DiscordApp = dynamic(() => import("@/components/discord-app"), { ssr: false });

export default function ClientApp() {
  return <DiscordApp />;
}
