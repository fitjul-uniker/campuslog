"use client";

import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent, UIEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatDateTime } from "@/lib/date";
import type {
  RecommendationPurpose,
  RecommendationResult,
} from "@/lib/types";

type AnimatedRecommendationListProps = {
  recommendations: RecommendationResult[];
  selectedRecommendationId: string | null;
  detailId: string;
  onSelect: (
    recommendation: RecommendationResult,
    trigger: HTMLButtonElement,
  ) => void;
};

const PURPOSE_LABELS: Record<RecommendationPurpose, string> = {
  cover_letter: "자기소개서",
  portfolio: "포트폴리오",
  interview: "면접",
  jd: "JD",
  activity_application: "대외활동/지원서",
  other: "기타",
};

const SCROLL_FADE_DISTANCE = 48;

export function AnimatedRecommendationList({
  recommendations,
  selectedRecommendationId,
  detailId,
  onSelect,
}: AnimatedRecommendationListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldReduceMotion = useReducedMotion();
  const [scrollFades, setScrollFades] = useState({ top: 0, bottom: 0 });

  const updateScrollFades = useCallback((container: HTMLDivElement) => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const bottomDistance = scrollHeight - scrollTop - clientHeight;

    setScrollFades({
      top: Math.min(scrollTop / SCROLL_FADE_DISTANCE, 1),
      bottom:
        scrollHeight <= clientHeight
          ? 0
          : Math.min(bottomDistance / SCROLL_FADE_DISTANCE, 1),
    });
  }, []);

  useEffect(() => {
    const container = listRef.current;

    if (!container) {
      return;
    }

    updateScrollFades(container);
    const resizeObserver = new ResizeObserver(() => updateScrollFades(container));
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [
    recommendations.length,
    selectedRecommendationId,
    updateScrollFades,
  ]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    updateScrollFades(event.currentTarget);
  };

  const moveFocus = (index: number) => {
    const button = buttonRefs.current[index];
    if (!button) return;
    button.focus();
    button.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const handleItemKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = Math.min(index + 1, recommendations.length - 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(index - 1, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = recommendations.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    moveFocus(nextIndex);
  };

  return (
    <div className="recommendation-animated-list-shell">
      <motion.div
        layoutScroll
        ref={listRef}
        className="recommendation-animated-list"
        onScroll={handleScroll}
      >
        <ul aria-label="저장된 추천 기록 목록">
          {recommendations.map((recommendation, index) => {
            const isSelected =
              recommendation.id === selectedRecommendationId;

            return (
              <motion.li
                layout="position"
                key={recommendation.id}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, y: 8 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.2,
                  delay: shouldReduceMotion
                    ? 0
                    : Math.min(index * 0.03, 0.18),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <button
                  ref={(button) => {
                    buttonRefs.current[index] = button;
                  }}
                  className="recommendation-history-row"
                  type="button"
                  aria-controls={isSelected ? detailId : undefined}
                  aria-expanded={isSelected}
                  data-selected={isSelected ? "true" : "false"}
                  onClick={(event) =>
                    onSelect(recommendation, event.currentTarget)
                  }
                  onKeyDown={(event) => handleItemKeyDown(event, index)}
                >
                  <span className="recommendation-history-row-meta">
                    {PURPOSE_LABELS[recommendation.purpose]} ·{" "}
                    {recommendation.recommendedExperienceTitle}
                  </span>
                  <span className="recommendation-history-row-prompt">
                    {recommendation.prompt}
                  </span>
                  <time dateTime={recommendation.generatedAt}>
                    {formatDateTime(recommendation.generatedAt)}
                  </time>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>

      <span
        className="dashboard-list-fade dashboard-list-fade-top"
        style={{ opacity: scrollFades.top }}
        aria-hidden="true"
      />
      <span
        className="dashboard-list-fade dashboard-list-fade-bottom"
        style={{ opacity: scrollFades.bottom }}
        aria-hidden="true"
      />
    </div>
  );
}
