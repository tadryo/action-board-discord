import type { LevelInfo } from "@/types/database";

// レベル制: total_points から算出する純粋関数（DB不要）。
// レベル L に到達するのに必要な累計ポイントは threshold(L) = 50 * (L-1) * L。
//   L1: 0, L2: 100, L3: 300, L4: 600, L5: 1000, L6: 1500 ...
// レベルが上がるほど必要ポイントが増える（三角数ベース）。
function threshold(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelFromPoints(points: number): LevelInfo {
  const p = Math.max(0, Math.floor(points));
  let level = 1;
  while (threshold(level + 1) <= p) level++;

  const currentLevelFloor = threshold(level);
  const nextLevelAt = threshold(level + 1);
  const pointsForLevel = nextLevelAt - currentLevelFloor;
  const pointsIntoLevel = p - currentLevelFloor;
  const progress = pointsForLevel > 0 ? Math.round((pointsIntoLevel / pointsForLevel) * 100) : 0;

  return { level, currentLevelFloor, nextLevelAt, pointsIntoLevel, pointsForLevel, progress };
}
