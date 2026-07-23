"use client";

import {
  cloneElement,
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type ReactElement,
  type SVGProps,
} from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type AnimatedGradientActionButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: ReactElement<SVGProps<SVGSVGElement>>;
  };

export const AnimatedGradientActionButton = forwardRef<
  HTMLButtonElement,
  AnimatedGradientActionButtonProps
>(function AnimatedGradientActionButton(
  { children, className, icon, type = "button", ...buttonProps },
  forwardedRef,
) {
  const iconGradientId = `ai-action-icon-${useId().replaceAll(":", "")}`;

  return (
    <button
      {...buttonProps}
      ref={forwardedRef}
      type={type}
      className={cn("animated-gradient-action-button", className)}
    >
      <span
        className="animated-gradient-action-border"
        aria-hidden="true"
      />
      <svg
        className="animated-gradient-action-icon-definition"
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={iconGradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              className="animated-gradient-action-icon-stop-start"
              offset="0%"
            />
            <stop
              className="animated-gradient-action-icon-stop-end"
              offset="100%"
            />
          </linearGradient>
        </defs>
      </svg>
      <span className="animated-gradient-action-icon" aria-hidden="true">
        {cloneElement(icon, {
          stroke: `url(#${iconGradientId})`,
        })}
      </span>
      <span className="animated-gradient-action-text">{children}</span>
      <ChevronRight
        className="animated-gradient-action-chevron"
        stroke={`url(#${iconGradientId})`}
        aria-hidden="true"
      />
    </button>
  );
});

AnimatedGradientActionButton.displayName = "AnimatedGradientActionButton";
