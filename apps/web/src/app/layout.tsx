import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "チームみらい アクションボード",
  description: "チームみらい学生チーム向けアクションボード",
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
