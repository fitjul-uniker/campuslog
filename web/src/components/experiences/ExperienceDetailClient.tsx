"use client";

import { BookOpenText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ExperienceDetail } from "@/components/experiences/ExperienceDetail";
import { requestExperienceAnalysis } from "@/lib/analysisApi";
import {
  deleteExperience,
  getAnalysisByExperienceId,
  getExperienceById,
  saveAnalysisResult,
} from "@/lib/storage";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type ExperienceDetailClientProps = {
  id: string;
};

export function ExperienceDetailClient({ id }: ExperienceDetailClientProps) {
  const router = useRouter();
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

  function handleDelete() {
    deleteExperience(id);
    router.push("/dashboard");
  }

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

    setAnalysis(savedAnalysis);
    setExperience(getExperienceById(id));
    setIsAnalyzing(false);
    router.push(`/experiences/${id}/analysis`);
  }

  if (experience === undefined) {
    return (
      <div className="page-stack">
        <section className="placeholder-panel">
          <p className="muted-text">저장된 경험을 불러오는 중입니다.</p>
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
            href: "/dashboard",
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
          <p className="eyebrow">활동 경험 상세</p>
          <h1>경험 상세</h1>
          <p className="page-description">
            저장된 경험의 원본 내용과 분석 상태를 확인합니다.
          </p>
        </div>
      </section>

      <ExperienceDetail
        experience={experience}
        analysis={analysis}
        onDelete={handleDelete}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
      />
    </div>
  );
}
