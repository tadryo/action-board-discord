import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "チームみらい アクションボード",
  description: "チームみらい学生チーム向けアクションボード",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
