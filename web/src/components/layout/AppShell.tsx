"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Navigation } from "@/components/layout/Navigation";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding";

  if (pathname === "/") {
    return <main className="cover-main">{children}</main>;
  }

  if (isAuthRoute) {
    return (
      <div className="auth-shell">
        <Link href="/" className="auth-brand" aria-label="CampusLog 홈">
          <span className="brand-name">CampusLog</span>
        </Link>

        <main className="auth-main">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell product-shell">
      <Link href="/" className="app-brand" aria-label="CampusLog 홈">
        <span className="brand-name">CampusLog</span>
      </Link>

      <aside className="app-sidebar" aria-label="CampusLog 주요 메뉴">
        <Navigation />
        <ProfileMenu />
      </aside>

      <header className="mobile-header">
        <Link href="/" className="mobile-brand" aria-label="CampusLog 홈">
          <span className="brand-name">CampusLog</span>
        </Link>
        <Navigation variant="mobile" />
        <ProfileMenu variant="mobile" />
      </header>

      <main className="app-main product-main">
        <div className="product-surface">{children}</div>
      </main>
    </div>
  );
}
