import dynamic from "next/dynamic";

// Discord SDK はブラウザ専用のため SSR を無効化
const DiscordApp = dynamic(() => import("@/components/discord-app"), { ssr: false });

export default function Page() {
  return <DiscordApp />;
}
