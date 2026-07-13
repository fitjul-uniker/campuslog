"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

type CheckedState = boolean | "indeterminate";

const checkboxVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center justify-center border bg-white text-white shadow-sm transition-[border-color,background-color,box-shadow] outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
  {
    variants: {
      variant: {
        default: "border-border hover:border-primary/55",
        accent:
          "border-primary/35 hover:border-primary/65 data-[state=checked]:border-primary data-[state=indeterminate]:border-primary",
      },
      size: {
        sm: "size-4 rounded-[5px]",
        default: "size-5 rounded-md",
        lg: "size-6 rounded-[7px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const checkboxIconVariants = cva(
  "pointer-events-none flex items-center justify-center",
  {
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
  },
);

export type CheckboxProps = React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
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
        className={cn(checkboxVariants({ variant, size }), className)}
        {...props}
      >
        <CheckboxPrimitive.Indicator forceMount asChild>
          <motion.span
            aria-hidden="true"
            className={checkboxIconVariants({ size })}
            initial={false}
            animate={
              isMarked
                ? { opacity: 1, scale: 1, rotate: 0 }
                : { opacity: 0, scale: 0.55, rotate: -8 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 520, damping: 32, mass: 0.45 }
            }
          >
            {resolvedChecked === "indeterminate" ? (
              <Minus className="size-full" strokeWidth={2.6} />
            ) : (
              <Check className="size-full" strokeWidth={2.6} />
            )}
          </motion.span>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  },
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName;
