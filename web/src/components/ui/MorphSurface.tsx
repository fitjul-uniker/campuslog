"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type MorphSurfaceProps = {
  surfaceId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLabel: string;
  triggerMeta?: string;
  statusLabel: string;
  isComplete?: boolean;
  triggerIcon?: ReactNode;
  focusTargetId?: string;
  children: ReactNode;
  className?: string;
};

export function MorphSurface({
  surfaceId,
  isOpen,
  onOpenChange,
  triggerLabel,
  triggerMeta,
  statusLabel,
  isComplete = false,
  triggerIcon,
  focusTargetId,
  children,
  className,
}: MorphSurfaceProps): ReactElement {
  const generatedId = useId();
  const contentId = `${surfaceId || generatedId}-content`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (focusTargetId) {
        document
          .getElementById(focusTargetId)
          ?.focus({ preventScroll: true });
      }
    });

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChangeRef.current(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [focusTargetId, isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
      window.requestAnimationFrame(() => {
        if (triggerRef.current?.isConnected) {
          triggerRef.current.focus({ preventScroll: true });
        }
      });
    }
  }

  const spring = shouldReduceMotion
    ? { duration: 0.01 }
    : {
        type: "spring" as const,
        stiffness: 550,
        damping: 45,
        mass: 0.7,
      };
  const surfaceTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : {
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1] as const,
      };
  const revealTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : {
        height: {
          duration: isOpen ? 0.26 : 0.18,
          delay: isOpen ? 0.06 : 0,
          ease: [0.22, 1, 0.36, 1] as const,
        },
        opacity: {
          duration: isOpen ? 0.18 : 0.12,
          delay: isOpen ? 0.06 : 0,
          ease: "easeOut" as const,
        },
      };

  return (
    <motion.div
      ref={rootRef}
      animate={{ borderRadius: isOpen ? 24 : 18 }}
      className={cn("morph-surface", className)}
      data-open={isOpen ? "true" : "false"}
      data-reduced-motion={shouldReduceMotion ? "true" : "false"}
      onKeyDown={handleKeyDown}
      style={{ transformOrigin: "50% 100%" }}
      transition={surfaceTransition}
    >
      <button
        ref={triggerRef}
        type="button"
        className="morph-surface-trigger"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => onOpenChange(!isOpen)}
      >
        <motion.span
          className="morph-surface-indicator"
          data-complete={isComplete ? "true" : "false"}
          layoutId={`morph-surface-indicator-${surfaceId}`}
          transition={spring}
        >
          {triggerIcon}
        </motion.span>
        <span className="morph-surface-trigger-copy">
          {triggerMeta ? <small>{triggerMeta}</small> : null}
          <strong title={triggerLabel}>{triggerLabel}</strong>
        </span>
        <span className="morph-surface-status">{statusLabel}</span>
        <ChevronDown
          className="morph-surface-chevron"
          data-open={isOpen ? "true" : "false"}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={contentId}
            className="morph-surface-reveal"
            initial={
              shouldReduceMotion
                ? false
                : { height: 0, opacity: 0 }
            }
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={revealTransition}
          >
            <motion.div
              className="morph-surface-content"
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 12 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 6 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.01 }
                  : {
                      duration: isOpen ? 0.22 : 0.14,
                      delay: isOpen ? 0.06 : 0,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
