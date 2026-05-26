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
  name: "アクションボード",
  description: "アクションボードを開く",
  type: 4,
  handler: 2,
  integration_types: [0, 1], // 0=Guild, 1=User
  contexts: [0, 1, 2], // 0=Guild, 1=BotDM, 2=PrivateChannel
};

async function main() {
  const res = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`登録に失敗しました (HTTP ${res.status}):`, text);
    process.exit(1);
  }

  console.log("✓ スラッシュコマンドを登録しました:");
  console.log(`  /${command.name}`);
  console.log("グローバルコマンドは反映に最大1時間かかる場合があります。");
}

main().catch((err) => {
  console.error("登録に失敗しました:", err instanceof Error ? err.message : err);
  process.exit(1);
});
