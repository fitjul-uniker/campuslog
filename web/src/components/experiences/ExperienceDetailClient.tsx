"use client";

import { BookOpenText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { DashboardExperienceDetail } from "@/components/experiences/DashboardExperienceDetail";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { requestExperienceAnalysis } from "@/lib/analysisApi";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
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
  const [analysisStatusMessage, setAnalysisStatusMessage] = useState("");
  const analysisAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadExperience() {
      try {
        const repository = getCampusLogRepository();
        const [storedExperience, storedAnalysis] = await Promise.all([
          repository.experiences.getById(id),
          repository.analyses.getByExperienceId(id),
        ]);

        if (isMounted) {
          setExperience(storedExperience);
          setAnalysis(storedAnalysis);
        }
      } catch {
        if (isMounted) {
          setExperience(null);
          setAnalysis(null);
        }
      }
    }

    loadExperience();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      analysisAbortControllerRef.current?.abort();
    };
  }, []);

  async function handleDelete() {
    const repository = getCampusLogRepository();
    const didDelete = await repository.experiences.delete(id);

    if (!didDelete) {
      setAnalysisError(
        "경험을 삭제하지 못했습니다. 저장소 상태를 확인한 뒤 다시 시도해 주세요.",
      );
      return;
    }

    router.push("/experiences");
  }

  async function handleAnalyze() {
    if (!experience || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisStatusMessage("");

    const abortController = new AbortController();
    analysisAbortControllerRef.current = abortController;

    const repository = getCampusLogRepository();
    const followups =
      await repository.experienceFollowups.listByExperienceId(experience.id);
    const response = await requestExperienceAnalysis(experience, followups, {
      signal: abortController.signal,
      stream: true,
      onStatus: setAnalysisStatusMessage,
    });

    if (!response.ok) {
      setAnalysisError(
        response.error.code === "REQUEST_CANCELLED"
          ? "AI 분석 요청을 취소했습니다. 기존 기록과 분석 결과는 그대로 유지했어요."
          : response.error.message,
      );
      setIsAnalyzing(false);
      setAnalysisStatusMessage("");
      if (analysisAbortControllerRef.current === abortController) {
        analysisAbortControllerRef.current = null;
      }
      return;
    }

    const savedAnalysis = await repository.analyses.save(response.analysis);

    if (!savedAnalysis) {
      setAnalysisError(
        "분석 결과를 저장하지 못했습니다. 경험이 삭제되지 않았는지 확인해주세요.",
      );
      setIsAnalyzing(false);
      setAnalysisStatusMessage("");
      if (analysisAbortControllerRef.current === abortController) {
        analysisAbortControllerRef.current = null;
      }
      return;
    }

    setAnalysis(savedAnalysis);
    setExperience(await repository.experiences.getById(id));
    setIsAnalyzing(false);
    setAnalysisStatusMessage("");
    if (analysisAbortControllerRef.current === abortController) {
      analysisAbortControllerRef.current = null;
    }
    router.push(`/experiences/${id}/analysis`);
  }

  function handleCancelAnalysis() {
    analysisAbortControllerRef.current?.abort();
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
            href: "/experiences",
            label: "나의 활동으로 돌아가기",
          }}
        />
      </div>
    );
  }

  return (
    <div className="product-page product-detail-page sub-page">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="breadcrumb-brand-link">
              CampusLog
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/experiences">나의 활동</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>경험 상세</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DashboardExperienceDetail
        experience={experience}
        analysis={analysis}
        variant="fullscreen"
        onDelete={handleDelete}
        onAnalyze={handleAnalyze}
        onCancelAnalysis={handleCancelAnalysis}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        analysisStatusMessage={analysisStatusMessage}
      />
    </div>
  );
}
