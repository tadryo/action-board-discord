/** @type {import('next').NextConfig} */
const nextConfig = {
  // Discord SDK はクライアント専用。サーバーバンドルから除外する（Turbopack 互換）。
  serverExternalPackages: ["@discord/embedded-app-sdk"],

  // Discord のプロキシ(Cloudflare)がアクティビティのエントリ HTML をキャッシュし、
  // デプロイ後も古い画面が出続けるのを防ぐ。ハッシュ付きの静的アセット
  // (/_next/static) は対象外なので長期キャッシュのまま。
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
