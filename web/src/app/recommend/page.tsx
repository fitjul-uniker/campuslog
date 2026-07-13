"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, History } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { RecommendationForm } from "@/components/ai/RecommendationForm";
import { RecommendationResult } from "@/components/ai/RecommendationResult";
import { EmptyState } from "@/components/common/EmptyState";
import { createIsoTimestamp } from "@/lib/date";
import { requestRecommendation } from "@/lib/recommendationApi";
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
  "활용 목적과 질문에 맞는 경험을 찾고, 어떻게 풀어낼지 함께 제안합니다.";

function RecommendationPageHeader() {
  return (
    <section className="page-header recommendation-page-header">
      <div className="recommendation-page-header-copy">
        <h1>AI 기반 활동 추천</h1>
        <p className="page-description">{RECOMMENDATION_PAGE_DESCRIPTION}</p>
      </div>

      <div className="header-actions recommendation-header-actions">
        <Link
          href="/recommend/history"
          className="button button-ghost recommendation-header-link"
        >
          <History className="button-icon" aria-hidden="true" />
          추천 기록
        </Link>
        <Link href="/experiences" className="button button-secondary">
          <ArrowLeft className="button-icon" aria-hidden="true" />
          나의 활동
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
  const recommendationResultRef = useRef<HTMLDivElement>(null);
  const lastScrolledRecommendationIdRef = useRef<string | null>(null);
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
          storedExperiences.map((experience) =>
            repository.analyses.getByExperienceId(experience.id),
          ),
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

  async function handleRecommend(input: RecommendationFormInput) {
    if (!experiences || experiences.length === 0) {
      setRecommendationError(
        "먼저 경험을 기록해야 AI 기반 활동 추천을 받을 수 있습니다.",
      );
      return;
    }

    setIsRecommending(true);
    setRecommendationError("");
    setRecommendation(null);

    const response = await requestRecommendation({
      ...input,
      experiences,
      analyses,
    });

    if (!response.ok) {
      setRecommendationError(response.error.message);
      setIsRecommending(false);
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
      setIsRecommending(false);
      return;
    }

    setRecommendation(savedRecommendation);
    setIsRecommending(false);
  }

  const recommendedExperience = experiences?.find(
    (experience) => experience.id === recommendation?.recommendedExperienceId,
  );

  if (experiences === null) {
    return (
      <div className="page-stack page-stack-narrow">
        <RecommendationPageHeader />

        <section className="placeholder-panel">
          <p className="muted-text">활동 추천 화면을 불러오는 중입니다.</p>
        </section>
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="page-stack page-stack-narrow">
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
    <div className="page-stack page-stack-narrow">
      <RecommendationPageHeader />

      <section className="form-panel" aria-labelledby="recommend-form-title">
        <div className="panel-heading">
          <div>
            <h2 id="recommend-form-title">추천 입력</h2>
            <p className="muted-text">
              저장된 활동 {experiences.length}개와 분석 결과 {analyses.length}
              개를 함께 참고합니다.
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
        <section className="detail-panel" aria-live="polite">
          <div className="detail-header">
            <div>
              <p className="experience-meta">활동 추천 생성 중</p>
              <h2>추천할 활동을 찾는 중입니다</h2>
            </div>
          </div>
          <div className="recommendation-preview" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
      ) : recommendation ? (
        <div
          ref={recommendationResultRef}
          className="recommendation-result-anchor"
        >
          <RecommendationResult
            result={recommendation}
            experience={recommendedExperience}
          />
        </div>
      ) : (
        <section className="placeholder-panel" aria-labelledby="ready-title">
          <h2 id="ready-title">AI 기반 활동 추천 결과 대기 중</h2>
          <p className="muted-text">
            활용 목적과 질문을 입력하면 가장 적합한 활동 1개와 참고 문장을
            표시합니다.
          </p>
        </section>
      )}
    </div>
  );
}
