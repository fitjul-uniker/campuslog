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
import { LoadingStatus } from "@/components/common/LoadingState";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { AnimatedRecommendationList } from "@/components/recommendations/AnimatedRecommendationList";
import { GooeyInput } from "@/components/ui/GooeyInput";
import { CountUp } from "@/components/ui/CountUp";
import { usePinnedItems } from "@/hooks/use-pinned-items";
import { useTransientScrollbar } from "@/hooks/use-transient-scrollbar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getRecommendationPurposeConfig } from "@/lib/recommendationPurposeConfig";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  Experience,
  RecommendationResult as Recommendation,
} from "@/lib/types";

const RECOMMENDATION_DETAIL_ID = "recommendation-history-detail";
const LAYOUT_TRANSITION = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};
function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export default function RecommendationHistoryPage() {
  const recommendationPins = usePinnedItems("recommendation");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [recommendations, setRecommendations] = useState<
    Recommendation[] | null
  >(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<
    string | null
  >(null);
  const [requestedRecommendationId, setRequestedRecommendationId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const lastSelectionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileScrollTimerRef = useRef<number | null>(null);
  const handleDetailTransientScroll = useTransientScrollbar<HTMLDivElement>();

  const scrollToRecommendationDetailOnMobile = useCallback(() => {
    if (!window.matchMedia("(max-width: 860px)").matches) {
      return;
    }

    if (mobileScrollTimerRef.current !== null) {
      window.clearTimeout(mobileScrollTimerRef.current);
    }
    mobileScrollTimerRef.current = window.setTimeout(() => {
      document.getElementById(RECOMMENDATION_DETAIL_ID)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
      mobileScrollTimerRef.current = null;
    }, 80);
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadError("");

    try {
      const repository = getCampusLogRepository();
      const [storedExperiences, storedRecommendations] = await Promise.all([
        repository.experiences.list(),
        repository.recommendations.list(),
      ]);
      setExperiences(storedExperiences);
      setRecommendations(storedRecommendations);
    } catch {
      setExperiences([]);
      setRecommendations([]);
      setLoadError(
        "저장된 추천 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  }, []);

  useEffect(() => {
    setRequestedRecommendationId(
      new URLSearchParams(window.location.search).get("recommendationId"),
    );
    loadHistory();
    return () => {
      if (mobileScrollTimerRef.current !== null) {
        window.clearTimeout(mobileScrollTimerRef.current);
      }
    };
  }, [loadHistory]);

  useEffect(() => {
    if (
      !requestedRecommendationId ||
      !recommendations?.some(
        (recommendation) => recommendation.id === requestedRecommendationId,
      )
    ) {
      return;
    }

    setSelectedRecommendationId(requestedRecommendationId);
    setRequestedRecommendationId(null);
    scrollToRecommendationDetailOnMobile();
  }, [
    recommendations,
    requestedRecommendationId,
    scrollToRecommendationDetailOnMobile,
  ]);

  const normalizedSearchQuery = normalizeSearchValue(searchQuery);
  const filteredRecommendations = useMemo(() => {
    if (!recommendations || !normalizedSearchQuery) {
      return recommendations;
    }

    return recommendations.filter((recommendation) => {
      const searchableText = [
        getRecommendationPurposeConfig(recommendation.purpose).inputLabel,
        recommendation.recommendedExperienceTitle,
        recommendation.prompt,
        recommendation.extractedRequirements.intent,
        ...recommendation.extractedRequirements.requiredCompetencies,
        ...recommendation.extractedRequirements.preferredCompetencies,
        ...recommendation.extractedRequirements.keywords,
        ...recommendation.matches.map((match) => match.experienceTitle),
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

    scrollToRecommendationDetailOnMobile();
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
        className={`recommendation-history-page primary-page${hasSelection ? " has-selection" : ""}`}
      >
        <div className="campuslog-ai-history-header">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="breadcrumb-brand-link">
                  CampusLog
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/recommend">
                  AI 기반 활동 추천
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>추천 기록</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Link
            href="/recommend"
            className="recommendation-history-new liquid-capsule"
          >
            <Sparkles aria-hidden="true" />
            새 추천 받기
          </Link>
        </div>

        <header className="recommendation-history-page-heading primary-page-heading">
          <h1>추천 기록</h1>
          <p className="primary-page-description">
            저장한 질문과 추천 경험을 다시 확인할 수 있습니다.
          </p>
        </header>

        {recommendations === null || !recommendationPins.isLoaded ? (
          <LoadingStatus message="추천 기록을 불러오는 중입니다." />
        ) : (
          <LayoutGroup id="recommendation-history-layout">
            <motion.div
            layout
            className="recommendation-history-workspace dashboard-experience-workspace"
            data-detail-open={hasSelection ? "true" : "false"}
            transition={{ layout: LAYOUT_TRANSITION }}
          >
            <motion.section
              layout="position"
              className="recommendation-history-list-pane dashboard-experience-list-pane liquid-workspace"
              aria-labelledby="recommendation-history-heading"
              transition={{ layout: LAYOUT_TRANSITION }}
            >
              <header className="recommendation-history-heading dashboard-experience-section-heading">
                <div className="recommendation-history-heading-row dashboard-experience-heading-row">
                  <div className="dashboard-experience-title-group">
                    <h2 id="recommendation-history-heading">전체 기록</h2>
                    {recommendations && !loadError ? (
                      <span className="dashboard-experience-count">
                        <CountUp to={recommendations.length} duration={0.75} />
                        <span className="sr-only">
                          전체 기록 {recommendations.length}개
                        </span>
                      </span>
                    ) : null}
                  </div>
                  {recommendations && recommendations.length > 0 ? (
                    <GooeyInput
                      className="recommendation-history-search dashboard-experience-search"
                      placeholder="검색"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      expandedWidth={hasSelection ? 218 : 250}
                    />
                  ) : null}
                </div>
                {normalizedSearchQuery && filteredRecommendations ? (
                  <p className="master-detail-search-feedback" role="status">
                    {filteredRecommendations.length}개의 기록을 찾았습니다.
                  </p>
                ) : null}
              </header>

              {recommendationPins.error ? (
                <div className="pinned-list-error" role="alert">
                  <span>{recommendationPins.error}</span>
                  <button type="button" onClick={recommendationPins.clearError}>
                    닫기
                  </button>
                </div>
              ) : null}

              {loadError ? (
                <div className="dashboard-list-state is-error" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <h2>추천 기록을 불러오지 못했습니다</h2>
                  <p>{loadError}</p>
                  <RippleButton type="button" onClick={loadHistory}>
                    <RotateCcw aria-hidden="true" />
                    다시 시도
                    <RippleButtonRipples />
                  </RippleButton>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="dashboard-list-state is-empty">
                  <History aria-hidden="true" />
                  <h2>아직 저장된 추천 기록이 없습니다</h2>
                  <p>AI 기반 활동 추천을 요청하면 결과가 이곳에 저장됩니다.</p>
                  <Link href="/recommend">AI 기반 활동 추천 받기</Link>
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
                  pinnedItems={recommendationPins.pinnedItems}
                  pendingPinIds={recommendationPins.pendingIds}
                  onSelect={handleSelectRecommendation}
                  onTogglePin={recommendationPins.togglePinned}
                />
              )}
            </motion.section>

            <AnimatePresence initial={false} mode="popLayout">
              {selectedRecommendation ? (
                <motion.aside
                  key="recommendation-history-detail-slot"
                  layout
                  id={RECOMMENDATION_DETAIL_ID}
                  className="recommendation-history-detail recommendation-history-detail-slot dashboard-experience-detail-slot liquid-section"
                  aria-labelledby="recommendation-title"
                  initial={{ opacity: 0, x: 24, scale: 0.985 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 16, scale: 0.99 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className="recommendation-history-detail-scroll"
                    data-transient-scrollbar="true"
                    onScroll={handleDetailTransientScroll}
                  >
                    <RecommendationResult
                      key={selectedRecommendation.id}
                      result={selectedRecommendation}
                      experience={recommendedExperience}
                      experiences={experiences}
                      variant="embedded"
                      onClose={handleCloseDetail}
                    />
                  </div>
                </motion.aside>
              ) : null}
            </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </div>
    </MotionConfig>
  );
}
