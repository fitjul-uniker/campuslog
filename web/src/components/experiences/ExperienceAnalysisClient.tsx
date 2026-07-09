"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import {
  getAnalysisByExperienceId,
  getExperienceById,
} from "@/lib/storage";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type ExperienceAnalysisClientProps = {
  id: string;
};

export function ExperienceAnalysisClient({ id }: ExperienceAnalysisClientProps) {
  const [experience, setExperience] = useState<Experience | null | undefined>(
    undefined,
  );
  const [analysis, setAnalysis] = useState<ExperienceAnalysis | null>(null);

  useEffect(() => {
    setExperience(getExperienceById(id));
    setAnalysis(getAnalysisByExperienceId(id));
  }, [id]);

  if (experience === undefined) {
    return (
      <div className="page-stack">
        <section className="placeholder-panel">
          <p className="muted-text">분석 상태를 불러오는 중입니다.</p>
        </section>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="page-stack">
        <EmptyState
          title="경험을 찾을 수 없습니다"
          description="삭제되었거나 저장소에서 불러오지 못한 경험입니다."
          icon={<BookOpenText />}
          primaryAction={{
            href: "/",
            label: "대시보드로 돌아가기",
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">AI 경험 분석 결과</p>
          <h1>분석 결과</h1>
          <p className="page-description">
            특정 활동 경험에 연결된 요약, 역량 태그, 키워드를 확인합니다.
          </p>
        </div>
      </section>

      <section className="detail-panel" aria-labelledby="analysis-title">
        <div className="detail-header">
          <div>
            <p className="experience-meta">{experience.title}</p>
            <h2 id="analysis-title">
              {analysis ? "저장된 분석 결과" : "아직 분석 결과가 없습니다"}
            </h2>
          </div>
          <StatusBadge status={experience.analysisStatus} />
        </div>

        {analysis ? (
          <>
            <div className="detail-section">
              <h3>경험 요약</h3>
              <p>{analysis.summary}</p>
            </div>
            <div className="detail-section">
              <h3>핵심 역량 태그</h3>
              <div className="experience-tags">
                {analysis.competencyTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <div className="detail-section">
              <h3>주요 성과</h3>
              <ul className="plain-list">
                {analysis.achievements.map((achievement) => (
                  <li key={achievement}>{achievement}</li>
                ))}
              </ul>
            </div>
            <div className="detail-section">
              <h3>활용 가능한 키워드</h3>
              <div className="experience-tags">
                {analysis.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </div>
            <p className="muted-text">
              분석 생성일 {formatDateTime(analysis.generatedAt)}
            </p>
          </>
        ) : (
          <div className="analysis-empty">
            <p>
              이번 PR에서는 AI 분석 API를 연결하지 않아 분석 결과 생성은 준비
              상태로 남겨둡니다.
            </p>
          </div>
        )}

        <div className="panel-actions">
          <Link href={`/experiences/${experience.id}`} className="button button-primary">
            <ArrowLeft className="button-icon" aria-hidden="true" />
            활동 경험 상세로 돌아가기
          </Link>
          <Link href="/" className="button button-secondary">
            대시보드로 돌아가기
          </Link>
          <Link href="/recommend" className="button button-ghost">
            <Sparkles className="button-icon" aria-hidden="true" />
            AI 추천
          </Link>
        </div>
      </section>
    </div>
  );
}
