"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";

import {
  RippleButton,
  RippleButtonRipples,
  type RippleButtonProps,
} from "@/components/animate-ui/components/buttons/ripple";
import { cn } from "@/lib/utils";

const copyButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-semibold outline-none transition-[color,background-color,border-color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-accent",
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        default: "h-9 px-3",
        lg: "h-10 px-4",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  },
);

export type CopyButtonProps = Omit<
  RippleButtonProps,
  "children" | "content"
> &
  VariantProps<typeof copyButtonVariants> & {
    content: string;
    copied?: boolean;
    onCopiedChange?: (copied: boolean) => void;
    onCopyError?: (error: Error) => void;
    delay?: number;
    label?: string;
    copiedLabel?: string;
  };

export function CopyButton({
  className,
  content,
  copied,
  onCopiedChange,
  onCopyError,
  delay = 3000,
  label = "복사",
  copiedLabel = "복사 완료",
  variant,
  size,
  type = "button",
  disabled,
  onClick,
  ...props
}: CopyButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const [internalCopied, setInternalCopied] = React.useState(false);
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled = copied !== undefined;
  const isCopied = copied ?? internalCopied;
  const isIconOnly = size === "icon";

  const setCopiedState = React.useCallback(
    (nextCopied: boolean) => {
      if (!isControlled) {
        setInternalCopied(nextCopied);
      }

      onCopiedChange?.(nextCopied);
    },
    [isControlled, onCopiedChange],
  );

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented || disabled) {
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is not available.");
      }

      await navigator.clipboard.writeText(content);
      setCopiedState(true);
      resetTimerRef.current = setTimeout(() => {
        setCopiedState(false);
        resetTimerRef.current = null;
      }, delay);
    } catch (error) {
      setCopiedState(false);
      onCopyError?.(
        error instanceof Error ? error : new Error("Clipboard copy failed."),
      );
    }
  }

  return (
    <RippleButton
      {...props}
      type={type}
      className={cn(copyButtonVariants({ variant, size }), className)}
      disabled={disabled}
      data-copied={isCopied ? "true" : "false"}
      aria-label={isCopied ? copiedLabel : label}
      onClick={handleClick}
      hoverScale={1.025}
      tapScale={0.975}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <span className="relative size-4 shrink-0" aria-hidden="true">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={isCopied ? "copied" : "copy"}
            className="absolute inset-0 flex items-center justify-center"
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.5, rotate: -18 }
            }
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.5, rotate: 18 }
            }
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          >
            {isCopied ? (
              <Check className="button-icon size-4" strokeWidth={2.4} />
            ) : (
              <Copy className="button-icon size-4" strokeWidth={2.2} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>

      {isIconOnly ? null : (
        <span className="grid" aria-hidden="true">
          <span
            className={cn(
              "col-start-1 row-start-1 transition-opacity",
              isCopied ? "opacity-0" : "opacity-100",
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-opacity",
              isCopied ? "opacity-100" : "opacity-0",
            )}
          >
            {copiedLabel}
          </span>
        </span>
      )}
      <RippleButtonRipples />
    </RippleButton>
  );
}
