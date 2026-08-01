type LoadingStateProps = {
  variant?: "dashboard" | "list" | "form";
  count?: number;
  message?: string;
};

function LoadingHeader() {
  return (
    <div className="product-loading-header" aria-hidden="true">
      <span className="product-loading-line is-heading" />
      <span className="product-loading-control" />
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="product-loading-list" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="product-loading-list-row" key={index}>
          <span className="product-loading-line is-row-title" />
          <span className="product-loading-line is-row-meta" />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({
  variant = "list",
  count = 6,
  message = "화면을 불러오는 중입니다.",
}: LoadingStateProps) {
  if (variant === "dashboard") {
    return (
      <section
        className="product-loading-state is-dashboard"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">{message}</span>

        <div
          className="product-loading-surface is-dashboard-overview"
          aria-hidden="true"
        >
          <LoadingHeader />
          <div className="product-loading-overview-grid">
            <span className="product-loading-block is-activity" />
            <span className="product-loading-block is-activity" />
          </div>
          <span className="product-loading-divider" />
          <span className="product-loading-block is-summary" />
        </div>

        <div
          className="product-loading-surface is-dashboard-calendar"
          aria-hidden="true"
        >
          <LoadingHeader />
          <div className="product-loading-calendar-grid">
            {Array.from({ length: 28 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
        </div>

        <div
          className="product-loading-surface is-dashboard-records"
          aria-hidden="true"
        >
          <LoadingHeader />
          <LoadingRows count={3} />
        </div>
      </section>
    );
  }

  if (variant === "form") {
    return (
      <section
        className="product-loading-state is-form liquid-workspace"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">{message}</span>
        <div className="product-loading-form" aria-hidden="true">
          <div className="product-loading-form-copy">
            <span className="product-loading-line is-form-title" />
            <span className="product-loading-line is-form-description" />
          </div>
          <span className="product-loading-block is-input" />
          <span className="product-loading-block is-textarea" />
          <span className="product-loading-block is-upload" />
          <span className="product-loading-line is-form-action" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="product-loading-state is-list"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{message}</span>
      <LoadingHeader />
      <LoadingRows count={count} />
    </section>
  );
}
