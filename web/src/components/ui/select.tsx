"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ children, className, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn("select-trigger", className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon className="select-trigger-icon">
      <ChevronDown aria-hidden="true" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Value
    ref={ref}
    className={cn("select-value", className)}
    {...props}
  />
));
SelectValue.displayName = "SelectValue";

type SelectContentProps = ComponentPropsWithoutRef<
  typeof SelectPrimitive.Popup
> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export function SelectContent({
  align = "start",
  children,
  className,
  sideOffset = 4,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={false}
        className="select-positioner"
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className={cn("select-popup", className)}
          {...props}
        >
          <SelectPrimitive.List className="select-list">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

export const SelectItem = forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ children, className, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn("select-item", className)}
    {...props}
  >
    <SelectPrimitive.ItemText className="select-item-text">
      {children}
    </SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="select-item-indicator">
      <Check aria-hidden="true" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
