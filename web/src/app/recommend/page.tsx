"use client";

import Link from "next/link";
import { BookOpenText, History } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { RecommendationForm } from "@/components/ai/RecommendationForm";
import { AIProcessingPanel } from "@/components/ai/AIProcessingPanel";
import { RecommendationResult } from "@/components/ai/RecommendationResult";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createIsoTimestamp } from "@/lib/date";
import { mergeAnalysisGapAnswersIntoAnalysis } from "@/lib/analysisGapAnswers";
import { requestRecommendation } from "@/lib/recommendationApi";
import {
  createRecommendationRequestContext,
  type RecommendationRequestContextStats,
} from "@/lib/recommendationInputCompaction";
import { getRecommendationPurposeConfig } from "@/lib/recommendationPurposeConfig";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  Experience,
  ExperienceAnalysis,
  RecommendationPurpose,
  RecommendationResult as Recommendation,
} from "@/lib/types";

type RecommendationFormInput = {
  purpose: RecommendationPurpose;
  prompt: string;
};

const RECOMMENDATION_PAGE_DESCRIPTION =
  "적합한 경험 Top 3를 근거와 함께 비교합니다.";

function RecommendationPageBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="breadcrumb-brand-link">
            CampusLog
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>AI 기반 활동 추천</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function RecommendationPageHeader() {
  return (
    <section className="page-header recommendation-page-header primary-page-heading">
      <div className="recommendation-page-header-copy">
        <h1>AI 기반 활동 추천</h1>
        <p className="page-description primary-page-description">
          {RECOMMENDATION_PAGE_DESCRIPTION}
        </p>
      </div>

      <div className="header-actions recommendation-header-actions">
        <Link
          href="/recommend/history"
          className="button button-ghost recommendation-header-link"
        >
          <History className="button-icon" aria-hidden="true" />
          추천 기록
        </Link>
      </div>
    </section>
  );
}

