"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, PenLine, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    label: "나의 경험",
    description: "기록한 활동 경험",
    icon: BookOpenText,
  },
  {
    href: "/experiences/new",
    label: "새 경험 기록",
    description: "활동 경험 작성",
    icon: PenLine,
  },
  {
    href: "/recommend",
    label: "AI 추천",
    description: "경험 활용",
    icon: Sparkles,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="navigation" aria-label="주요 메뉴">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("navigation-link", isActive && "is-active")}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="navigation-icon" aria-hidden="true" />
            <span>
              <span className="navigation-label">{item.label}</span>
              <span className="navigation-description">{item.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
