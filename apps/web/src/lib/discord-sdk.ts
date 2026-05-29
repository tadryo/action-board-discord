import type { DiscordSDK } from "@discord/embedded-app-sdk";

// ブラウザ環境でのみ初期化するレイジーシングルトン
let _sdk: DiscordSDK | null = null;

export async function getDiscordSdk(): Promise<DiscordSDK> {
  if (!_sdk) {
    const { DiscordSDK: SDK } = await import("@discord/embedded-app-sdk");
    _sdk = new SDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
  }
  return _sdk;
}

// アクティビティ(iframe)内では通常の <a> での外部遷移がブロックされるため、
// SDK 経由で外部リンクを開く。SDK が無い環境(ブラウザ直開き等)では window.open にフォールバック。
export async function openExternalLink(url: string): Promise<void> {
  try {
    const sdk = await getDiscordSdk();
    await sdk.commands.openExternalLink({ url });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
