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

type FloatingPanelPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom" | "center";
};

type FloatingPanelPositioning = "anchored" | "viewport-center";

type FloatingPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorElement: HTMLElement | null;
  returnFocusRef: RefObject<HTMLElement | null>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  title: string;
  description?: string;
  closeLabel?: string;
  dismissible?: boolean;
  children: ReactNode;
  id?: string;
  layoutId?: string;
  className?: string;
  positioning?: FloatingPanelPositioning;
  preferredWidth?: number;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function positionsMatch(
  previous: FloatingPanelPosition | null,
  next: FloatingPanelPosition,
) {
  return (
    previous?.left === next.left &&
    previous.top === next.top &&
    previous.width === next.width &&
    previous.maxHeight === next.maxHeight &&
    previous.placement === next.placement
  );
}

export function FloatingPanel({
  open,
  onOpenChange,
  anchorElement,
  returnFocusRef,
  fallbackFocusRef,
  initialFocusRef,
  title,
  description,
  closeLabel = "패널 닫기",
  dismissible = true,
  children,
  id: idOverride,
  layoutId,
  className,
  positioning = "anchored",
  preferredWidth = 440,
}: FloatingPanelProps) {
  const generatedId = useId();
  const panelId = idOverride ?? `floating-panel-${generatedId}`;
  const titleId = `${panelId}-title`;
  const descriptionId = `${panelId}-description`;
  const contentRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const dismissibleRef = useRef(dismissible);
  const shouldReduceMotion = useReducedMotion();
  const restoreModalStateRef = useRef<(() => void) | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState<FloatingPanelPosition | null>(null);

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
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const visualViewport = window.visualViewport;
      const viewportWidth = visualViewport?.width ?? window.innerWidth;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const viewportLeft = visualViewport?.offsetLeft ?? 0;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const rootStyles = window.getComputedStyle(document.documentElement);
      const safeTop =
        Number.parseFloat(rootStyles.getPropertyValue("--safe-area-top")) || 0;
      const safeRight =
        Number.parseFloat(rootStyles.getPropertyValue("--safe-area-right")) || 0;
      const safeBottom =
        Number.parseFloat(rootStyles.getPropertyValue("--safe-area-bottom")) || 0;
      const safeLeft =
        Number.parseFloat(rootStyles.getPropertyValue("--safe-area-left")) || 0;
      const baseMargin = viewportWidth <= 640 ? 14 : 18;
      const topInset = Math.max(baseMargin, safeTop);
      const rightInset = Math.max(baseMargin, safeRight);
      const bottomInset = Math.max(baseMargin, safeBottom);
      const leftInset = Math.max(baseMargin, safeLeft);
      const width = Math.min(
        preferredWidth,
        Math.max(0, viewportWidth - leftInset - rightInset),
      );
      const maxHeight = Math.max(
        0,
        viewportHeight - topInset - bottomInset,
      );
      const measuredHeight = Math.min(
        contentRef.current?.scrollHeight ?? 520,
        maxHeight,
      );
      const anchorRect =
        positioning === "anchored" && anchorElement?.isConnected === true
          ? anchorElement.getBoundingClientRect()
          : null;

      let nextPosition: FloatingPanelPosition;

      if (positioning === "viewport-center") {
        const panelHeight = Math.min(measuredHeight, maxHeight);

        nextPosition = {
          left:
            viewportLeft +
            leftInset +
            Math.max(0, viewportWidth - leftInset - rightInset - width) / 2,
          top:
            viewportTop +
            topInset +
            Math.max(0, maxHeight - panelHeight) / 2,
          width,
          maxHeight,
          placement: "center",
        };
      } else if (viewportWidth <= 640 || !anchorRect) {
        nextPosition = {
          left: viewportLeft + leftInset,
          top:
            viewportTop +
            Math.max(topInset, viewportHeight - measuredHeight - bottomInset),
          width,
          maxHeight,
          placement: "bottom",
        };
      } else {
        const gap = 10;
        const availableBelow =
          viewportTop +
          viewportHeight -
          anchorRect.bottom -
          bottomInset -
          gap;
        const availableAbove =
          anchorRect.top - viewportTop - topInset - gap;
        const shouldOpenAbove =
          availableBelow < Math.min(measuredHeight, 360) &&
          availableAbove > availableBelow;
        const availableHeight = Math.max(
          0,
          shouldOpenAbove ? availableAbove : availableBelow,
        );
        const panelHeight = Math.min(measuredHeight, availableHeight);
        const shouldUseViewportFallback =
          Math.max(availableAbove, availableBelow) <
          Math.min(measuredHeight, 260);

        if (shouldUseViewportFallback) {
          nextPosition = {
            left: clamp(
              anchorRect.left,
              viewportLeft + leftInset,
              viewportLeft + viewportWidth - width - rightInset,
            ),
            top: viewportTop + topInset,
            width,
            maxHeight,
            placement: shouldOpenAbove ? "top" : "bottom",
          };
        } else {
          nextPosition = {
            left: clamp(
              anchorRect.left,
              viewportLeft + leftInset,
              viewportLeft + viewportWidth - width - rightInset,
            ),
            top: shouldOpenAbove
              ? Math.max(
                  viewportTop + topInset,
                  anchorRect.top - panelHeight - gap,
                )
              : Math.min(
                  anchorRect.bottom + gap,
                  viewportTop + viewportHeight - panelHeight - bottomInset,
                ),
            width,
            maxHeight: availableHeight,
            placement: shouldOpenAbove ? "top" : "bottom",
          };
        }
      }

      setPosition((previous) =>
        positionsMatch(previous, nextPosition) ? previous : nextPosition,
      );
    };

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    const resizeObserver = new ResizeObserver(updatePosition);

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [anchorElement, open, positioning, preferredWidth]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const content = contentRef.current;
    const returnFocusTarget = returnFocusRef.current;
    const fallbackFocusTarget = fallbackFocusRef?.current;
    const shell = document.querySelector<HTMLElement>(
      ".app-shell, .auth-shell, .cover-main",
    );
    const previousBodyOverflow = document.body.style.overflow;
    const previousAriaHidden = shell?.getAttribute("aria-hidden") ?? null;
    const previouslyInert = shell?.hasAttribute("inert") ?? false;

    document.body.style.overflow = "hidden";
    shell?.setAttribute("inert", "");
    shell?.setAttribute("aria-hidden", "true");

    let hasRestoredModalState = false;
    const restoreModalState = () => {
      if (hasRestoredModalState) {
        return;
      }

      hasRestoredModalState = true;
      document.body.style.overflow = previousBodyOverflow;

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

      const returnTarget = returnFocusTarget?.isConnected
        ? returnFocusTarget
        : fallbackFocusTarget;
      window.requestAnimationFrame(() => returnTarget?.focus());

      if (restoreModalStateRef.current === restoreModalState) {
        restoreModalStateRef.current = null;
      }
    };
    restoreModalStateRef.current = restoreModalState;

    const focusFrame = window.requestAnimationFrame(() => {
      const preferredTarget = initialFocusRef?.current;
      const fallbackTarget = content?.querySelector<HTMLElement>(
        FOCUSABLE_SELECTOR,
      );

      (preferredTarget ?? fallbackTarget ?? content)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();

        if (dismissibleRef.current) {
          onOpenChangeRef.current(false);
        }

        return;
      }

      if (event.key !== "Tab" || !content) {
        return;
      }

      const focusableElements = Array.from(
        content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (focusableElements.length === 0) {
        event.preventDefault();
        content.focus();
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
      } else if (!content.contains(activeElement)) {
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
      }, 1000);
    };
  }, [
    fallbackFocusRef,
    initialFocusRef,
    open,
    returnFocusRef,
  ]);

  if (!isMounted) {
    return null;
  }

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, bounce: 0.08, duration: 0.28 };

  return createPortal(
    <MotionConfig reducedMotion="user" transition={transition}>
      <AnimatePresence
        onExitComplete={() => restoreModalStateRef.current?.()}
      >
        {open ? (
          <div className="floating-panel-layer">
            <motion.div
              className="floating-panel-backdrop"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (dismissibleRef.current) {
                  onOpenChangeRef.current(false);
                }
              }}
            />
            <motion.div
              ref={contentRef}
              id={panelId}
              className={cn("floating-panel-content", className)}
              data-placement={position?.placement}
              data-compact-height={
                position && position.maxHeight <= 252 ? "true" : undefined
              }
              layoutId={layoutId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              style={
                position
                  ? {
                      left: position.left,
                      top: position.top,
                      width: position.width,
                      maxHeight: position.maxHeight,
                      transformOrigin:
                        position.placement === "center"
                          ? "center center"
                          : position.placement === "top"
                          ? "bottom left"
                          : "top left",
                    }
                  : undefined
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 0.97, y: 6 }
              }
              animate={{ opacity: position ? 1 : 0, scale: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.98, y: 4 }
              }
            >
              <div className="floating-panel-header">
                <div>
                  <h2 id={titleId}>{title}</h2>
                  {description ? (
                    <p id={descriptionId}>{description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="floating-panel-close"
                  onClick={() => onOpenChangeRef.current(false)}
                  aria-label={closeLabel}
                  disabled={!dismissible}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className="floating-panel-body">{children}</div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}
