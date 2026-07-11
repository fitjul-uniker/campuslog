"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, History } from "lucide-react";
import { useEffect, useState } from "react";

import { RecommendationForm } from "@/components/ai/RecommendationForm";
import { RecommendationResult } from "@/components/ai/RecommendationResult";
import { EmptyState } from "@/components/common/EmptyState";
import { createIsoTimestamp } from "@/lib/date";
import { requestRecommendation } from "@/lib/recommendationApi";
import {
  getAnalysisByExperienceId,
  getExperiences,
  saveRecommendationResult,
} from "@/lib/storage";
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
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  useEffect(() => {
    const storedExperiences = getExperiences();
    const storedAnalyses = storedExperiences
      .map((experience) => getAnalysisByExperienceId(experience.id))
      .filter((analysis): analysis is ExperienceAnalysis => Boolean(analysis));

    setExperiences(storedExperiences);
    setAnalyses(storedAnalyses);
  }, []);

  async function handleRecommend(input: RecommendationFormInput) {
    if (!experiences || experiences.length === 0) {
      setRecommendationError(
        "먼저 경험을 기록해야 AI 추천을 받을 수 있습니다.",
      );
      return;
    }

    setIsRecommending(true);
    setRecommendationError("");

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

    const savedRecommendation = saveRecommendationResult({
      id: createRecommendationId(),
      purpose: input.purpose,
      prompt: input.prompt,
      ...response.recommendation,
      generatedAt: createIsoTimestamp(),
    });

    setRecommendation(savedRecommendation);
    setIsRecommending(false);
  }

  const recommendedExperience = experiences?.find(
    (experience) => experience.id === recommendation?.recommendedExperienceId,
  );

  if (experiences === null) {
    return (
      <div className="page-stack page-stack-narrow">
        <section className="placeholder-panel">
          <p className="muted-text">추천 화면을 불러오는 중입니다.</p>
        </section>
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="page-stack page-stack-narrow">
        <section className="page-header">
          <div>
            <p className="eyebrow">AI 경험 추천 및 활용</p>
            <h1>AI 추천</h1>
            <p className="page-description">
              저장된 경험 전체와 분석 결과를 바탕으로 지금 활용할 경험을
              고릅니다.
            </p>
          </div>
        </section>

        <EmptyState
          title="먼저 경험을 기록해야 AI 추천을 받을 수 있어요"
          description="추천은 저장된 활동 경험을 기준으로 실행됩니다. 첫 경험을 기록한 뒤 다시 추천을 요청해 주세요."
          icon={<BookOpenText />}
          primaryAction={{
            href: "/dashboard",
            label: "나의 경험에서 기록하기",
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-stack page-stack-narrow">
      <section className="page-header">
        <div>
          <p className="eyebrow">AI 경험 추천 및 활용</p>
          <h1>AI 추천</h1>
          <p className="page-description">
            저장된 경험 전체와 분석 결과를 바탕으로 지금 활용할 경험을
            고릅니다.
          </p>
        </div>

        <div className="header-actions">
          <Link href="/recommend/history" className="button button-secondary">
            <History className="button-icon" aria-hidden="true" />
            추천 기록
          </Link>
          <Link href="/dashboard" className="button button-secondary">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            대시보드
          </Link>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="recommend-form-title">
        <div className="panel-heading">
          <div>
            <h2 id="recommend-form-title">추천 입력</h2>
            <p className="muted-text">
              저장된 경험 {experiences.length}개와 분석 결과 {analyses.length}
              개를 함께 참고합니다.
            </p>
          </div>
        </div>

        <RecommendationForm
          isLoading={isRecommending}
          onSubmit={handleRecommend}
        />

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
              <p className="experience-meta">추천 생성 중</p>
              <h2>추천할 경험을 찾는 중입니다</h2>
            </div>
          </div>
          <div className="recommendation-preview" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
      ) : recommendation ? (
        <RecommendationResult
          result={recommendation}
          experience={recommendedExperience}
        />
      ) : (
        <section className="placeholder-panel" aria-labelledby="ready-title">
          <h2 id="ready-title">추천 결과 대기 중</h2>
          <p className="muted-text">
            활용 목적과 질문을 입력하면 가장 적합한 경험 1개와 참고 문장을
            표시합니다.
          </p>
        </section>
      )}
    </div>
  );
}
