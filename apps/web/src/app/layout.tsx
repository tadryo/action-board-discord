import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

// モバイル対応: 端末幅に合わせ、ノッチ等のセーフエリアまで描画する
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
