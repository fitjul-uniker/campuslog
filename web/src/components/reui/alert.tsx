import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "warning";
};

export function Alert({
  className,
  variant = "default",
  ...props
}: AlertProps) {
  return (
    <div
      className={cn("reui-alert", className)}
      data-variant={variant}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("reui-alert-title", className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("reui-alert-description", className)} {...props} />;
}
