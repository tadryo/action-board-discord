import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import yaml from "js-yaml";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set");
}
const supabase = createClient(url, key);

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = resolve(__dirname, "../../../config/app_settings.yaml");

interface SettingEntry {
  key: string;
  value: string;
}

async function main() {
  const raw = yaml.load(readFileSync(CONFIG_FILE, "utf8")) as Record<string, SettingEntry[]>;
  const settings = raw?.["app_settings"];
  if (!Array.isArray(settings)) {
    throw new Error("app_settings.yaml: トップレベルに \"app_settings\" 配列が見つかりません");
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert(settings, { onConflict: "key" });
  if (error) throw error;

  for (const s of settings) {
    console.log(`✓ ${s.key} = ${s.value}`);
  }
  console.log("完了しました。");
}

main().catch((err) => {
  console.error("同期に失敗しました:", err instanceof Error ? err.message : err);
  process.exit(1);
});
