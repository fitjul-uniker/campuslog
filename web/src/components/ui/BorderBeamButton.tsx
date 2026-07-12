"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BorderBeamButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  wrapperClassName?: string;
  active?: boolean;
};

export function BorderBeamButton({
  children,
  className,
  wrapperClassName,
  active = true,
  disabled,
  ...buttonProps
}: BorderBeamButtonProps) {
  return (
    <span
      className={cn("border-beam-control", wrapperClassName)}
      data-active={active && !disabled ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
    >
      <button
        {...buttonProps}
        className={cn("border-beam-button", className)}
        disabled={disabled}
      >
        {children}
      </button>
    </span>
  );
}
