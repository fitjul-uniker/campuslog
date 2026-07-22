import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export const Breadcrumb = forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<"nav">
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="현재 위치"
    className={cn("breadcrumb", className)}
    {...props}
  />
));
Breadcrumb.displayName = "Breadcrumb";

export const BreadcrumbList = forwardRef<
  HTMLOListElement,
  ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol ref={ref} className={cn("breadcrumb-list", className)} {...props} />
));
BreadcrumbList.displayName = "BreadcrumbList";

export const BreadcrumbItem = forwardRef<
  HTMLLIElement,
  ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("breadcrumb-item", className)} {...props} />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

export const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<typeof Link>
>(({ className, ...props }, ref) => (
  <Link ref={ref} className={cn("breadcrumb-link", className)} {...props} />
));
BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbPage = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-current="page"
    className={cn("breadcrumb-page", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

type BreadcrumbSeparatorProps = ComponentPropsWithoutRef<"li"> & {
  children?: ReactNode;
};

export const BreadcrumbSeparator = forwardRef<
  HTMLLIElement,
  BreadcrumbSeparatorProps
>(({ children, className, ...props }, ref) => (
  <li
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn("breadcrumb-separator", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
));
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
