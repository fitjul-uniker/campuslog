"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("accordion-item", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ children, className, ...props }, ref) => (
  <AccordionPrimitive.Header className="accordion-header">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn("accordion-trigger", className)}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Panel>
>(({ children, className, ...props }, ref) => (
  <AccordionPrimitive.Panel
    ref={ref}
    className={cn("accordion-content", className)}
    {...props}
  >
    <div className="accordion-content-inner">{children}</div>
  </AccordionPrimitive.Panel>
));
AccordionContent.displayName = "AccordionContent";
