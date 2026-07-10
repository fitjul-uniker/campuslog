"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/dashboard",
    label: "나의 경험",
  },
  {
    href: "/experiences/new",
    label: "새 경험 기록",
  },
  {
    href: "/recommend",
    label: "AI 추천",
    exact: true,
  },
  {
    href: "/recommend/history",
    label: "추천 기록",
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="navigation" aria-label="주요 메뉴">
      {navigationItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("navigation-link", isActive && "is-active")}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="navigation-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
