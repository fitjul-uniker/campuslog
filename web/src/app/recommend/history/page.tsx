"use client";

import Link from "next/link";
import { AlertCircle, History, RotateCcw, Sparkles } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RecommendationResult } from "@/components/ai/RecommendationResult";
import { AnimatedRecommendationList } from "@/components/recommendations/AnimatedRecommendationList";
import { GooeyInput } from "@/components/ui/GooeyInput";
import { getExperiences, getRecommendationResults } from "@/lib/storage";
import type {
  Experience,
  RecommendationPurpose,
  RecommendationResult as Recommendation,
} from "@/lib/types";

const RECOMMENDATION_DETAIL_ID = "recommendation-history-detail";
const LAYOUT_TRANSITION = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};
const PURPOSE_LABELS: Record<RecommendationPurpose, string> = {
  cover_letter: "자기소개서",
  portfolio: "포트폴리오",
  interview: "면접",
  activity_application: "대외활동/지원서",
  other: "기타",
};

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export default function RecommendationHistoryPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [recommendations, setRecommendations] = useState<
    Recommendation[] | null
  >(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const lastSelectionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileScrollTimerRef = useRef<number | null>(null);

  const loadHistory = useCallback(() => {
    setLoadError("");

    try {
      setExperiences(getExperiences());
      setRecommendations(getRecommendationResults());
    } catch {
      setExperiences([]);
      setRecommendations([]);
      setLoadError(
        "저장된 추천 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  }, []);

  useEffect(() => {
    loadHistory();
    return () => {
      if (mobileScrollTimerRef.current !== null) {
        window.clearTimeout(mobileScrollTimerRef.current);
      }
    };
  }, [loadHistory]);

  const normalizedSearchQuery = normalizeSearchValue(searchQuery);
  const filteredRecommendations = useMemo(() => {
    if (!recommendations || !normalizedSearchQuery) {
      return recommendations;
    }

    return recommendations.filter((recommendation) => {
      const searchableText = [
        PURPOSE_LABELS[recommendation.purpose],
        recommendation.recommendedExperienceTitle,
        recommendation.prompt,
      ]
        .map(normalizeSearchValue)
        .join(" ");

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, recommendations]);

  useEffect(() => {
    if (
      selectedRecommendationId &&
      filteredRecommendations &&
      !filteredRecommendations.some(
        (recommendation) => recommendation.id === selectedRecommendationId,
      )
    ) {
      setSelectedRecommendationId(null);
    }
  }, [filteredRecommendations, selectedRecommendationId]);

  const selectedRecommendation =
    recommendations?.find(
      (recommendation) => recommendation.id === selectedRecommendationId,
    ) ?? null;
  const recommendedExperience = experiences.find(
    (experience) =>
      experience.id === selectedRecommendation?.recommendedExperienceId,
  );

  const handleSelectRecommendation = (
    recommendation: Recommendation,
    trigger: HTMLButtonElement,
  ) => {
    lastSelectionTriggerRef.current = trigger;
    setSelectedRecommendationId(recommendation.id);

    if (window.matchMedia("(max-width: 860px)").matches) {
      if (mobileScrollTimerRef.current !== null) {
        window.clearTimeout(mobileScrollTimerRef.current);
      }
      mobileScrollTimerRef.current = window.setTimeout(() => {
        document.getElementById(RECOMMENDATION_DETAIL_ID)?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        });
        mobileScrollTimerRef.current = null;
      }, 80);
    }
  };

  const handleCloseDetail = useCallback(() => {
    if (mobileScrollTimerRef.current !== null) {
      window.clearTimeout(mobileScrollTimerRef.current);
      mobileScrollTimerRef.current = null;
    }
    setSelectedRecommendationId(null);
    window.requestAnimationFrame(() => {
      if (lastSelectionTriggerRef.current?.isConnected) {
        lastSelectionTriggerRef.current.focus();
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedRecommendation) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseDetail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseDetail, selectedRecommendation]);

  const hasSelection = Boolean(selectedRecommendation);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`recommendation-history-page${hasSelection ? " has-selection" : ""}`}
      >
        <LayoutGroup id="recommendation-history-layout">
          <motion.div
            layout
            className="recommendation-history-workspace"
            data-detail-open={hasSelection ? "true" : "false"}
            transition={{ layout: LAYOUT_TRANSITION }}
          >
            <motion.section
              layout="position"
              className="recommendation-history-list-pane"
              aria-labelledby="recommendation-history-heading"
              transition={{ layout: LAYOUT_TRANSITION }}
            >
              <header className="recommendation-history-heading">
                <div className="recommendation-history-heading-row">
                  <div>
                    <h1 id="recommendation-history-heading">추천 기록</h1>
                    {recommendations && !loadError ? (
                      <span>{recommendations.length}</span>
                    ) : null}
                  </div>
                  {recommendations && recommendations.length > 0 ? (
                    <GooeyInput
                      placeholder="검색"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      expandedWidth={hasSelection ? 218 : 250}
                    />
                  ) : null}
                </div>
                <p>저장한 질문과 추천 경험을 다시 확인할 수 있습니다.</p>
                {normalizedSearchQuery && filteredRecommendations ? (
                  <p className="master-detail-search-feedback" role="status">
                    {filteredRecommendations.length}개의 기록을 찾았습니다.
                  </p>
                ) : null}
                <Link href="/recommend" className="recommendation-history-new">
                  <Sparkles aria-hidden="true" />
                  새 추천 받기
                </Link>
              </header>

              {loadError ? (
                <div className="dashboard-list-state is-error" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <h2>추천 기록을 불러오지 못했습니다</h2>
                  <p>{loadError}</p>
                  <button type="button" onClick={loadHistory}>
                    <RotateCcw aria-hidden="true" />
                    다시 시도
                  </button>
                </div>
              ) : recommendations === null ? (
                <div
                  className="recommendation-history-loading"
                  aria-busy="true"
                  aria-label="저장된 추천 기록을 불러오는 중입니다"
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <span key={index} aria-hidden="true" />
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="dashboard-list-state is-empty">
                  <History aria-hidden="true" />
                  <h2>아직 저장된 추천 기록이 없습니다</h2>
                  <p>AI 추천을 요청하면 결과가 이곳에 저장됩니다.</p>
                  <Link href="/recommend">AI 추천 받기</Link>
                </div>
              ) : filteredRecommendations?.length === 0 ? (
                <div className="dashboard-list-state is-search-empty">
                  <h2>검색 결과가 없습니다</h2>
                  <p>다른 질문이나 추천 경험을 검색해 보세요.</p>
                  <button type="button" onClick={() => setSearchQuery("")}>
                    검색어 지우기
                  </button>
                </div>
              ) : (
                <AnimatedRecommendationList
                  recommendations={filteredRecommendations ?? []}
                  selectedRecommendationId={selectedRecommendationId}
                  detailId={RECOMMENDATION_DETAIL_ID}
                  onSelect={handleSelectRecommendation}
                />
              )}
            </motion.section>

            <AnimatePresence initial={false} mode="popLayout">
              {selectedRecommendation ? (
                <motion.aside
                  key="recommendation-history-detail-slot"
                  layout
                  id={RECOMMENDATION_DETAIL_ID}
                  className="recommendation-history-detail"
                  aria-labelledby="recommendation-title"
                  initial={{ opacity: 0, x: 24, scale: 0.985 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 16, scale: 0.99 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  <RecommendationResult
                    key={selectedRecommendation.id}
                    result={selectedRecommendation}
                    experience={recommendedExperience}
                    variant="embedded"
                    onClose={handleCloseDetail}
                  />
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </MotionConfig>
  );
}
