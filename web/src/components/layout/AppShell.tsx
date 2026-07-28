"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Navigation } from "@/components/layout/Navigation";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { GlassSurface } from "@/components/ui/glass-surface";
import { usePageTransientScrollbar } from "@/hooks/use-transient-scrollbar";

type AppShellProps = {
  children: ReactNode;
};

function ProductShell({ children }: AppShellProps) {
  usePageTransientScrollbar();

  return (
    <div
      className="app-shell product-shell"
      data-liquid-glass="true"
    >
      <Link href="/" className="app-brand" aria-label="CampusLog 홈">
        <span className="brand-name">CampusLog</span>
      </Link>

      <GlassSurface
        as="aside"
        className="app-sidebar"
        variant="regular"
        shape="rounded"
        elevation="bar"
        aria-label="CampusLog 주요 메뉴"
      >
        <Navigation />
        <ProfileMenu />
      </GlassSurface>

      <GlassSurface
        as="header"
        className="mobile-header"
        variant="regular"
        shape="rounded"
        elevation="bar"
      >
        <Link href="/" className="mobile-brand" aria-label="CampusLog 홈">
          <span className="brand-name">CampusLog</span>
        </Link>
        <Navigation variant="mobile" />
        <ProfileMenu variant="mobile" />
      </GlassSurface>

      <main className="app-main product-main">
        <div className="product-surface">{children}</div>
      </main>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding";

  if (pathname === "/") {
    return (
      <main className="cover-main" data-liquid-glass="true">
        {children}
      </main>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="auth-shell" data-liquid-glass="true">
        <Link href="/" className="auth-brand" aria-label="CampusLog 홈">
          <span className="brand-name">CampusLog</span>
        </Link>

        <main className="auth-main">{children}</main>
      </div>
    );
  }

  return <ProductShell>{children}</ProductShell>;
}
