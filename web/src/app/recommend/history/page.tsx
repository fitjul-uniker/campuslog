"use client";

import Link from "next/link";
import { ArrowLeft, History, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { RecommendationResult } from "@/components/ai/RecommendationResult";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime } from "@/lib/date";
import { getExperiences, getRecommendationResults } from "@/lib/storage";
import type {
  Experience,
  RecommendationPurpose,
  RecommendationResult as Recommendation,
} from "@/lib/types";

const PURPOSE_LABELS: Record<RecommendationPurpose, string> = {
  cover_letter: "자기소개서",
  portfolio: "포트폴리오",
  interview: "면접",
  activity_application: "대외활동/지원서",
  other: "기타",
};

export default function RecommendationHistoryPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [recommendations, setRecommendations] = useState<
    Recommendation[] | null
  >(null);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState("");

  useEffect(() => {
    const storedRecommendations = getRecommendationResults();

    setExperiences(getExperiences());
    setRecommendations(storedRecommendations);
    setSelectedRecommendationId(storedRecommendations[0]?.id ?? "");
  }, []);

  const selectedRecommendation =
    recommendations?.find(
      (recommendation) => recommendation.id === selectedRecommendationId,
    ) ??
    recommendations?.[0] ??
    null;

  const recommendedExperience = experiences.find(
    (experience) =>
      experience.id === selectedRecommendation?.recommendedExperienceId,
  );

  if (recommendations === null) {
    return (
      <div className="page-stack page-stack-narrow">
        <section className="placeholder-panel">
          <p className="muted-text">추천 기록을 불러오는 중입니다.</p>
        </section>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="page-stack page-stack-narrow">
        <section className="page-header">
          <div>
            <p className="eyebrow">AI 경험 추천 및 활용</p>
            <h1>추천 기록</h1>
            <p className="page-description">
              활용 목적과 질문별로 저장된 AI 추천 결과를 다시 확인합니다.
            </p>
          </div>
        </section>

        <EmptyState
          title="아직 저장된 추천 기록이 없습니다"
          description="AI 추천을 요청하면 활용 목적, 질문, 추천 경험과 참고 문장이 이곳에 저장됩니다."
          icon={<History />}
          primaryAction={{
            href: "/recommend",
            label: "AI 추천 받기",
          }}
          secondaryAction={{
            href: "/",
            label: "대시보드로 돌아가기",
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
          <h1>추천 기록</h1>
          <p className="page-description">
            활용 목적과 질문별로 저장된 AI 추천 결과를 다시 확인합니다.
          </p>
        </div>

        <div className="header-actions">
          <Link href="/recommend" className="button button-primary">
            <Sparkles className="button-icon" aria-hidden="true" />
            새 추천 받기
          </Link>
          <Link href="/" className="button button-secondary">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            대시보드
          </Link>
        </div>
      </section>

      <section
        className="detail-panel"
        aria-labelledby="recommendation-history-title"
      >
        <div className="detail-header">
          <div>
            <p className="experience-meta">저장된 추천</p>
            <h2 id="recommendation-history-title">추천 기록 목록</h2>
          </div>
          <span className="status-badge">{recommendations.length}개 저장</span>
        </div>

        <div className="recommendation-history-list">
          {recommendations.map((item) => {
            const isSelected = item.id === selectedRecommendation?.id;

            return (
              <button
                key={item.id}
                className={
                  isSelected
                    ? "recommendation-history-item is-selected"
                    : "recommendation-history-item"
                }
                type="button"
                onClick={() => setSelectedRecommendationId(item.id)}
                aria-pressed={isSelected}
              >
                <span className="history-item-icon" aria-hidden="true">
                  <History />
                </span>
                <span className="history-item-content">
                  <span className="history-item-meta">
                    {PURPOSE_LABELS[item.purpose]} ·{" "}
                    {item.recommendedExperienceTitle}
                  </span>
                  <span className="history-item-prompt">{item.prompt}</span>
                  <span className="history-item-date">
                    {formatDateTime(item.generatedAt)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selectedRecommendation ? (
        <RecommendationResult
          result={selectedRecommendation}
          experience={recommendedExperience}
        />
      ) : null}
    </div>
  );
}
