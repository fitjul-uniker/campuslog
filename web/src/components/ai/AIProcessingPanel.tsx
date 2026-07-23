"use client";

import { XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AITextLoading } from "@/components/ui/AITextLoading";
import { Strands } from "@/components/ui/Strands";

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
  statusMessage?: string;
  skeletonVariant: AISkeletonVariant;
  longWaitThresholdMs?: number;
  longWaitMessage?: string;
  canCancel?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  className?: string;
};

let activeAIProcessingOverlayCount = 0;
let bodyOverflowBeforeAIProcessing = "";

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

function normalizeLoadingText(text: string): string {
  const normalizedText = text.trim().replace(/[.…]+$/u, "");
  return `${normalizedText}...`;
}

function uniqueTexts(texts: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      texts
        .map((text) => text?.trim())
        .filter(Boolean)
        .map((text) => normalizeLoadingText(text as string)),
    ),
  );
}

export function AIProcessingPanel({
  title,
  description,
  steps,
  messages,
  statusMessage,
  longWaitThresholdMs = 18_000,
  longWaitMessage = "입력 내용이 많거나 결과 형식 검증에 시간이 걸리면 평소보다 조금 더 걸릴 수 있어요.",
  canCancel = false,
  cancelLabel = "요청 취소",
  onCancel,
  className = "",
}: AIProcessingPanelProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const timedMessage = useMemo(
    () => getActiveMessage(elapsedMs, messages),
    [elapsedMs, messages],
  );
  const activeMessage = statusMessage ?? timedMessage;
  const shouldShowLongWait = elapsedMs >= longWaitThresholdMs;
  const loadingTexts = useMemo(
    () =>
      uniqueTexts([
        title,
        activeMessage,
        ...steps,
        description,
        shouldShowLongWait ? longWaitMessage : undefined,
      ]),
    [
      activeMessage,
      description,
      longWaitMessage,
      shouldShowLongWait,
      steps,
      title,
    ],
  );

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const node = document.createElement("div");
    node.dataset.aiProcessingPortal = "true";
    document.body.appendChild(node);

    if (activeAIProcessingOverlayCount === 0) {
      bodyOverflowBeforeAIProcessing = document.body.style.overflow;
    }
    activeAIProcessingOverlayCount += 1;
    document.body.style.overflow = "hidden";
    setPortalNode(node);

    return () => {
      activeAIProcessingOverlayCount = Math.max(
        activeAIProcessingOverlayCount - 1,
        0,
      );
      if (activeAIProcessingOverlayCount === 0) {
        document.body.style.overflow = bodyOverflowBeforeAIProcessing;
      }
      node.remove();
    };
  }, []);

  useEffect(() => {
    if (portalNode && canCancel) {
      cancelButtonRef.current?.focus({ preventScroll: true });
    }
  }, [canCancel, portalNode]);

  if (!portalNode) {
    return null;
  }

  return createPortal(
    <section
      className={`ai-processing-overlay${className ? ` ${className}` : ""}`}
      aria-live="polite"
      aria-busy="true"
      aria-label={title}
      role="dialog"
      aria-modal="true"
    >
      <div className="ai-processing-overlay-surface">
        <div className="ai-processing-strands-stage">
          <Strands
            colors={["#F97316", "#7C3AED", "#06B6D4"]}
            count={3}
            speed={0.5}
            amplitude={1}
            waviness={1}
            thickness={0.7}
            glow={2.6}
            taper={3}
            spread={1}
            intensity={0.6}
            saturation={1.5}
            opacity={1}
            scale={1.5}
            glass={false}
          />
        </div>

        <div className="ai-processing-text" role="status">
          <AITextLoading
            texts={loadingTexts}
            interval={2_400}
            className="ai-processing-loading-text"
          />
        </div>

        {canCancel ? (
          <button
            ref={cancelButtonRef}
            className="ai-processing-cancel-button"
            type="button"
            onClick={onCancel}
          >
            <XCircle aria-hidden="true" />
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </section>,
    portalNode,
  );
}
