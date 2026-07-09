import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateAction = {
  href: string;
  label: string;
};

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
};

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <section className="empty-state" aria-labelledby="empty-state-title">
      {icon ? (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 id="empty-state-title">{title}</h2>
      <p>{description}</p>
      {primaryAction || secondaryAction ? (
        <div className="empty-state-actions">
          {primaryAction ? (
            <Link href={primaryAction.href} className="button button-primary">
              {primaryAction.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link href={secondaryAction.href} className="button button-ghost">
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
