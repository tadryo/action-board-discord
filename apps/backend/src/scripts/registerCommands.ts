import "dotenv/config";
import fetch from "node-fetch";

const APP_ID = process.env.DISCORD_CLIENT_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error("DISCORD_CLIENT_ID と DISCORD_BOT_TOKEN を環境変数に設定してください。");
  process.exit(1);
}

// type 4 = PRIMARY_ENTRY_POINT, handler 2 = DISCORD_LAUNCH_ACTIVITY
// Discord 側が Activity 起動を処理するため、インタラクション受信サーバーは不要。
const command = {
  name: "action-board",
  description: "アクションボードを開く",
  type: 4,
  handler: 2,
  integration_types: [0, 1], // 0=Guild, 1=User
  contexts: [0, 1, 2], // 0=Guild, 1=BotDM, 2=PrivateChannel
};

const BASE = `https://discord.com/api/v10/applications/${APP_ID}/commands`;
const HEADERS = {
  Authorization: `Bot ${BOT_TOKEN}`,
  "Content-Type": "application/json",
};

async function main() {
  // Discord は Activities 有効化時に Entry Point コマンド(type 4)を自動生成する。
  // アプリは type 4 を1つしか持てないため、既存があれば PATCH で更新する。
  const listRes = await fetch(BASE, { headers: HEADERS });
  if (!listRes.ok) {
    console.error(`コマンド一覧の取得に失敗しました (HTTP ${listRes.status}):`, await listRes.text());
    process.exit(1);
  }
  const existing = (await listRes.json()) as { id: string; type: number }[];
  const entryPoint = existing.find((c) => c.type === 4);

  const method = entryPoint ? "PATCH" : "POST";
  const url = entryPoint ? `${BASE}/${entryPoint.id}` : BASE;

  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: JSON.stringify(command),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`登録に失敗しました (HTTP ${res.status}):`, text);
    process.exit(1);
  }

  console.log(`✓ スラッシュコマンドを${entryPoint ? "更新" : "登録"}しました:`);
  console.log(`  /${command.name}`);
  console.log("グローバルコマンドは反映に最大1時間かかる場合があります。");
}

main().catch((err) => {
  console.error("登録に失敗しました:", err instanceof Error ? err.message : err);
  process.exit(1);
});
