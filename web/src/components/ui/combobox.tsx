"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";

import { cn } from "@/lib/utils";

export const Combobox = ComboboxPrimitive.Root;

export const ComboboxInput = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<typeof ComboboxPrimitive.Input>
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.InputGroup className="combobox-input-group">
    <ComboboxPrimitive.Input
      ref={ref}
      className={cn("combobox-input", className)}
      {...props}
    />
    <ComboboxPrimitive.Trigger
      className="combobox-trigger"
      aria-label="활동 목록 열기"
    >
      <ChevronDown aria-hidden="true" />
    </ComboboxPrimitive.Trigger>
  </ComboboxPrimitive.InputGroup>
));
ComboboxInput.displayName = "ComboboxInput";

type ComboboxContentProps = ComponentPropsWithoutRef<
  typeof ComboboxPrimitive.Popup
> & {
  sideOffset?: number;
};

export function ComboboxContent({
  children,
  className,
  sideOffset = 4,
  ...props
}: ComboboxContentProps) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        className="combobox-positioner"
        sideOffset={sideOffset}
        align="start"
      >
        <ComboboxPrimitive.Popup
          className={cn("combobox-popup", className)}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

export const ComboboxEmpty = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ComboboxPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Empty
    ref={ref}
    className={cn("combobox-empty", className)}
    {...props}
  />
));
ComboboxEmpty.displayName = "ComboboxEmpty";

export const ComboboxList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ComboboxPrimitive.List>
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.List
    ref={ref}
    className={cn("combobox-list", className)}
    {...props}
  />
));
ComboboxList.displayName = "ComboboxList";

export const ComboboxItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ComboboxPrimitive.Item>
>(({ children, className, ...props }, ref) => (
  <ComboboxPrimitive.Item
    ref={ref}
    className={cn("combobox-item", className)}
    {...props}
  >
    <span className="combobox-item-label">{children}</span>
    <ComboboxPrimitive.ItemIndicator className="combobox-item-indicator">
      <Check aria-hidden="true" />
    </ComboboxPrimitive.ItemIndicator>
  </ComboboxPrimitive.Item>
));
ComboboxItem.displayName = "ComboboxItem";
