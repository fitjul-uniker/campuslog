import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export const Field = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("field", className)} {...props} />
));
Field.displayName = "Field";
