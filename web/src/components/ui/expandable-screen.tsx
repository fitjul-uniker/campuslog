"use client";

import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import styles from "./expandable-screen.module.css";

type OriginGeometry = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  borderRadius: number;
  backgroundColor: string;
};

const EXPANDED_SCREEN_INSET = 8;
const EXPANDED_SCREEN_RADIUS = 28;
const EXPANDED_SCREEN_COLOR = "#f8f7f3";
const TRIGGER_SCREEN_COLOR = "#242321";

type ExpandableScreenProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorElement: HTMLElement | null;
  returnFocusRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  title: string;
  description?: string;
  closeLabel?: string;
  dismissible?: boolean;
  children: ReactNode;
  className?: string;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getOriginGeometry(anchorElement: HTMLElement | null): OriginGeometry {
  const targetWidth = Math.max(
    window.innerWidth - EXPANDED_SCREEN_INSET * 2,
    1,
  );
  const targetHeight = Math.max(
    window.innerHeight - EXPANDED_SCREEN_INSET * 2,
    1,
  );

  if (!anchorElement?.isConnected) {
    return {
      x: targetWidth / 2,
      y: targetHeight / 2,
      scaleX: 0.04,
      scaleY: 0.04,
      borderRadius: 18,
      backgroundColor: TRIGGER_SCREEN_COLOR,
    };
  }

  const rect = anchorElement.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(anchorElement);
  const computedRadius = Number.parseFloat(computedStyle.borderRadius);
  const computedBackgroundColor = computedStyle.backgroundColor;
  const backgroundColor =
    computedBackgroundColor === "transparent" ||
    computedBackgroundColor === "rgba(0, 0, 0, 0)"
      ? EXPANDED_SCREEN_COLOR
      : computedBackgroundColor;

  return {
    x: rect.left - EXPANDED_SCREEN_INSET,
    y: rect.top - EXPANDED_SCREEN_INSET,
    scaleX: Math.max(rect.width / targetWidth, 0.01),
    scaleY: Math.max(rect.height / targetHeight, 0.01),
    borderRadius: Number.isFinite(computedRadius) ? computedRadius : 16,
    backgroundColor,
  };
}

export function ExpandableScreen({
  open,
  onOpenChange,
  anchorElement,
  returnFocusRef,
  initialFocusRef,
  title,
  description,
  closeLabel = "전체 화면 닫기",
  dismissible = true,
  children,
  className,
}: ExpandableScreenProps) {
  const generatedId = useId().replaceAll(":", "");
  const titleId = `expandable-screen-title-${generatedId}`;
  const descriptionId = `expandable-screen-description-${generatedId}`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const dismissibleRef = useRef(dismissible);
  const restoreModalStateRef = useRef<(() => void) | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [origin, setOrigin] = useState<OriginGeometry | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const hasOrigin = origin !== null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const updateOrigin = () => setOrigin(getOriginGeometry(anchorElement));

    updateOrigin();
    window.addEventListener("resize", updateOrigin);
    window.visualViewport?.addEventListener("resize", updateOrigin);

    return () => {
      window.removeEventListener("resize", updateOrigin);
      window.visualViewport?.removeEventListener("resize", updateOrigin);
    };
  }, [anchorElement, open]);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    dismissibleRef.current = dismissible;
  }, [dismissible]);

  useEffect(() => {
    const restoreRef = restoreModalStateRef;

    return () => restoreRef.current?.();
  }, []);

  useEffect(() => {
    if (!open || !hasOrigin) {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const returnFocusTarget = returnFocusRef.current;
    const shell = document.querySelector<HTMLElement>(
      ".app-shell, .auth-shell, .cover-main",
    );
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    const previousAriaHidden = shell?.getAttribute("aria-hidden") ?? null;
    const previouslyInert = shell?.hasAttribute("inert") ?? false;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    shell?.setAttribute("inert", "");
    shell?.setAttribute("aria-hidden", "true");

    let hasRestored = false;
    const restoreModalState = () => {
      if (hasRestored) {
        return;
      }

      hasRestored = true;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;

      if (shell) {
        if (!previouslyInert) {
          shell.removeAttribute("inert");
        }

        if (previousAriaHidden === null) {
          shell.removeAttribute("aria-hidden");
        } else {
          shell.setAttribute("aria-hidden", previousAriaHidden);
        }
      }

      window.requestAnimationFrame(() => {
        if (returnFocusTarget?.isConnected) {
          returnFocusTarget.focus();
        }
      });

      if (restoreModalStateRef.current === restoreModalState) {
        restoreModalStateRef.current = null;
      }
    };
    restoreModalStateRef.current = restoreModalState;

    const focusFrame = window.requestAnimationFrame(() => {
      const preferredTarget = initialFocusRef?.current;
      const fallbackTarget = dialog.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR,
      );

      (preferredTarget ?? fallbackTarget ?? dialog)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (dismissibleRef.current) {
          onOpenChangeRef.current(false);
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (!dialog.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      window.setTimeout(() => {
        if (restoreModalStateRef.current === restoreModalState) {
          restoreModalState();
        }
      }, 600);
    };
  }, [hasOrigin, initialFocusRef, open, returnFocusRef]);

  if (!isMounted) {
    return null;
  }

  const resolvedOrigin = origin ?? {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    borderRadius: 0,
    backgroundColor: EXPANDED_SCREEN_COLOR,
  };
  const surfaceInitial = shouldReduceMotion
    ? { opacity: 0, backgroundColor: EXPANDED_SCREEN_COLOR }
    : {
        x: resolvedOrigin.x,
        y: resolvedOrigin.y,
        scaleX: resolvedOrigin.scaleX,
        scaleY: resolvedOrigin.scaleY,
        borderRadius: resolvedOrigin.borderRadius,
        backgroundColor: resolvedOrigin.backgroundColor,
        opacity: 1,
      };
  const surfaceExit = shouldReduceMotion
    ? { opacity: 0, backgroundColor: EXPANDED_SCREEN_COLOR }
    : {
        x: resolvedOrigin.x,
        y: resolvedOrigin.y,
        scaleX: resolvedOrigin.scaleX,
        scaleY: resolvedOrigin.scaleY,
        borderRadius: resolvedOrigin.borderRadius,
        backgroundColor: resolvedOrigin.backgroundColor,
        opacity: 1,
      };

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={() => restoreModalStateRef.current?.()}>
        {open && origin ? (
          <div className={styles.layer}>
            <motion.div
              className={styles.backdrop}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.22, ease: "easeOut" }
              }
            />
            <motion.div
              className={styles.surface}
              aria-hidden="true"
              initial={surfaceInitial}
              animate={{
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                borderRadius: EXPANDED_SCREEN_RADIUS,
                backgroundColor: EXPANDED_SCREEN_COLOR,
                opacity: 1,
              }}
              exit={surfaceExit}
              style={{ transformOrigin: "0 0" }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.36, ease: [0.22, 1, 0.36, 1] }
              }
            />

            <motion.div
              ref={dialogRef}
              className={cn(styles.dialog, className)}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              initial={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: shouldReduceMotion ? 0 : 4,
                transition: shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.1, ease: "easeIn" },
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.18, delay: 0.08, ease: "easeOut" }
              }
            >
              <h2 id={titleId} className="sr-only">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="sr-only">
                  {description}
                </p>
              ) : null}
              <button
                type="button"
                className={styles.close}
                aria-label={closeLabel}
                onClick={() => onOpenChangeRef.current(false)}
                disabled={!dismissible}
              >
                <X aria-hidden="true" />
              </button>
              <div className={styles.content}>{children}</div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
