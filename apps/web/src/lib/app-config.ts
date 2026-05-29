// コミュニティごとの表示名・キャッチコピーを環境変数で設定できるようにする。
// NEXT_PUBLIC_* はビルド時に埋め込まれるため、変更後は再ビルド（Railway は再デプロイ）が必要。
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "アクションボード";

export const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE?.trim() || "アクションでポイントを貯めよう。";
