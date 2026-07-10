import type { ReactNode } from "react";
import Link from "next/link";
import { BookMarked } from "lucide-react";

import { Navigation } from "@/components/layout/Navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="CampusLog 사이드바">
        <Link href="/" className="brand" aria-label="CampusLog 홈">
          <span className="brand-mark" aria-hidden="true">
            <BookMarked />
          </span>
          <span>
            <span className="brand-name">CampusLog</span>
            <span className="brand-copy">대학생활을 단권화하는 기록장</span>
          </span>
        </Link>

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

      <main className="app-main">{children}</main>
    </div>
  );
}
