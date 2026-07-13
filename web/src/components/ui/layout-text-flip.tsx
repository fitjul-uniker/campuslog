"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type LayoutTextFlipEntry =
  | string
  | {
      text: string;
      particle?: string;
      emphasis?: boolean;
    };

type LayoutTextFlipProps = {
  text?: string;
  words: readonly LayoutTextFlipEntry[];
  suffix?: string;
  duration?: number;
  isPaused?: boolean;
  className?: string;
  wordClassName?: string;
};

export function LayoutTextFlip({
  text = "",
  words,
  suffix = "",
  duration = 3000,
  isPaused = false,
  className,
  wordClassName,
}: LayoutTextFlipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wordWidth, setWordWidth] = useState<number>();
  const wordMeasureRef = useRef<HTMLSpanElement>(null);
  const wordWidthRef = useRef<number | undefined>(undefined);
  const prefersReducedMotion = useReducedMotion();
  const wordCount = words.length;

  useEffect(() => {
    if (prefersReducedMotion || isPaused || wordCount <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % wordCount);
    }, duration);

    return () => window.clearInterval(interval);
  }, [duration, isPaused, prefersReducedMotion, wordCount]);

  const visibleEntry = words[currentIndex % Math.max(wordCount, 1)] ?? "";
  const visibleWord =
    typeof visibleEntry === "string" ? visibleEntry : visibleEntry.text;
  const visibleParticle =
    typeof visibleEntry === "string" ? "" : (visibleEntry.particle ?? "");
  const isVisibleEntryEmphasized =
    typeof visibleEntry === "string" || visibleEntry.emphasis === true;
  const emphasisClassName = isVisibleEntryEmphasized
    ? "is-emphasized"
    : "is-muted";

  useLayoutEffect(() => {
    const measure = wordMeasureRef.current;
    if (!measure) {
      return;
    }

    let cancelled = false;
    let widthUpdateTimer: number | undefined;

    const updateWidth = () => {
      const nextWidth = measure.getBoundingClientRect().width;
      const currentWidth = wordWidthRef.current;
      const shouldChoreographWidth =
        !prefersReducedMotion &&
        currentWidth !== undefined &&
        Math.abs(currentWidth - nextWidth) > 0.5;

      if (widthUpdateTimer !== undefined) {
        window.clearTimeout(widthUpdateTimer);
      }

      const commitWidth = () => {
        if (!cancelled) {
          wordWidthRef.current = nextWidth;
          setWordWidth(nextWidth);
        }
      };

      if (shouldChoreographWidth) {
        widthUpdateTimer = window.setTimeout(commitWidth, 150);
      } else {
        commitWidth();
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(measure);
    void document.fonts?.ready.then(updateWidth);

    return () => {
      cancelled = true;
      if (widthUpdateTimer !== undefined) {
        window.clearTimeout(widthUpdateTimer);
      }
      resizeObserver.disconnect();
    };
  }, [prefersReducedMotion, visibleWord]);

  const widthTransition = {
    duration: prefersReducedMotion ? 0 : 0.44,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <span aria-hidden="true" className={cn("layout-text-flip", className)}>
      {text ? <span>{text}</span> : null}
      <span className="layout-text-flip-subject">
        <motion.span
          animate={wordWidth === undefined ? undefined : { width: wordWidth }}
          className={cn("layout-text-flip-word", wordClassName)}
          initial={false}
          transition={widthTransition}
        >
          <span
            ref={wordMeasureRef}
            className={cn("layout-text-flip-measure", emphasisClassName)}
          >
            {visibleWord}
          </span>

          <AnimatePresence initial={false} mode="sync">
            <motion.span
              key={visibleWord}
              initial={
                prefersReducedMotion
                  ? false
                  : { y: "-0.12em", opacity: 0, filter: "blur(1.5px)" }
              }
              animate={{
                y: 0,
                opacity: 1,
                filter: "blur(0px)",
                transition: {
                  duration: prefersReducedMotion ? 0 : 0.28,
                  delay: prefersReducedMotion ? 0 : 0.1,
                  ease: [0.22, 1, 0.36, 1],
                },
              }}
              exit={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : {
                      y: "0.12em",
                      opacity: 0,
                      filter: "blur(1.5px)",
                      transition: {
                        duration: 0.18,
                        ease: [0.4, 0, 1, 1],
                      },
                    }
              }
              className={cn("layout-text-flip-value", emphasisClassName)}
            >
              {visibleWord}
            </motion.span>
          </AnimatePresence>
        </motion.span>

        {visibleParticle ? (
          <span className="layout-text-flip-particle">
            <AnimatePresence initial={false} mode="sync">
              <motion.span
                key={visibleParticle}
                initial={
                  prefersReducedMotion
                    ? false
                    : { y: "-0.12em", opacity: 0, filter: "blur(1.5px)" }
                }
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { y: "0.12em", opacity: 0, filter: "blur(1.5px)" }
                }
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="layout-text-flip-particle-value"
              >
                {visibleParticle}
              </motion.span>
            </AnimatePresence>
          </span>
        ) : null}
      </span>
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}
