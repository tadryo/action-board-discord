import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import yaml from "js-yaml";
import { supabase } from "../lib/supabase";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../../../mission_data");

interface CategoryYaml {
  slug: string;
  title: string;
  sort_no: number;
}

interface MissionYaml {
  slug: string;
  title: string;
  description: string | null;
  difficulty: number;
  points: number;
  submission_type: "TEXT" | "LINK" | "NONE";
  max_achievement_count: number | null;
  category_slug: string;
  is_hidden: boolean;
}

function load<T>(file: string, key: string): T[] {
  const raw = yaml.load(readFileSync(resolve(DATA_DIR, file), "utf8")) as Record<string, T[]>;
  const items = raw?.[key];
  if (!Array.isArray(items)) {
    throw new Error(`${file}: トップレベルに "${key}" 配列が見つかりません`);
  }
  return items;
}

async function main() {
  const categories = load<CategoryYaml>("categories.yaml", "categories");
  const missions = load<MissionYaml>("missions.yaml", "missions");

  const knownSlugs = new Set(categories.map((c) => c.slug));
  for (const m of missions) {
    if (!knownSlugs.has(m.category_slug)) {
      throw new Error(`mission "${m.slug}": 未知の category_slug "${m.category_slug}"`);
    }
  }

  const { error: catError } = await supabase
    .from("categories")
    .upsert(categories, { onConflict: "slug" });
  if (catError) throw catError;
  console.log(`✓ categories: ${categories.length}件を同期`);

  const { error: misError } = await supabase
    .from("missions")
    .upsert(missions, { onConflict: "slug" });
  if (misError) throw misError;
  console.log(`✓ missions: ${missions.length}件を同期`);

  console.log("完了しました。");
}

main().catch((err) => {
  console.error("同期に失敗しました:", err instanceof Error ? err.message : err);
  process.exit(1);
});
