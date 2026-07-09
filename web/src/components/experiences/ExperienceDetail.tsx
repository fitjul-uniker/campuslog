"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, PenLine, Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type ExperienceDetailProps = {
  experience: Experience;
  analysis?: ExperienceAnalysis | null;
  onDelete: () => void;
};

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function ExperienceDetail({
  experience,
  analysis,
  onDelete,
}: ExperienceDetailProps) {
  const hasBeenEdited = experience.createdAt !== experience.updatedAt;

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
            <p>{analysis.summary}</p>
            <div className="experience-tags">
              {analysis.competencyTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted-text">아직 AI 분석 결과가 없습니다.</p>
        )}
      </div>

      <div className="panel-actions detail-actions">
        <Link
          href={`/experiences/${experience.id}/edit`}
          className="button button-primary"
        >
          <PenLine className="button-icon" aria-hidden="true" />
          수정
        </Link>
        <Link
          href={`/experiences/${experience.id}/analysis`}
          className="button button-secondary"
        >
          <BarChart3 className="button-icon" aria-hidden="true" />
          {analysis ? "분석 결과 보기" : "분석 상태 보기"}
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
