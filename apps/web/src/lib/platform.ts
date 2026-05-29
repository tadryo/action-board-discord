// Discord はアクティビティ起動時に ?platform=desktop|ios|android などを付与する。
// それを元にモバイル/デスクトップを判定する（取得不可ならポインタ種別でフォールバック）。
export function isMobilePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search).get("platform");
  if (p) return /ios|android|mobile/i.test(p);
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}
