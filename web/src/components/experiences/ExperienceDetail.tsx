"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  PenLine,
  Sparkles,
  Trash2,
} from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type ExperienceDetailProps = {
  experience: Experience;
  analysis?: ExperienceAnalysis | null;
  onDelete: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisError?: string;
};

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function ExperienceDetail({
  experience,
  analysis,
  onDelete,
  onAnalyze,
  isAnalyzing,
  analysisError,
}: ExperienceDetailProps) {
  const hasBeenEdited = experience.createdAt !== experience.updatedAt;
  const canAnalyze =
    !analysis || experience.analysisStatus === "needs_reanalysis";
  const analyzeLabel =
    experience.analysisStatus === "needs_reanalysis"
      ? "다시 분석하기"
      : "AI 분석 요청";

  function handleDelete() {
    const shouldDelete = window.confirm(
      "이 경험과 연결된 분석 결과, 추천 결과가 함께 삭제됩니다. 삭제할까요?",
    );

    if (shouldDelete) {
      onDelete();
    }
  }

  return (
    <section className="detail-panel" aria-labelledby="experience-detail-title">
      <div className="detail-header">
        <div>
          <p className="experience-meta">
            {experience.period} · {experience.role}
          </p>
          <h2 id="experience-detail-title">{experience.title}</h2>
        </div>
        <StatusBadge status={experience.analysisStatus} />
      </div>

      <dl className="meta-grid">
        <div>
          <dt>생성일</dt>
          <dd>{formatDateTime(experience.createdAt)}</dd>
        </div>
        {hasBeenEdited ? (
          <div>
            <dt>수정일</dt>
            <dd>{formatDateTime(experience.updatedAt)}</dd>
          </div>
        ) : null}
        <div>
          <dt>분석 상태</dt>
          <dd>
            <StatusBadge status={experience.analysisStatus} />
          </dd>
        </div>
      </dl>

      <div className="detail-section">
        <h3>내용</h3>
        <p>{experience.description}</p>
      </div>

      <div className="detail-section">
        <h3>성과</h3>
        {experience.achievements ? (
          <p>{experience.achievements}</p>
        ) : (
          <p className="muted-text">기록된 성과가 없습니다.</p>
        )}
      </div>

      <div className="detail-section">
        <h3>관련 링크</h3>
        {experience.relatedLinks.length > 0 ? (
          <ul className="link-list">
            {experience.relatedLinks.map((link) => (
              <li key={link}>
                {isExternalUrl(link) ? (
                  <a href={link} target="_blank" rel="noreferrer">
                    {link}
                  </a>
                ) : (
                  <span>{link}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">기록된 링크가 없습니다.</p>
        )}
      </div>

      <div className="detail-section">
        <h3>AI 분석</h3>
        {analysis ? (
          <div className="analysis-summary">
            {experience.analysisStatus === "needs_reanalysis" ? (
              <p className="analysis-helper">
                경험이 분석 이후 수정되어 최신 내용 기준 재분석이 필요합니다.
              </p>
            ) : null}
            <p>{analysis.summary}</p>
            {analysis.competencyTags.length > 0 ? (
              <div className="experience-tags">
                {analysis.competencyTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : (
              <p className="muted-text">
                입력 내용에서 근거가 확인된 핵심 역량 태그가 없습니다.
              </p>
            )}
          </div>
        ) : (
          <p className="muted-text">아직 AI 분석 결과가 없습니다.</p>
        )}
        {analysisError ? (
          <p className="form-error" role="alert">
            {analysisError}
          </p>
        ) : null}
      </div>

      <div className="panel-actions detail-actions">
        {canAnalyze ? (
          <button
            className="button button-primary"
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
          >
            <Sparkles className="button-icon" aria-hidden="true" />
            {isAnalyzing ? "분석 중..." : analyzeLabel}
          </button>
        ) : null}
        {analysis ? (
          <Link
            href={`/experiences/${experience.id}/analysis`}
            className="button button-secondary"
          >
            <BarChart3 className="button-icon" aria-hidden="true" />
            분석 결과 보기
          </Link>
        ) : null}
        <Link
          href={`/experiences/${experience.id}/edit`}
          className={
            canAnalyze ? "button button-secondary" : "button button-primary"
          }
        >
          <PenLine className="button-icon" aria-hidden="true" />
          수정
        </Link>
        <Link href="/" className="button button-ghost">
          <ArrowLeft className="button-icon" aria-hidden="true" />
          대시보드
        </Link>
        <button
          className="button button-danger"
          type="button"
          onClick={handleDelete}
        >
          <Trash2 className="button-icon" aria-hidden="true" />
          삭제
        </button>
      </div>
    </section>
  );
}
