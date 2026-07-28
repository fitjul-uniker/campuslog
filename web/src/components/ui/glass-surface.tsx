import { createElement, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import styles from "./glass-surface.module.css";

export type GlassVariant =
  | "regular"
  | "prominent"
  | "clear"
  | "frosted"
  | "content"
  | "solidFallback";

export type GlassShape = "rounded" | "capsule" | "circle";
export type GlassElevation = "bar" | "popover" | "modal";

type GlassTag = "div" | "aside" | "header" | "nav" | "section";

export type GlassSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: GlassTag;
  variant?: GlassVariant;
  shape?: GlassShape;
  elevation?: GlassElevation;
  interactive?: boolean;
};

export function GlassSurface({
  as = "div",
  variant = "regular",
  shape = "rounded",
  elevation = "bar",
  interactive = false,
  className,
  ...props
}: GlassSurfaceProps) {
  return createElement(as, {
    ...props,
    className: cn(styles.surface, className),
    "data-glass-variant": variant,
    "data-glass-shape": shape,
    "data-glass-elevation": elevation,
    "data-glass-interactive": interactive ? "true" : "false",
  });
}

export function GlassGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.group, className)} {...props} />;
}
