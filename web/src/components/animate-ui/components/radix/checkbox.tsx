"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type CheckedState = boolean | "indeterminate";

const checkboxVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center justify-center outline-none transition-[color,background-color,border-color,transform] duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-reduce:transition-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
  {
    variants: {
      variant: {
        default: "border border-border bg-background",
        accent: "bg-input",
      },
      size: {
        sm: "size-4.5 rounded-[5px]",
        default: "size-5 rounded-sm",
        lg: "size-6 rounded-[7px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const checkboxIconVariants = cva("pointer-events-none", {
  variants: {
    size: {
      sm: "size-3",
      default: "size-3.5",
      lg: "size-4",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  "asChild"
> &
  VariantProps<typeof checkboxVariants>;

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      variant,
      size,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const [internalChecked, setInternalChecked] = React.useState<CheckedState>(
      defaultChecked ?? false,
    );
    const resolvedChecked = checked ?? internalChecked;
    const isMarked = resolvedChecked !== false;

    function handleCheckedChange(nextChecked: CheckedState) {
      if (checked === undefined) {
        setInternalChecked(nextChecked);
      }

      onCheckedChange?.(nextChecked);
    }

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={resolvedChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        className={cn(checkboxVariants({ variant, size }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator forceMount asChild>
          <motion.svg
            aria-hidden="true"
            className={checkboxIconVariants({ size })}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3.5"
            stroke="currentColor"
            initial={false}
            animate={isMarked ? "checked" : "unchecked"}
          >
            {resolvedChecked === "indeterminate" ? (
              <motion.line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                strokeLinecap="round"
                initial={
                  shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }
                }
                animate={{
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: shouldReduceMotion ? 0 : 0.2 },
                }}
              />
            ) : (
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
                variants={{
                  checked: {
                    pathLength: 1,
                    opacity: 1,
                    transition: {
                      duration: shouldReduceMotion ? 0 : 0.2,
                      delay: shouldReduceMotion ? 0 : 0.2,
                    },
                  },
                  unchecked: {
                    pathLength: 0,
                    opacity: 0,
                    transition: { duration: shouldReduceMotion ? 0 : 0.2 },
                  },
                }}
              />
            )}
          </motion.svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  },
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName;
