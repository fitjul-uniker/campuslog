"use client";

import Link from "next/link";
import { History, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const aiMenuItems = [
  {
    href: "/recommend",
    label: "AI 기반 활동 추천",
    icon: Sparkles,
    isActive: (pathname: string) => pathname === "/recommend",
  },
  {
    href: "/recommend/history",
    label: "추천 기록",
    icon: History,
    isActive: (pathname: string) => pathname.startsWith("/recommend/history"),
  },
];

export function CampusLogAiMenu() {
  const pathname = usePathname();

  return (
    <nav className="campuslog-ai-menu" aria-label="CampusLog AI 메뉴">
      {aiMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("campuslog-ai-menu-link", isActive && "is-active")}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
