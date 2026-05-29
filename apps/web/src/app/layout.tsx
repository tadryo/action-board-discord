import type { Viewport } from "next";
import "./globals.css";
import { getAppSettings } from "@/lib/app-config";

export async function generateMetadata() {
  const { appName, appTagline } = await getAppSettings();
  return {
    title: appName,
    description: appTagline,
  };
}

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
