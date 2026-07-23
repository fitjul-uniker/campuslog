"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ExternalLink,
  PenLine,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { RelatedLinkFavicon } from "@/components/common/RelatedLinkFavicon";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AIProcessingPanel } from "@/components/ai/AIProcessingPanel";
import { BorderBeamButton } from "@/components/ui/BorderBeamButton";
import {
  getRelatedLinkHostname,
  normalizeRelatedLinkUrl,
} from "@/lib/relatedLinks";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

export const DASHBOARD_EXPERIENCE_DETAIL_ID = "dashboard-experience-detail";

type DashboardExperienceDetailProps = {
  experience: Experience;
  analysis?: ExperienceAnalysis | null;
  variant?: "inline" | "fullscreen";
  onClose?: () => void;
  onAnalyze?: () => void;
  onOpenAnalysis?: (trigger: HTMLButtonElement) => void;
  isAnalysisOpen?: boolean;
  onDelete?: () => void;
  isAnalyzing?: boolean;
  analysisError?: string;
};

export function DashboardExperienceDetail({
  experience,
  analysis,
  variant = "inline",
  onClose,
  onAnalyze,
  onOpenAnalysis,
  isAnalysisOpen = false,
  onDelete,
  isAnalyzing = false,
  analysisError = "",
}: DashboardExperienceDetailProps) {
  const shouldReduceMotion = useReducedMotion();
  const titleId = `${DASHBOARD_EXPERIENCE_DETAIL_ID}-title`;
  const isFullscreen = variant === "fullscreen";
  const needsFreshAnalysis = Boolean(
    analysis && analysis.sourceExperienceUpdatedAt !== experience.updatedAt,
  );
  const canRequestAnalysis =
    Boolean(onAnalyze) && (!analysis || needsFreshAnalysis);
  const analyzeLabel = needsFreshAnalysis ? "다시 분석하기" : "AI 분석 요청";
  const SectionHeading = isFullscreen ? "h2" : "h3";
  const sourceCharacterCount =
    experience.title.length +
    experience.role.length +
    experience.description.length +
    experience.achievements.length;

  const handleDelete = () => {
    if (!onDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      "이 경험과 연결된 분석 결과, 추천 결과가 함께 삭제됩니다. 삭제할까요?",
    );

    if (shouldDelete) {
      onDelete();
    }
  };

  const editAction = (
    <Link
      href={`/experiences/${experience.id}/edit`}
      className="dashboard-detail-action"
    >
      <PenLine aria-hidden="true" />
      수정
    </Link>
  );
  const analysisAction = canRequestAnalysis ? (
    <BorderBeamButton
      className="dashboard-detail-action dashboard-analysis-request"
      wrapperClassName="dashboard-analysis-request-wrap"
      colorVariant="colorful"
      type="button"
      onClick={onAnalyze}
      disabled={isAnalyzing}
      aria-busy={isAnalyzing}
    >
      <Sparkles aria-hidden="true" />
      {isAnalyzing ? "분석 중..." : analyzeLabel}
    </BorderBeamButton>
  ) : analysis && isFullscreen ? (
    <Link
      href={`/experiences/${experience.id}/analysis`}
      className="dashboard-detail-action"
    >
      <BarChart3 aria-hidden="true" />
      AI 분석 결과
    </Link>
  ) : analysis && onOpenAnalysis ? (
    <button
      type="button"
      className="dashboard-detail-action"
      onClick={(event) => onOpenAnalysis(event.currentTarget)}
      aria-expanded={isAnalysisOpen}
      aria-controls="dashboard-analysis-split-panel"
    >
      <BarChart3 aria-hidden="true" />
      AI 분석 결과
    </button>
  ) : null;

  return (
    <motion.section
      layout
      id={DASHBOARD_EXPERIENCE_DETAIL_ID}
      className={`dashboard-experience-detail${isFullscreen ? " is-fullscreen" : ""}`}
      aria-labelledby={titleId}
      role={isFullscreen ? undefined : "complementary"}
      initial={
        isFullscreen || shouldReduceMotion
          ? false
          : { opacity: 0, x: 24, scale: 0.985 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={
        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.99 }
      }
      transition={{
        duration: shouldReduceMotion ? 0.12 : 0.26,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="dashboard-detail-header">
        <div>
          {!isFullscreen ? (
            <div className="dashboard-detail-status">
              <StatusBadge status={experience.analysisStatus} />
            </div>
          ) : null}
          {isFullscreen ? (
            <h1 id={titleId}>{experience.title}</h1>
          ) : (
            <h2 id={titleId}>{experience.title}</h2>
          )}
          {isFullscreen ? (
            <div className="dashboard-detail-status">
              <StatusBadge status={experience.analysisStatus} />
            </div>
          ) : null}
        </div>
        {!isFullscreen && onClose ? (
          <button
            className="dashboard-detail-close"
            type="button"
            onClick={onClose}
            aria-label="활동 상세 닫기"
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <dl className="dashboard-detail-meta">
        <div>
          <dt>활동 기간</dt>
          <dd>{experience.period}</dd>
        </div>
        <div>
          <dt>역할</dt>
          <dd>{experience.role}</dd>
        </div>
      </dl>

      <div className="dashboard-detail-content">
        <section>
          <SectionHeading>활동 내용</SectionHeading>
          <p>{experience.description}</p>
        </section>

        <section>
          <SectionHeading>성과</SectionHeading>
          <p className={experience.achievements ? undefined : "is-muted"}>
            {experience.achievements || "아직 기록한 성과가 없습니다."}
          </p>
        </section>

        <section>
          <SectionHeading>관련 링크</SectionHeading>
          {experience.relatedLinks.length > 0 ? (
            <ul className="dashboard-detail-links">
              {experience.relatedLinks.map((link, index) => {
                const normalizedUrl = normalizeRelatedLinkUrl(link.url);
                const hostname = getRelatedLinkHostname(link.url);
                const description =
                  link.description || hostname || link.url || "관련 링크";
                const address = normalizedUrl || link.url;
                const linkContent = (
                  <>
                    <RelatedLinkFavicon url={link.url} />
                    <span className="dashboard-detail-link-copy">
                      <strong>{description}</strong>
                      <span title={address}>{address}</span>
                    </span>
                    {normalizedUrl ? (
                      <ExternalLink
                        className="dashboard-detail-link-external"
                        aria-hidden="true"
                      />
                    ) : null}
                  </>
                );

                return (
                  <li key={`${link.url}-${index}`}>
                    {normalizedUrl ? (
                      <a
                        href={normalizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${description} 새 창에서 열기`}
                      >
                        {linkContent}
                      </a>
                    ) : (
                      <span>{linkContent}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="is-muted">등록된 링크가 없습니다.</p>
          )}
        </section>

        {!isAnalysisOpen ? (
          <section>
            <SectionHeading>AI 분석</SectionHeading>
            {analysis ? (
              <>
                {needsFreshAnalysis ? (
                  <p className="dashboard-detail-analysis-note">
                    활동 내용이 수정되어 아래 분석은 최신 기록을 반영하지 않을 수
                    있습니다.
                  </p>
                ) : null}
                <p>{analysis.summary}</p>
                {analysis.keywords.length > 0 ? (
                  <div className="dashboard-detail-tags" aria-label="활용 키워드">
                    {analysis.keywords.slice(0, 4).map((keyword, index) => (
                      <span key={`${keyword}-${index}`}>{keyword}</span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="is-muted">
                아직 분석 결과가 없습니다. 아래 버튼에서 바로 분석을 요청할 수
                있습니다.
              </p>
            )}
          </section>
        ) : null}
      </div>

      {isAnalyzing ? (
        <AIProcessingPanel
          className="analysis-ai-processing"
          title="경험을 분석하고 있어요"
          description="기록에 없는 사실은 만들지 않고 요약, STAR, 주요 성과와 부족 정보를 정리합니다."
          contextItems={[
            { label: "분석 대상", value: experience.title },
            { label: "원본 분량", value: `${sourceCharacterCount}자` },
            {
              label: "분석 방식",
              value: analysis ? "기존 결과를 유지하며 재분석" : "새 분석 생성",
            },
          ]}
          steps={[
            "활동 내용과 성과 단서를 확인하고 있어요.",
            "STAR 구조로 다시 활용할 정보를 나누고 있어요.",
            "부족한 정보와 키워드를 정리하고 있어요.",
          ]}
          messages={[
            {
              afterMs: 0,
              text: "경험 기록의 핵심 내용을 살펴보고 있어요.",
            },
            {
              afterMs: 7_000,
              text: "STAR 구조와 주요 성과를 정리하고 있어요.",
            },
            {
              afterMs: 16_000,
              text: "부족한 정보와 활용 키워드를 확인하고 있어요.",
            },
          ]}
          skeletonVariant="analysis"
          longWaitThresholdMs={20_000}
          longWaitMessage="경험 원문이나 보완 답변이 길면 분석 결과 형식 검증에 시간이 더 걸릴 수 있어요."
        />
      ) : null}

      {analysisError ? (
        <p className="dashboard-detail-analysis-error" role="alert">
          {analysisError}
        </p>
      ) : null}

      <div className="dashboard-detail-actions">
        {isFullscreen ? (
          <>
            <Link href="/experiences" className="dashboard-detail-action">
              <ArrowLeft aria-hidden="true" />
              나의 활동
            </Link>
            {analysisAction}
            {editAction}
            {onDelete ? (
              <button
                className="dashboard-detail-action dashboard-detail-delete"
                type="button"
                onClick={handleDelete}
              >
                <Trash2 aria-hidden="true" />
                삭제
              </button>
            ) : null}
          </>
        ) : (
          <>
            <Link
              href={`/experiences/${experience.id}`}
              className="dashboard-detail-action dashboard-detail-action-primary"
            >
              활동 상세 보기
              <ArrowRight aria-hidden="true" />
            </Link>
            {editAction}
            {analysisAction}
          </>
        )}
      </div>
    </motion.section>
  );
}
