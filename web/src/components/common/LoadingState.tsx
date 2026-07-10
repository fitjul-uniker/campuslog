type LoadingStateProps = {
  variant?: "panel" | "cards";
  count?: number;
  message?: string;
};

export function LoadingState({
  variant = "panel",
  count = 1,
  message = "화면을 불러오는 중입니다.",
}: LoadingStateProps) {
  if (variant === "cards") {
    return (
      <section className="loading-state" aria-live="polite" aria-busy="true">
        <span className="sr-only">{message}</span>
        {Array.from({ length: count }).map((_, index) => (
          <article className="loading-card" aria-hidden="true" key={index}>
            <div className="loading-card-header">
              <span className="skeleton-line skeleton-title" />
              <span className="skeleton-badge" />
            </div>
            <span className="skeleton-line skeleton-meta" />
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-short" />
            <div className="skeleton-tags">
              <span />
              <span />
              <span />
            </div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="placeholder-panel loading-panel" aria-live="polite">
      <p className="muted-text">{message}</p>
      <div className="skeleton-panel" aria-hidden="true">
        <span className="skeleton-line skeleton-title" />
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-short" />
      </div>
    </section>
  );
}
