"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const PROXIMITY_RADIUS = 82;
const SMOOTHING_MS = 120;

const navigationItems = [
  {
    href: "/dashboard",
    label: "나의 경험",
    mobileLabel: "경험",
  },
  {
    href: "/recommend",
    label: "AI 추천 및 활용",
    mobileLabel: "AI 추천",
    exact: true,
  },
  {
    href: "/recommend/history",
    label: "추천 기록",
    mobileLabel: "기록",
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/experiences/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavigationProps = {
  variant?: "desktop" | "mobile";
};

export function Navigation({ variant = "desktop" }: NavigationProps) {
  const pathname = usePathname();
  const navigationRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const activeIndex = navigationItems.findIndex((item) =>
    item.exact
      ? pathname === item.href
      : isActivePath(pathname, item.href),
  );
  const activeIndexRef = useRef(activeIndex);

  activeIndexRef.current = activeIndex;

  const runFrame = useCallback((now: number) => {
    const deltaTime = Math.min((now - lastFrameRef.current) / 1000, 0.05);
    const smoothing = Math.max(SMOOTHING_MS, 1) / 1000;
    const easing = 1 - Math.exp(-deltaTime / smoothing);
    let isMoving = false;

    lastFrameRef.current = now;

    itemRefs.current.forEach((element, index) => {
      if (!element) {
        return;
      }

      const target = Math.max(
        targetsRef.current[index] ?? 0,
        activeIndexRef.current === index ? 1 : 0,
      );
      const current = currentRef.current[index] ?? 0;
      const next = current + (target - current) * easing;
      const isSettled = Math.abs(target - next) < 0.0015;
      const effect = isSettled ? target : next;

      currentRef.current[index] = effect;
      element.style.setProperty("--navigation-effect", effect.toFixed(4));
      isMoving ||= !isSettled;
    });

    animationFrameRef.current = isMoving
      ? requestAnimationFrame(runFrame)
      : null;
  }, []);

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    lastFrameRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        event.pointerType !== "mouse" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const navigation = navigationRef.current;

      if (!navigation) {
        return;
      }

      const navigationRect = navigation.getBoundingClientRect();
      const pointerY = event.clientY - navigationRect.top;

      itemRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        const center = element.offsetTop + element.offsetHeight / 2;
        const proximity = Math.max(
          0,
          1 - Math.abs(pointerY - center) / PROXIMITY_RADIUS,
        );

        targetsRef.current[index] =
          proximity * proximity * (3 - 2 * proximity);
      });

      startAnimation();
    },
    [startAnimation],
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = navigationItems.map(() => 0);
    startAnimation();
  }, [startAnimation]);

  useEffect(() => {
    startAnimation();
  }, [activeIndex, startAnimation]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const handleMotionPreference = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        targetsRef.current = navigationItems.map(() => 0);
        currentRef.current = navigationItems.map(() => 0);
        itemRefs.current.forEach((element) => {
          element?.style.setProperty("--navigation-effect", "0");
        });
        return;
      }

      startAnimation();
    };

    handleMotionPreference(motionPreference);
    motionPreference.addEventListener("change", handleMotionPreference);

    return () => {
      motionPreference.removeEventListener("change", handleMotionPreference);
    };
  }, [startAnimation]);

  return (
    <nav
      ref={navigationRef}
      className={`navigation navigation-${variant}`}
      aria-label="주요 메뉴"
      onPointerMove={variant === "desktop" ? handlePointerMove : undefined}
      onPointerLeave={variant === "desktop" ? handlePointerLeave : undefined}
    >
      {navigationItems.map((item, index) => {
        const isActive = item.exact
          ? pathname === item.href
          : isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            href={item.href}
            className={cn("navigation-link", isActive && "is-active")}
            aria-current={
              isActive
                ? pathname === item.href
                  ? "page"
                  : "location"
                : undefined
            }
          >
            <span className="navigation-label">
              {variant === "mobile" ? item.mobileLabel : item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
