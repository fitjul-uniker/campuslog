"use client";

import { Star } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import type { KeyboardEvent, UIEvent } from "react";
import { useRef } from "react";

import { formatDateTime } from "@/lib/date";
import { getRecommendationPurposeConfig } from "@/lib/recommendationPurposeConfig";
import { useTransientScrollbar } from "@/hooks/use-transient-scrollbar";
import type { RecommendationResult } from "@/lib/types";

type AnimatedRecommendationListProps = {
  recommendations: RecommendationResult[];
  selectedRecommendationId: string | null;
  detailId: string;
  pinnedItems: Record<string, string>;
  pendingPinIds: Set<string>;
  onSelect: (
    recommendation: RecommendationResult,
    trigger: HTMLButtonElement,
  ) => void;
  onTogglePin: (recommendationId: string) => void;
};

export function AnimatedRecommendationList({
  recommendations,
  selectedRecommendationId,
  detailId,
  pinnedItems,
  pendingPinIds,
  onSelect,
  onTogglePin,
}: AnimatedRecommendationListProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldReduceMotion = useReducedMotion();
  const handleTransientScroll = useTransientScrollbar<HTMLDivElement>();

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    handleTransientScroll(event);
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

  const pinnedRecommendations = recommendations
    .filter((recommendation) => Boolean(pinnedItems[recommendation.id]))
    .sort((a, b) => pinnedItems[b.id].localeCompare(pinnedItems[a.id]));
  const remainingRecommendations = recommendations.filter(
    (recommendation) => !pinnedItems[recommendation.id],
  );
  const orderedRecommendations = [
    ...pinnedRecommendations,
    ...remainingRecommendations,
  ];

  const renderRecommendation = (recommendation: RecommendationResult) => {
    const index = orderedRecommendations.findIndex(
      (orderedRecommendation) =>
        orderedRecommendation.id === recommendation.id,
    );
    const isSelected =
      recommendation.id === selectedRecommendationId;
    const isPinned = Boolean(pinnedItems[recommendation.id]);
    const isPinPending = pendingPinIds.has(recommendation.id);

    return (
      <motion.li
        layout
        layoutId={`recommendation-list-item:${recommendation.id}`}
        key={recommendation.id}
        className="pinned-list-item"
        data-pinned={isPinned ? "true" : "false"}
        data-selected={isSelected ? "true" : "false"}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
        transition={{
          layout: {
            duration: shouldReduceMotion ? 0 : 0.32,
            ease: [0.22, 1, 0.36, 1],
          },
          opacity: { duration: shouldReduceMotion ? 0 : 0.18 },
          y: {
            duration: shouldReduceMotion ? 0 : 0.2,
            delay: shouldReduceMotion ? 0 : Math.min(index * 0.025, 0.15),
            ease: [0.22, 1, 0.36, 1],
          },
        }}
      >
        <div className="pinned-list-row">
          <button
            ref={(button) => {
              buttonRefs.current[index] = button;
            }}
            className="recommendation-history-row"
            type="button"
            aria-controls={isSelected ? detailId : undefined}
            aria-expanded={isSelected}
            data-selected={isSelected ? "true" : "false"}
            onClick={(event) => onSelect(recommendation, event.currentTarget)}
            onKeyDown={(event) => handleItemKeyDown(event, index)}
          >
            <span className="recommendation-history-row-meta">
              {getRecommendationPurposeConfig(recommendation.purpose)
                .inputLabel} · {recommendation.recommendedExperienceTitle}
            </span>
            <span className="recommendation-history-row-prompt">
              {recommendation.prompt}
            </span>
            <time dateTime={recommendation.generatedAt}>
              {formatDateTime(recommendation.generatedAt)}
            </time>
          </button>

          <button
            type="button"
            className="pinned-list-pin-button"
            aria-label={`${recommendation.recommendedExperienceTitle} 추천 기록 ${isPinned ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}`}
            aria-pressed={isPinned}
            aria-busy={isPinPending}
            disabled={isPinPending}
            onClick={() => onTogglePin(recommendation.id)}
          >
            <Star aria-hidden="true" />
          </button>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="recommendation-animated-list-shell dashboard-animated-list-shell">
      <LayoutGroup id="recommendation-pinned-list">
        <motion.div
          layoutScroll
          className="recommendation-animated-list dashboard-animated-list pinned-list"
          data-transient-scrollbar="true"
          onScroll={handleScroll}
        >
          <ul aria-label="저장된 추천 기록 목록">
            <AnimatePresence initial={false} mode="popLayout">
              {pinnedRecommendations.length > 0 ? (
                <motion.li
                  layout
                  key="recommendation-pinned-heading"
                  className="pinned-list-section-heading"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>즐겨찾기</span>
                </motion.li>
              ) : null}
              {pinnedRecommendations.map(renderRecommendation)}
              {pinnedRecommendations.length > 0 &&
              remainingRecommendations.length > 0 ? (
                <motion.li
                  layout
                  key="recommendation-all-heading"
                  className="pinned-list-section-heading is-all"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>모든 기록</span>
                </motion.li>
              ) : null}
              {remainingRecommendations.map(renderRecommendation)}
            </AnimatePresence>
          </ul>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
