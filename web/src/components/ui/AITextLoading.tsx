"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type AITextLoadingProps = {
  texts?: string[];
  className?: string;
  interval?: number;
};

export function AITextLoading({
  texts = [
    "Thinking...",
    "Processing...",
    "Analyzing...",
    "Computing...",
    "Almost...",
  ],
  className,
  interval = 1_500,
}: AITextLoadingProps) {
  const shouldReduceMotion = useReducedMotion();
  const normalizedTexts = useMemo(
    () => (texts.length > 0 ? texts : ["요청을 처리하고 있어요."]),
    [texts],
  );
  const textsKey = normalizedTexts.join("\u0000");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    setCurrentTextIndex(0);
  }, [textsKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTextIndex(
        (previousIndex) => (previousIndex + 1) % normalizedTexts.length,
      );
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, normalizedTexts.length]);

  const currentText =
    normalizedTexts[currentTextIndex % normalizedTexts.length];

  return (
    <div className="flex w-full items-center justify-center p-8">
      <motion.div
        animate={{ opacity: 1 }}
        className="relative w-full px-4 py-2"
        initial={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: shouldReduceMotion
                ? "0% center"
                : ["200% center", "-200% center"],
            }}
            className={cn(
              "flex min-w-0 justify-center whitespace-normal bg-[length:200%_100%] bg-gradient-to-r from-neutral-950 via-neutral-400 to-neutral-950 bg-clip-text text-center text-3xl font-bold text-transparent dark:from-white dark:via-neutral-600 dark:to-white",
              className,
            )}
            exit={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : -20,
            }}
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 20,
            }}
            key={`${textsKey}-${currentTextIndex}`}
            transition={{
              opacity: { duration: shouldReduceMotion ? 0.01 : 0.3 },
              y: { duration: shouldReduceMotion ? 0.01 : 0.3 },
              backgroundPosition: {
                duration: shouldReduceMotion ? 0 : 2.5,
                ease: "linear",
                repeat: shouldReduceMotion ? 0 : Number.POSITIVE_INFINITY,
              },
            }}
          >
            {currentText}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
