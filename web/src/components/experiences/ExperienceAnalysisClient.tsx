"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, RefreshCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { AnalysisResult } from "@/components/ai/AnalysisResult";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { requestExperienceAnalysis } from "@/lib/analysisApi";
import {
  getAnalysisByExperienceId,
  getExperienceById,
  saveAnalysisResult,
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    setExperience(getExperienceById(id));
    setAnalysis(getAnalysisByExperienceId(id));
  }, [id]);

  async function handleAnalyze() {
    if (!experience) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");

    const response = await requestExperienceAnalysis(experience);

    if (!response.ok) {
      setAnalysisError(response.error.message);
      setIsAnalyzing(false);
      return;
    }

    const savedAnalysis = saveAnalysisResult(response.analysis);

    if (!savedAnalysis) {
      setAnalysisError(
        "분석 결과를 저장하지 못했습니다. 경험이 삭제되지 않았는지 확인해주세요.",
      );
      setIsAnalyzing(false);
      return;
    }

    const updatedExperience = getExperienceById(id);

    if (updatedExperience) {
      setExperience(updatedExperience);
    }

    setAnalysis(savedAnalysis);
    setIsAnalyzing(false);
  }

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

      {analysis ? (
        <>
          <AnalysisResult experience={experience} analysis={analysis} />
          {analysisError ? (
            <p className="form-error" role="alert">
              {analysisError}
            </p>
          ) : null}
          <div className="panel-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <RefreshCcw className="button-icon" aria-hidden="true" />
              {isAnalyzing ? "분석 중..." : "다시 분석하기"}
            </button>
            <Link
              href={`/experiences/${experience.id}`}
              className="button button-secondary"
            >
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
        </>
      ) : (
        <section className="detail-panel" aria-labelledby="analysis-title">
          <div className="detail-header">
            <div>
              <p className="experience-meta">{experience.title}</p>
              <h2 id="analysis-title">아직 분석 결과가 없습니다</h2>
            </div>
            <StatusBadge status={experience.analysisStatus} />
          </div>

          <div className="analysis-empty">
            <p>
              이 경험에 저장된 AI 분석 결과가 없습니다. 상세 화면으로 돌아가거나
              여기에서 바로 분석을 요청할 수 있습니다.
            </p>
          </div>

          {analysisError ? (
            <p className="form-error" role="alert">
              {analysisError}
            </p>
          ) : null}

          <div className="panel-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              <Sparkles className="button-icon" aria-hidden="true" />
              {isAnalyzing ? "분석 중..." : "AI 분석 요청"}
            </button>
            <Link
              href={`/experiences/${experience.id}`}
              className="button button-secondary"
            >
              <ArrowLeft className="button-icon" aria-hidden="true" />
              활동 경험 상세로 돌아가기
            </Link>
            <Link href="/" className="button button-ghost">
              대시보드로 돌아가기
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
