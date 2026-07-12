import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "CampusLog",
  description: "대학생활을 단권화하는 AI 경험 기록장",
  icons: {
    icon: [{ url: "/favicon.svg?v=wordmark", type: "image/svg+xml" }],
    apple: [{ url: "/app-icon.svg?v=wordmark", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
