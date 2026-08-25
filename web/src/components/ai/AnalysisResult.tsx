"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { AnalysisGapAnswerList } from "@/components/ai/AnalysisGapAnswerList";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useTransientScrollbar } from "@/hooks/use-transient-scrollbar";
import { formatDateTime } from "@/lib/date";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type AnalysisResultProps = {
  experience: Experience;
  analysis: ExperienceAnalysis;
  variant?: "default" | "embedded";
  footer?: ReactNode;
};

export function AnalysisResult({
  experience,
  analysis,
  variant = "default",
  footer,
}: AnalysisResultProps) {
  const isSourceOutdated =
    analysis.sourceExperienceUpdatedAt !== experience.updatedAt;
  const hasLegacyReanalysisStatus =
    experience.analysisStatus === "needs_reanalysis" && !isSourceOutdated;
  const starItems = [
    ["상황", analysis.star.situation],
    ["과제", analysis.star.task],
    ["행동", analysis.star.action],
    ["결과", analysis.star.result],
  ] as const;
  const hasStar = starItems.some(([, value]) => value);
  const isEmbedded = variant === "embedded";
  const handleTransientScroll = useTransientScrollbar<HTMLDivElement>();
  const analysisNotice = isSourceOutdated
    ? {
        variant: "warning" as const,
        message:
          "원본 경험이 분석 이후 수정되어 업데이트가 필요합니다. 보완 답변은 추천에 바로 반영되지만, 요약과 STAR까지 최신화하려면 다시 분석하기를 사용하세요.",
      }
    : hasLegacyReanalysisStatus
      ? {
          variant: "info" as const,
          message:
            "이전 보완 답변 저장으로 재분석 필요 상태가 남아 있을 수 있습니다. 원본 경험이 바뀌지 않았다면 추천에는 저장된 보완 답변이 함께 사용됩니다.",
        }
      : null;

  const content = (
    <>
      {!isEmbedded ? (
        <div className="detail-header analysis-result-header">
          <div>
            <div className="analysis-result-kicker-row">
              <span className="analysis-result-generated-at">
                {formatDateTime(analysis.generatedAt)}
              </span>
            </div>
            <h2 id="analysis-result-title">{experience.title}</h2>
          </div>
          <StatusBadge status={experience.analysisStatus} />
        </div>
      ) : null}

      {analysisNotice ? (
        <div
          className={
            analysisNotice.variant === "warning"
              ? "analysis-notice"
              : "analysis-info-notice"
          }
          role="status"
        >
          {analysisNotice.variant === "warning" ? (
            <AlertTriangle aria-hidden="true" />
          ) : null}
          <p>{analysisNotice.message}</p>
        </div>
      ) : null}

      <div className="detail-section">
        <h3>경험 요약</h3>
        <p>{analysis.summary}</p>
      </div>

      <div className="detail-section">
        <h3>STAR 구조</h3>
        {hasStar ? (
          <dl className="analysis-star-grid">
            {starItems.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "현재 기록만으로는 구분하기 어렵습니다."}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted-text">
            현재 기록만으로 STAR 구조를 안정적으로 나누기 어렵습니다.
          </p>
        )}
      </div>

      <div className="detail-section">
        <h3>주요 성과</h3>
        {analysis.achievements.length > 0 ? (
          <ul className="plain-list">
            {analysis.achievements.map((achievement) => (
              <li key={achievement}>{achievement}</li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">
            입력 내용에서 확인된 주요 성과가 없습니다.
          </p>
        )}
      </div>

      <div className="detail-section">
        <h3>부족한 정보</h3>
        <AnalysisGapAnswerList experience={experience} analysis={analysis} />
      </div>

      <div className="detail-section">
        <h3>활용 가능한 키워드</h3>
        {analysis.keywords.length > 0 ? (
          <div className="experience-tags">
            {analysis.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            입력 내용에서 활용 가능한 키워드가 확인되지 않았습니다.
          </p>
        )}
      </div>

      {footer ? <div className="analysis-result-footer">{footer}</div> : null}
    </>
  );

  return (
    <section
      className={`detail-panel analysis-result ${
        isEmbedded
          ? "is-embedded liquid-content-plate"
          : "liquid-section"
      }`}
      aria-label={isEmbedded ? "상세 AI 분석 결과" : undefined}
      aria-labelledby={isEmbedded ? undefined : "analysis-result-title"}
    >
      {isEmbedded ? (
        content
      ) : (
        <div
          className="analysis-result-scroll"
          data-transient-scrollbar="true"
          data-scroll-page-intro="true"
          onScroll={handleTransientScroll}
        >
          {content}
        </div>
      )}
    </section>
  );
}
