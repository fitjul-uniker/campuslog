"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink, X } from "lucide-react";
import { useState } from "react";

import { CopyButton } from "@/components/animate-ui/components/buttons/copy";
import { formatDateTime } from "@/lib/date";
import type {
  Experience,
  RecommendationPurpose,
  RecommendationResult as Result,
} from "@/lib/types";

type RecommendationResultProps = {
  result: Result;
  experience?: Experience | null;
  experiences?: Experience[];
  variant?: "default" | "embedded";
  onClose?: () => void;
};

type CopyStatus = "idle" | "success" | "failed";

const PURPOSE_LABELS: Record<RecommendationPurpose, string> = {
  cover_letter: "자기소개서",
  portfolio: "포트폴리오",
  interview: "면접",
  activity_application: "대외활동/지원서",
  other: "기타",
};

const FIT_LEVEL_LABELS = {
  high: "높음",
  medium: "보통",
  low: "낮음",
} as const;

function hasListContent(values: string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

export function RecommendationResult({
  result,
  experience,
  experiences = experience ? [experience] : [],
  variant = "default",
  onClose,
}: RecommendationResultProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const isEmbedded = variant === "embedded";
  const requirements = result.extractedRequirements;
  const hasRequirements =
    hasListContent(requirements.requiredCompetencies) ||
    hasListContent(requirements.preferredCompetencies) ||
    hasListContent(requirements.keywords) ||
    hasListContent(requirements.constraints) ||
    requirements.intent.trim().length > 0;
  const matches = result.matches.length > 0
    ? result.matches
    : [
        {
          experienceId: result.recommendedExperienceId,
          experienceTitle: result.recommendedExperienceTitle,
          rank: 1,
          score: 100,
          fitLevel: "high" as const,
          matchReason: result.reason,
          matchedEvidence: result.highlightedAchievement
            ? [result.highlightedAchievement]
            : [],
          missingEvidence: [],
          overclaimRisks: [],
          suggestedAngle: result.usageDirection,
          relatedCompetencies: result.relatedTags,
        },
      ];
  const experiencesById = new Map(
    experiences.map((item) => [item.id, item]),
  );

  return (
    <section
      className={
        isEmbedded
          ? "recommendation-result is-embedded"
          : "detail-panel recommendation-result"
      }
      aria-labelledby="recommendation-title"
    >
      <div className="detail-header">
        <div>
          <p className="experience-meta recommendation-result-kicker">
            AI 기반 활동 추천 결과
          </p>
          <h2 id="recommendation-title">
            {result.recommendedExperienceTitle}
          </h2>
        </div>
        {experience || onClose ? (
          <div className="recommendation-result-header-actions">
            {experience ? (
              <Link
                href={`/experiences/${experience.id}`}
                className="button button-secondary"
              >
                <ExternalLink className="button-icon" aria-hidden="true" />
                활동
              </Link>
            ) : null}
            {onClose ? (
              <button
                className="dashboard-detail-close"
                type="button"
                onClick={onClose}
                aria-label="추천 기록 상세 닫기"
              >
                <X aria-hidden="true" />
              </button>
            ) : null}
          </div>
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

      {hasRequirements ? (
        <div className="detail-section recommendation-requirements-section">
          <h3>추출한 요구사항</h3>
          {requirements.intent ? (
            <p className="recommendation-requirements-intent">
              {requirements.intent}
            </p>
          ) : null}
          <div className="recommendation-requirements-grid">
            {hasListContent(requirements.requiredCompetencies) ? (
              <div>
                <h4>필수 역량</h4>
                <div className="experience-tags">
                  {requirements.requiredCompetencies.map((item, index) => (
                    <span key={`required-${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {hasListContent(requirements.preferredCompetencies) ? (
              <div>
                <h4>우대 역량</h4>
                <div className="experience-tags">
                  {requirements.preferredCompetencies.map((item, index) => (
                    <span key={`preferred-${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {hasListContent(requirements.keywords) ? (
              <div>
                <h4>키워드</h4>
                <div className="experience-tags">
                  {requirements.keywords.map((item, index) => (
                    <span key={`keyword-${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {hasListContent(requirements.constraints) ? (
              <div>
                <h4>제약</h4>
                <ul className="recommendation-compact-list">
                  {requirements.constraints.map((item, index) => (
                    <li key={`constraint-${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="detail-section recommendation-matches-section">
        <h3>추천 경험 Top {matches.length}</h3>
        <div className="recommendation-match-list">
          {matches.map((match) => {
            const matchedExperience = experiencesById.get(match.experienceId);

            return (
              <article
                className="recommendation-match-card"
                key={`${match.rank}-${match.experienceId}`}
              >
                <div className="recommendation-match-header">
                  <div>
                    <span className="recommendation-match-rank">
                      {match.rank}순위
                    </span>
                    <h4>{match.experienceTitle}</h4>
                  </div>
                  <span
                    className="recommendation-fit-badge"
                    data-fit-level={match.fitLevel}
                  >
                    {FIT_LEVEL_LABELS[match.fitLevel]} · {match.score}
                  </span>
                </div>

                <p>{match.matchReason}</p>

                {hasListContent(match.relatedCompetencies) ? (
                  <div className="experience-tags">
                    {match.relatedCompetencies.map((tag, index) => (
                      <span key={`${match.experienceId}-tag-${tag}-${index}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="recommendation-match-details">
                  <div>
                    <h5>매칭 근거</h5>
                    {hasListContent(match.matchedEvidence) ? (
                      <ul className="recommendation-compact-list">
                        {match.matchedEvidence.map((item, index) => (
                          <li
                            key={`${match.experienceId}-evidence-${index}`}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">
                        확인된 근거가 적어 원본 경험을 함께 검토해 주세요.
                      </p>
                    )}
                  </div>

                  <div>
                    <h5>부족한 근거</h5>
                    {hasListContent(match.missingEvidence) ? (
                      <ul className="recommendation-compact-list">
                        {match.missingEvidence.map((item, index) => (
                          <li key={`${match.experienceId}-missing-${index}`}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">뚜렷한 부족 근거 없음</p>
                    )}
                  </div>

                  <div>
                    <h5>과장 주의점</h5>
                    {hasListContent(match.overclaimRisks) ? (
                      <ul className="recommendation-compact-list is-risk">
                        {match.overclaimRisks.map((item, index) => (
                          <li key={`${match.experienceId}-risk-${index}`}>
                            <AlertTriangle aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">기록 밖 사실 추가만 피하면 됩니다.</p>
                    )}
                  </div>
                </div>

                <div className="recommendation-match-angle">
                  <h5>활용 각도</h5>
                  <p>{match.suggestedAngle}</p>
                </div>

                {matchedExperience ? (
                  <Link
                    href={`/experiences/${matchedExperience.id}`}
                    className="recommendation-match-link"
                  >
                    활동 보기
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      <div className="detail-section recommendation-legacy-summary">
        <h3>1순위 요약</h3>
        <p>{result.reason}</p>
        {hasListContent(result.relatedTags) ? (
          <div className="experience-tags">
            {result.relatedTags.map((tag, index) => (
              <span key={`${tag}-${index}`}>{tag}</span>
            ))}
          </div>
        ) : null}
        <p>{result.highlightedAchievement}</p>
        <p>{result.usageDirection}</p>
      </div>

      <div className="detail-section">
        <div className="recommendation-section-heading">
          <h3>참고 문장</h3>
          <CopyButton
            className="button button-secondary"
            content={result.draftSentence}
            onCopiedChange={(copied) =>
              setCopyStatus(copied ? "success" : "idle")
            }
            onCopyError={() => setCopyStatus("failed")}
          />
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
