"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked } from "lucide-react";

import { Navigation } from "@/components/layout/Navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isMenuBook = [
    "/dashboard",
    "/experiences/new",
    "/recommend",
    "/recommend/history",
  ].includes(pathname);

  if (pathname === "/") {
    return <main className="cover-main">{children}</main>;
  }

  return (
    <div className="app-shell">
      <Link href="/" className="app-brand" aria-label="CampusLog 홈">
        <span className="brand-mark" aria-hidden="true">
          <BookMarked />
        </span>
        <span>
          <span className="brand-name">CampusLog</span>
          <span className="brand-copy">대학생활을 단권화하는 기록장</span>
        </span>
      </Link>

      <aside className="app-sidebar" aria-label="CampusLog 노트 북마크 메뉴">
        <Navigation />
      </aside>

      <header className="mobile-header">
        <Link href="/" className="mobile-brand" aria-label="CampusLog 홈">
          <span className="brand-mark" aria-hidden="true">
            <BookMarked />
          </span>
          <span className="brand-name">CampusLog</span>
        </Link>
      </header>

      <main className="app-main">
        <div
          className={`notebook-page${isMenuBook ? " menu-book" : ""}${pathname === "/dashboard" ? " dashboard-book" : ""}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
