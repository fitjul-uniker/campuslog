"use client";

import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import styles from "./expandable-screen.module.css";

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
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (!open) {
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
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    const previousAriaHidden = shell?.getAttribute("aria-hidden") ?? null;
    const previouslyInert = shell?.hasAttribute("inert") ?? false;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    shell?.setAttribute("inert", "");
    shell?.setAttribute("aria-hidden", "true");

    let hasRestored = false;
    const restoreModalState = () => {
      if (hasRestored) {
        return;
      }

      hasRestored = true;
      document.body.style.overflow = previousBodyOverflow;
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
  }, [initialFocusRef, open, returnFocusRef]);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={() => restoreModalStateRef.current?.()}>
        {open ? (
          <div className={styles.layer}>
            <motion.div
              className={styles.backdrop}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.16, ease: "easeOut" },
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.22, ease: "easeOut" }
              }
            />
            <div className={styles.dialogFrame}>
              <motion.div
                ref={dialogRef}
                className={cn(styles.dialog, className)}
                data-has-anchor={anchorElement?.isConnected ? "true" : undefined}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, scale: 0.965, y: 10 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: shouldReduceMotion ? 1 : 0.98,
                  y: shouldReduceMotion ? 0 : 5,
                  transition: shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.13, ease: "easeIn" },
                }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
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
          </div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
