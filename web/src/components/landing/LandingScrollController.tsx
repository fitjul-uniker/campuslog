"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

const WHEEL_THRESHOLD = 8;
const WHEEL_RESET_DELAY = 140;
const SCROLL_LOCK_DELAY = 900;

export function LandingScrollController() {
  const prefersReducedMotion = useReducedMotion();
  const accumulatedDeltaRef = useRef(0);
  const resetTimerRef = useRef<number | undefined>(undefined);
  const unlockTimerRef = useRef<number | undefined>(undefined);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const authSection = document.getElementById("auth");
    if (!authSection) {
      return;
    }

    const clearTimer = (timerRef: typeof resetTimerRef) => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };

    const moveToAuth = () => {
      isTransitioningRef.current = true;
      accumulatedDeltaRef.current = 0;

      authSection.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      clearTimer(unlockTimerRef);
      unlockTimerRef.current = window.setTimeout(
        () => {
          isTransitioningRef.current = false;
        },
        prefersReducedMotion ? 120 : SCROLL_LOCK_DELAY,
      );
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY === 0) {
        return;
      }

      const authTop =
        authSection.getBoundingClientRect().top + window.scrollY;
      const currentScroll = window.scrollY;
      const isHeroRange = currentScroll < authTop * 0.55;
      const shouldMoveToAuth = event.deltaY > 0 && isHeroRange;

      if (!shouldMoveToAuth) {
        return;
      }

      event.preventDefault();

      if (isTransitioningRef.current) {
        return;
      }

      if (
        accumulatedDeltaRef.current !== 0 &&
        Math.sign(accumulatedDeltaRef.current) !== Math.sign(event.deltaY)
      ) {
        accumulatedDeltaRef.current = 0;
      }

      accumulatedDeltaRef.current += event.deltaY;
      clearTimer(resetTimerRef);
      resetTimerRef.current = window.setTimeout(() => {
        accumulatedDeltaRef.current = 0;
      }, WHEEL_RESET_DELAY);

      if (Math.abs(accumulatedDeltaRef.current) < WHEEL_THRESHOLD) {
        return;
      }

      moveToAuth();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimer(resetTimerRef);
      clearTimer(unlockTimerRef);
    };
  }, [prefersReducedMotion]);

  return null;
}
