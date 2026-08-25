type LoadingStateVariant =
  | "dashboard"
  | "list"
  | "recommendation"
  | "recommendation-form";

type LoadingStateProps = {
  message?: string;
  variant: LoadingStateVariant;
  showIntro?: boolean;
};

export function LoadingStatus({ message }: { message: string }) {
  return (
    <span
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {message}
    </span>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span className={`product-skeleton-block ${className}`.trim()} />;
}

function PageIntroSkeleton({ showAction = false }: { showAction?: boolean }) {
  return (
    <div
      className={`product-loading-intro${showAction ? " has-action" : ""}`}
      aria-hidden="true"
    >
      <SkeletonBlock className="product-skeleton-breadcrumb" />
      <SkeletonBlock className="product-skeleton-page-title" />
      <SkeletonBlock className="product-skeleton-page-description" />
      {showAction ? (
        <SkeletonBlock className="product-skeleton-page-action" />
      ) : null}
    </div>
  );
}

function SurfaceHeading() {
  return (
    <div className="product-loading-surface-heading">
      <SkeletonBlock className="product-skeleton-section-title" />
      <SkeletonBlock className="product-skeleton-action" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="product-loading-dashboard" aria-hidden="true">
      <section className="product-loading-surface product-loading-overview">
        <SurfaceHeading />
        <div className="product-loading-overview-grid">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="product-loading-summary" key={index}>
              <SkeletonBlock className="product-skeleton-label" />
              <SkeletonBlock className="product-skeleton-value" />
              <SkeletonBlock className="product-skeleton-copy product-skeleton-copy-short" />
            </div>
          ))}
        </div>
      </section>
      <section className="product-loading-surface product-loading-calendar">
        <SurfaceHeading />
        <div className="product-loading-calendar-weekdays">
          {Array.from({ length: 7 }, (_, index) => (
            <SkeletonBlock className="product-skeleton-calendar-label" key={index} />
          ))}
        </div>
        <div className="product-loading-calendar-grid">
          {Array.from({ length: 28 }, (_, index) => (
            <SkeletonBlock className="product-skeleton-calendar-day" key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ListSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`product-loading-surface product-loading-list-surface${compact ? " is-compact" : ""}`}
      aria-hidden="true"
    >
      <SurfaceHeading />
      <div className="product-loading-list">
        {Array.from({ length: compact ? 4 : 5 }, (_, index) => (
          <div className="product-loading-list-item" key={index}>
            <div className="product-loading-list-copy">
              <SkeletonBlock className="product-skeleton-list-title" />
              <SkeletonBlock className="product-skeleton-copy" />
              <SkeletonBlock className="product-skeleton-meta" />
            </div>
            <SkeletonBlock className="product-skeleton-list-action" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="product-loading-recommendation-layout" aria-hidden="true">
      <section className="product-loading-surface product-loading-recommendation-entry">
        <div className="product-loading-recommendation-copy">
          <SkeletonBlock className="product-skeleton-section-title product-skeleton-section-title-wide" />
          <SkeletonBlock className="product-skeleton-copy" />
          <SkeletonBlock className="product-skeleton-copy product-skeleton-copy-short" />
          <SkeletonBlock className="product-skeleton-action" />
        </div>
      </section>
    </div>
  );
}

function RecommendationFormSkeleton() {
  return (
    <div className="product-loading-recommendation-layout" aria-hidden="true">
      <section className="product-loading-surface product-loading-form-surface">
        <SurfaceHeading />
        <SkeletonBlock className="product-skeleton-field-label" />
        <SkeletonBlock className="product-skeleton-field" />
        <SkeletonBlock className="product-skeleton-field-label product-skeleton-field-label-wide" />
        <SkeletonBlock className="product-skeleton-textarea" />
        <SkeletonBlock className="product-skeleton-upload" />
        <div className="product-loading-form-actions">
          <SkeletonBlock className="product-skeleton-action product-skeleton-action-wide" />
        </div>
      </section>
      <section className="product-loading-surface product-loading-result-preview">
        <SkeletonBlock className="product-skeleton-section-title product-skeleton-section-title-wide" />
        <SkeletonBlock className="product-skeleton-copy" />
        <SkeletonBlock className="product-skeleton-copy product-skeleton-copy-short" />
      </section>
    </div>
  );
}

export function LoadingState({
  message = "화면을 불러오는 중입니다.",
  variant,
  showIntro = true,
}: LoadingStateProps) {
  const hasHeaderAction =
    variant === "recommendation" ||
    variant === "recommendation-form";

  return (
    <div
      className={`product-loading product-loading-${variant}${showIntro ? " has-page-intro" : " is-content-only"}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{message}</span>
      {showIntro ? (
        <PageIntroSkeleton showAction={hasHeaderAction} />
      ) : null}
      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "list" ? <ListSkeleton /> : null}
      {variant === "recommendation" ? <RecommendationSkeleton /> : null}
      {variant === "recommendation-form" ? (
        <RecommendationFormSkeleton />
      ) : null}
    </div>
  );
}
