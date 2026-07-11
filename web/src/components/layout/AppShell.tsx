"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Navigation } from "@/components/layout/Navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <main className="cover-main">{children}</main>;
  }

  return (
    <div className="app-shell">
      <Link href="/" className="app-brand" aria-label="CampusLog 홈">
        <span className="brand-name">CampusLog</span>
      </Link>

      <aside className="app-sidebar" aria-label="CampusLog 노트 북마크 메뉴">
        <Navigation />
      </aside>

      <header className="mobile-header">
        <Link href="/" className="mobile-brand" aria-label="CampusLog 홈">
          <span className="brand-name">CampusLog</span>
        </Link>
      </header>

      <main className="app-main">
        <div
          className={`notebook-page menu-book${pathname === "/dashboard" ? " dashboard-book" : ""}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
