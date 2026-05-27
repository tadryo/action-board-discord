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
