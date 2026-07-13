"use client";

import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type ScrollFloatProps = {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
};

export function ScrollFloat({
  children,
  scrollContainerRef,
  containerClassName = "",
  textClassName = "",
  animationDuration = 1,
  ease = "power2.out",
  scrollStart = "center top+=40%",
  scrollEnd = "center top+=12%",
  stagger = 0.03,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion) {
      return;
    }

    const animatedElement = container.querySelector<HTMLElement>(
      "[data-scroll-float-content]",
    );
    if (!animatedElement) {
      return;
    }

    let cancelled = false;
    let revertAnimation: (() => void) | undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollTriggerModule]) => {
        if (cancelled) {
          return;
        }

        const { gsap } = gsapModule;
        const { ScrollTrigger } = scrollTriggerModule;
        gsap.registerPlugin(ScrollTrigger);

        const context = gsap.context(() => {
          gsap.fromTo(
            animatedElement,
            {
              willChange: "opacity, filter, transform",
              opacity: 1,
              yPercent: 0,
              scale: 1,
              filter: "blur(0px)",
            },
            {
              duration: animationDuration,
              ease,
              opacity: 0,
              yPercent: -32,
              scale: 0.94,
              filter: "blur(12px)",
              stagger,
              scrollTrigger: {
                trigger: container,
                scroller: scrollContainerRef?.current ?? undefined,
                start: scrollStart,
                end: scrollEnd,
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }, container);

        revertAnimation = () => context.revert();
      },
    );

    return () => {
      cancelled = true;
      revertAnimation?.();
    };
  }, [
    animationDuration,
    ease,
    prefersReducedMotion,
    scrollContainerRef,
    scrollEnd,
    scrollStart,
    stagger,
  ]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden", containerClassName)}>
      <div data-scroll-float-content className={textClassName}>
        {children}
      </div>
    </div>
  );
}
