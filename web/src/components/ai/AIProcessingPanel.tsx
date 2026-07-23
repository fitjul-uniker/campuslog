"use client";

import { Clock3, Sparkles, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AIProcessingContextItem = {
  label: string;
  value: string | number;
};

type AIProcessingMessage = {
  afterMs: number;
  text: string;
};

type AISkeletonVariant =
  | "analysis"
  | "recommendation"
  | "answerDraft"
  | "activitySynthesis";

type AIProcessingPanelProps = {
  title: string;
  description: string;
  contextItems?: AIProcessingContextItem[];
  steps: string[];
  messages: AIProcessingMessage[];
  skeletonVariant: AISkeletonVariant;
  longWaitThresholdMs?: number;
  longWaitMessage?: string;
  canCancel?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  className?: string;
};

function formatContextValue(value: string | number): string {
  return typeof value === "number" ? value.toLocaleString("ko-KR") : value;
}

function getActiveMessage(
  elapsedMs: number,
  messages: AIProcessingMessage[],
): string {
  return messages.reduce(
    (activeMessage, message) =>
      elapsedMs >= message.afterMs ? message.text : activeMessage,
    messages[0]?.text ?? "요청을 처리하고 있어요.",
  );
}

function AISkeleton({ variant }: { variant: AISkeletonVariant }) {
  if (variant === "recommendation") {
    return (
      <div className="ai-processing-skeleton ai-processing-skeleton-recommendation" aria-hidden="true">
        <div className="ai-skeleton-requirements">
          <span />
          <span />
          <span />
        </div>
        <div className="ai-skeleton-match-list">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (variant === "answerDraft") {
    return (
      <div className="ai-processing-skeleton ai-processing-skeleton-draft" aria-hidden="true">
        <span className="ai-skeleton-title" />
        <span />
        <span />
        <span className="ai-skeleton-short" />
        <div className="ai-skeleton-evidence-row">
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (variant === "activitySynthesis") {
    return (
      <div className="ai-processing-skeleton ai-processing-skeleton-activity" aria-hidden="true">
        <span className="ai-skeleton-title" />
        <span />
        <span />
        <div className="ai-skeleton-list">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className="ai-processing-skeleton ai-processing-skeleton-analysis" aria-hidden="true">
      <span className="ai-skeleton-title" />
      <div className="ai-skeleton-star-grid">
        <span />
        <span />
        <span />
        <span />
      </div>
      <span />
      <span className="ai-skeleton-short" />
    </div>
  );
}

export function AIProcessingPanel({
  title,
  description,
  contextItems = [],
  steps,
  messages,
  skeletonVariant,
  longWaitThresholdMs = 18_000,
  longWaitMessage = "입력 내용이 많거나 결과 형식 검증에 시간이 걸리면 평소보다 조금 더 걸릴 수 있어요.",
  canCancel = false,
  cancelLabel = "요청 취소",
  onCancel,
  className = "",
}: AIProcessingPanelProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const activeMessage = useMemo(
    () => getActiveMessage(elapsedMs, messages),
    [elapsedMs, messages],
  );
  const shouldShowLongWait = elapsedMs >= longWaitThresholdMs;

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section
      className={`ai-processing-panel${className ? ` ${className}` : ""}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="ai-processing-header">
        <span className="ai-processing-icon" aria-hidden="true">
          <Sparkles />
        </span>
        <div>
          <p className="ai-processing-kicker">AI 처리 중</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {canCancel ? (
          <button
            className="ai-processing-cancel-button"
            type="button"
            onClick={onCancel}
          >
            <XCircle aria-hidden="true" />
            {cancelLabel}
          </button>
        ) : null}
      </div>

      <div
        className="ai-processing-progress"
        role="progressbar"
        aria-label={title}
      >
        <span />
      </div>

      <p className="ai-processing-message" role="status">
        {activeMessage}
      </p>

      {contextItems.length > 0 ? (
        <dl className="ai-processing-context">
          {contextItems.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{formatContextValue(item.value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="ai-processing-body">
        <div className="ai-processing-steps">
          <p>확인 중인 내용</p>
          <ul>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
        <AISkeleton variant={skeletonVariant} />
      </div>

      {shouldShowLongWait ? (
        <div className="ai-processing-long-wait">
          <Clock3 aria-hidden="true" />
          <p>{longWaitMessage}</p>
        </div>
      ) : null}
    </section>
  );
}