function createRecommendationId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `recommendation-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export default function RecommendPage() {
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [analyses, setAnalyses] = useState<ExperienceAnalysis[]>([]);
  const [trackedActivityCount, setTrackedActivityCount] = useState(0);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [recommendationStatusMessage, setRecommendationStatusMessage] =
    useState("");
  const [pendingRecommendationInput, setPendingRecommendationInput] =
    useState<RecommendationFormInput | null>(null);
  const [
    pendingRecommendationContextStats,
    setPendingRecommendationContextStats,
  ] = useState<RecommendationRequestContextStats | null>(null);
  const recommendationResultRef = useRef<HTMLDivElement>(null);
  const lastScrolledRecommendationIdRef = useRef<string | null>(null);
  const recommendationAbortControllerRef = useRef<AbortController | null>(
    null,
  );
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendationData() {
      const repository = getCampusLogRepository();
      const [storedExperiences, storedTrackedActivities] = await Promise.all([
        repository.experiences.list(),
        repository.trackedActivities.list(),
      ]);
      const storedAnalyses = (
        await Promise.all(
          storedExperiences.map(async (experience) => {
            const [analysis, followups] = await Promise.all([
              repository.analyses.getByExperienceId(experience.id),
              repository.experienceFollowups.listByExperienceId(experience.id),
            ]);

            return analysis
              ? mergeAnalysisGapAnswersIntoAnalysis(analysis, followups)
              : null;
          }),
        )
      ).filter((analysis): analysis is ExperienceAnalysis => Boolean(analysis));

      if (isMounted) {
        setExperiences(storedExperiences);
        setAnalyses(storedAnalyses);
        setTrackedActivityCount(storedTrackedActivities.length);
      }
    }

    loadRecommendationData().catch(() => {
      if (isMounted) {
        setExperiences([]);
        setAnalyses([]);
        setTrackedActivityCount(0);
        setRecommendationError(
          "계정 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const recommendationId = recommendation?.id;

  useEffect(() => {
    if (
      !recommendationId ||
      lastScrolledRecommendationIdRef.current === recommendationId
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const resultElement = recommendationResultRef.current;

      if (!resultElement) {
        return;
      }

      lastScrolledRecommendationIdRef.current = recommendationId;
      resultElement.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [recommendationId, shouldReduceMotion]);

  useEffect(() => {
    return () => {
      recommendationAbortControllerRef.current?.abort();
    };
  }, []);

  async function handleRecommend(input: RecommendationFormInput) {
    if (isRecommending) {
      return;
    }

    if (!experiences || experiences.length === 0) {
      setRecommendationError(
        "먼저 경험을 기록해야 AI 기반 활동 추천을 받을 수 있습니다.",
      );
      return;
    }

    setIsRecommending(true);
    setRecommendationError("");
    setRecommendationStatusMessage("");
    setRecommendation(null);
    setPendingRecommendationInput(input);

    const recommendationContext = createRecommendationRequestContext({
      ...input,
      experiences,
      analyses,
    });
    setPendingRecommendationContextStats(recommendationContext.stats);

    const abortController = new AbortController();
    recommendationAbortControllerRef.current = abortController;

    try {
      const response = await requestRecommendation({
        ...input,
        experiences: recommendationContext.experiences,
        analyses: recommendationContext.analyses,
        signal: abortController.signal,
        stream: true,
        onStatus: setRecommendationStatusMessage,
      });

      if (!response.ok) {
        setRecommendationError(
          response.error.code === "REQUEST_CANCELLED"
            ? "AI 추천 요청을 취소했습니다. 입력은 그대로 유지했어요."
            : response.error.message,
        );
        return;
      }

      const repository = getCampusLogRepository();
      const savedRecommendation = await repository.recommendations.save({
        id: createRecommendationId(),
        purpose: input.purpose,
        prompt: input.prompt,
        ...response.recommendation,
        generatedAt: createIsoTimestamp(),
      });

      if (!savedRecommendation) {
        setRecommendationError(
          "활동 추천 결과를 계정에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }

      setRecommendation(savedRecommendation);
    } finally {
      if (recommendationAbortControllerRef.current === abortController) {
        recommendationAbortControllerRef.current = null;
      }
      setIsRecommending(false);
      setRecommendationStatusMessage("");
    }
  }

  function handleCancelRecommendation() {
    recommendationAbortControllerRef.current?.abort();
  }

  const recommendedExperience = experiences?.find(
    (experience) => experience.id === recommendation?.recommendedExperienceId,
  );
  const pendingPurposeConfig = pendingRecommendationInput
    ? getRecommendationPurposeConfig(pendingRecommendationInput.purpose)
    : null;

  if (experiences === null) {
    return (
      <div className="page-stack page-stack-narrow recommendation-page primary-page">
        <RecommendationPageBreadcrumb />
        <RecommendationPageHeader />

        <section className="placeholder-panel">
          <p className="muted-text">활동 추천 화면을 불러오는 중입니다.</p>
        </section>
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="page-stack page-stack-narrow recommendation-page primary-page">
        <RecommendationPageBreadcrumb />
        <RecommendationPageHeader />

        <EmptyState
          title={
            trackedActivityCount > 0
              ? "등록한 활동을 완료 경험으로 정리하면 AI 기반 활동 추천을 받을 수 있어요"
              : "먼저 활동을 시작해야 AI 기반 활동 추천을 받을 수 있어요"
          }
          description={
            trackedActivityCount > 0
              ? "오늘의 기록에서 활동 상태와 쌓인 내용을 확인한 뒤 완료 경험으로 정리해 주세요."
              : "활동을 추가해 한 일을 쌓거나, 과거 활동을 직접 기록해 주세요."
          }
          icon={<BookOpenText />}
          primaryAction={{
            href: trackedActivityCount > 0 ? "/dashboard" : "/activities/new",
            label:
              trackedActivityCount > 0
                ? "등록한 활동 확인하기"
                : "활동 추가",
          }}
          secondaryAction={{
            href: "/experiences/new",
            label: "과거 활동 기록하기",
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-stack page-stack-narrow recommendation-page primary-page">
      <RecommendationPageBreadcrumb />
      <RecommendationPageHeader />

      <section className="form-panel" aria-labelledby="recommend-form-title">
        <div className="panel-heading">
          <div>
            <h2 id="recommend-form-title">추천 입력</h2>
            <p className="muted-text">
              저장된 활동과 분석 결과를 함께 참고합니다.
            </p>
          </div>
        </div>

        <RecommendationForm
          isLoading={isRecommending}
          onSubmit={handleRecommend}
        />

        <p className="sr-only" role="status" aria-live="polite">
          {recommendation
            ? `${recommendation.recommendedExperienceTitle} AI 기반 활동 추천 결과가 생성되었습니다.`
            : ""}
        </p>

        {recommendationError ? (
          <p className="form-error" role="alert">
            {recommendationError}
          </p>
        ) : null}
      </section>

      {isRecommending ? (
        <AIProcessingPanel
          className="recommendation-ai-processing"
          title="요구사항과 추천 후보를 비교하고 있어요"
          description="저장된 활동과 분석 결과를 함께 참고해 근거가 있는 추천만 정리합니다."
          contextItems={[
            {
              label: "활용 목적",
              value: pendingPurposeConfig?.label ?? "AI 추천",
            },
            {
              label: "입력 글자 수",
              value: pendingRecommendationInput?.prompt.length ?? 0,
            },
            {
              label: "비교 후보",
              value: pendingRecommendationContextStats
                ? `${pendingRecommendationContextStats.selectedExperienceCount}/${pendingRecommendationContextStats.totalExperienceCount}개 경험`
                : `${experiences.length}개 경험`,
            },
            {
              label: "분석 요약",
              value: pendingRecommendationContextStats
                ? `${pendingRecommendationContextStats.selectedAnalysisCount}/${pendingRecommendationContextStats.totalAnalysisCount}개 반영`
                : `${analyses.length}개 반영`,
            },
          ]}
          steps={[
            "질문이나 JD에서 핵심 요구사항을 파악하고 있어요.",
            "선별된 후보 경험과 분석 결과를 비교하고 있어요.",
            "추천 Top 3와 부족 근거를 정리하고 있어요.",
          ]}
          messages={[
            {
              afterMs: 0,
              text: "질문의 핵심 요구사항을 살펴보고 있어요.",
            },
            {
              afterMs: 7_000,
              text: "선별된 후보 경험과 분석 결과를 비교하고 있어요.",
            },
            {
              afterMs: 16_000,
              text: "적합한 경험과 추천 근거를 정리하고 있어요.",
            },
          ]}
          statusMessage={recommendationStatusMessage || undefined}
          skeletonVariant="recommendation"
          longWaitThresholdMs={22_000}
          longWaitMessage="저장된 경험이 많으면 관련 후보를 먼저 추려 비교합니다. 질문이 길면 추천 근거 정리에 시간이 더 걸릴 수 있어요."
          canCancel
          onCancel={handleCancelRecommendation}
        />
      ) : recommendation ? (
        <div
          ref={recommendationResultRef}
          className="recommendation-result-anchor"
        >
          <RecommendationResult
            result={recommendation}
            experience={recommendedExperience}
            experiences={experiences}
          />
        </div>
      ) : (
        <section className="placeholder-panel" aria-labelledby="ready-title">
          <h2 id="ready-title">AI 기반 활동 추천 결과 대기 중</h2>
          <p className="muted-text">
            활용 목적과 질문을 입력하면 요구사항을 정리하고 적합한 활동 Top
            3를 비교해 표시합니다.
          </p>
        </section>
      )}
    </div>
  );
}
