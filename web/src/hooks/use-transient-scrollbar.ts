"use client";

import {
  type UIEventHandler,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { createTransientScrollbarController } from "@/hooks/transient-scrollbar-controller";

export function useTransientScrollbar<
  T extends HTMLElement,
>(): UIEventHandler<T> {
  const controllerRef = useRef<ReturnType<
    typeof createTransientScrollbarController
  > | null>(null);

  const handleScroll = useCallback<UIEventHandler<T>>((event) => {
    if (!controllerRef.current) {
      controllerRef.current = createTransientScrollbarController({
        setTimer: (callback, delay) => window.setTimeout(callback, delay),
        clearTimer: (timerId) => window.clearTimeout(timerId),
      });
    }

    controllerRef.current.handleScroll(event.currentTarget);
  }, []);

  useEffect(
    () => () => {
      controllerRef.current?.cleanup();
    },
    [],
  );

  return handleScroll;
}

export function usePageTransientScrollbar(): void {
  useEffect(() => {
    const controller = createTransientScrollbarController({
      setTimer: (callback, delay) => window.setTimeout(callback, delay),
      clearTimer: (timerId) => window.clearTimeout(timerId),
    });
    const target = document.documentElement;
    const handleScroll = () => controller.handleScroll(target);

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      controller.cleanup();
    };
  }, []);
}
