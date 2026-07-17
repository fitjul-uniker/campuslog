"use client";

import type { ReactNode } from "react";

import {
  RippleButton,
  RippleButtonRipples,
  type RippleButtonProps,
} from "@/components/animate-ui/components/buttons/ripple";

import { cn } from "@/lib/utils";

type BorderBeamButtonProps = RippleButtonProps & {
  children: ReactNode;
  wrapperClassName?: string;
  active?: boolean;
  colorVariant?: "colorful" | "mono";
};

export function BorderBeamButton({
  children,
  className,
  wrapperClassName,
  active = true,
  colorVariant = "mono",
  disabled,
  ...buttonProps
}: BorderBeamButtonProps) {
  return (
    <span
      className={cn("border-beam-control", wrapperClassName)}
      data-active={active && !disabled ? "true" : "false"}
      data-color-variant={colorVariant}
      data-disabled={disabled ? "true" : "false"}
    >
      <RippleButton
        {...buttonProps}
        className={cn("border-beam-button", className)}
        disabled={disabled}
      >
        {children}
        <RippleButtonRipples />
      </RippleButton>
    </span>
  );
}
