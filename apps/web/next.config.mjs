/** @type {import('next').NextConfig} */
const nextConfig = {
  // Discord SDK はクライアント専用。サーバーバンドルから除外する（Turbopack 互換）。
  serverExternalPackages: ["@discord/embedded-app-sdk"],
};

export default nextConfig;
