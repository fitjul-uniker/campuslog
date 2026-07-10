"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import { formatDateTime } from "@/lib/date";
import type {
  Experience,
  RecommendationPurpose,
  RecommendationResult as Result,
} from "@/lib/types";

type RecommendationResultProps = {
  result: Result;
  experience?: Experience | null;
};

type CopyStatus = "idle" | "success" | "failed";

const PURPOSE_LABELS: Record<RecommendationPurpose, string> = {
  cover_letter: "자기소개서",
  portfolio: "포트폴리오",
  interview: "면접",
  activity_application: "대외활동/지원서",
  other: "기타",
};

export function RecommendationResult({
  result,
  experience,
}: RecommendationResultProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is not available.");
      }

      await navigator.clipboard.writeText(result.draftSentence);
      setCopyStatus("success");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section className="detail-panel" aria-labelledby="recommendation-title">
      <div className="detail-header">
        <div>
          <p className="experience-meta">추천 경험</p>
          <h2 id="recommendation-title">
            {result.recommendedExperienceTitle}
          </h2>
        </div>
        {experience ? (
          <Link
            href={`/experiences/${experience.id}`}
            className="button button-secondary"
          >
            <ExternalLink className="button-icon" aria-hidden="true" />
            상세 보기
          </Link>
        ) : null}
      </div>

      {experience ? (
        <dl className="meta-grid recommendation-meta">
          <div>
            <dt>기간</dt>
            <dd>{experience.period}</dd>
          </div>
          <div>
            <dt>역할</dt>
            <dd>{experience.role}</dd>
          </div>
          <div>
            <dt>추천 생성일</dt>
            <dd>{formatDateTime(result.generatedAt)}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted-text">
          추천 생성일 {formatDateTime(result.generatedAt)}
        </p>
      )}

      <div className="detail-section">
        <h3>활용 목적</h3>
        <p>{PURPOSE_LABELS[result.purpose]}</p>
      </div>

      <div className="detail-section">
        <h3>질문 / 문항</h3>
        <p>{result.prompt}</p>
      </div>

      <div className="detail-section">
        <h3>추천 이유</h3>
        <p>{result.reason}</p>
      </div>

      <div className="detail-section">
        <h3>관련 태그</h3>
        <div className="experience-tags">
          {result.relatedTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h3>강조할 성과</h3>
        <p>{result.highlightedAchievement}</p>
      </div>

      <div className="detail-section">
        <h3>활용 방향</h3>
        <p>{result.usageDirection}</p>
      </div>

      <div className="detail-section">
        <div className="recommendation-section-heading">
          <h3>참고 문장</h3>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleCopy}
          >
            {copyStatus === "success" ? (
              <Check className="button-icon" aria-hidden="true" />
            ) : (
              <Copy className="button-icon" aria-hidden="true" />
            )}
            {copyStatus === "success" ? "복사 완료" : "복사"}
          </button>
        </div>
        <p className="draft-sentence">{result.draftSentence}</p>
        {copyStatus === "success" ? (
          <p className="copy-status" role="status">
            참고 문장을 클립보드에 복사했습니다.
          </p>
        ) : null}
        {copyStatus === "failed" ? (
          <p className="form-error" role="alert">
            복사에 실패했습니다. 문장을 직접 선택해 복사해주세요.
          </p>
        ) : null}
      </div>
    </section>
  );
}
