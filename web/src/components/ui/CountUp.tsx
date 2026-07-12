"use client";

import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

type CountUpProps = {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
};

function getDecimalPlaces(value: number): number {
  const [, decimals = ""] = value.toString().split(".");
  return Number.parseInt(decimals, 10) === 0 ? 0 : decimals.length;
}

export function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 0.8,
  className = "",
  startWhen = true,
  separator = ",",
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const initialValue = direction === "down" ? to : from;
  const targetValue = direction === "down" ? from : to;
  const motionValue = useMotionValue(initialValue);
  const safeDuration = Math.max(duration, 0.1);
  const springValue = useSpring(motionValue, {
    damping: 20 + 40 * (1 / safeDuration),
    stiffness: 100 * (1 / safeDuration),
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });
  const maxDecimals = useMemo(
    () => Math.max(getDecimalPlaces(from), getDecimalPlaces(to)),
    [from, to],
  );

  const formatValue = useCallback(
    (latest: number) => {
      const formattedNumber = Intl.NumberFormat("ko-KR", {
        useGrouping: Boolean(separator),
        minimumFractionDigits: maxDecimals,
        maximumFractionDigits: maxDecimals,
      }).format(latest);

      return separator
        ? formattedNumber.replace(/,/g, separator)
        : formattedNumber.replace(/,/g, "");
    },
    [maxDecimals, separator],
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(initialValue);
    }
  }, [formatValue, initialValue]);

  useEffect(() => {
    if (!isInView || !startWhen) {
      return;
    }

    if (shouldReduceMotion) {
      motionValue.jump(targetValue);
      if (ref.current) {
        ref.current.textContent = formatValue(targetValue);
      }
      return;
    }

    onStart?.();
    const startTimer = window.setTimeout(() => {
      motionValue.set(targetValue);
    }, delay * 1000);
    const endTimer = window.setTimeout(
      () => onEnd?.(),
      delay * 1000 + safeDuration * 1000,
    );

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
    };
  }, [
    delay,
    formatValue,
    isInView,
    motionValue,
    onEnd,
    onStart,
    safeDuration,
    shouldReduceMotion,
    startWhen,
    targetValue,
  ]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
  }, [formatValue, springValue]);

  return <span className={className} ref={ref} aria-hidden="true" />;
}
