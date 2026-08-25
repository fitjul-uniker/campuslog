"use client";

import { ArrowLeft, BookOpenText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { LoadingStatus } from "@/components/common/LoadingState";
import { DashboardExperienceDetail } from "@/components/experiences/DashboardExperienceDetail";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useExperienceAnalysisTask } from "@/hooks/use-experience-analysis-task";
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
  const [analysisError, setAnalysisError] = useState("");
  const analysisTask = useExperienceAnalysisTask({
    experienceId: id,
    experienceTitle: experience?.title ?? "경험",
    sourceHref: `/experiences/${id}`,
  });
  const isAnalyzing = analysisTask.isPending;
  const analysisStatusMessage = analysisTask.task?.statusMessage ?? "";
  const currentAnalysisTask = analysisTask.task;
  const dismissAnalysisTask = analysisTask.dismiss;

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
    const task = currentAnalysisTask;

    if (task?.mode === "background") {
      return;
    }

    if (task?.status === "success" && task.result) {
      setAnalysis(task.result.analysis);
      setExperience(task.result.experience);
      dismissAnalysisTask();
      router.push(`/experiences/${id}/analysis`);
      return;
    }

    if (task?.status === "error") {
      setAnalysisError(
        task.isCancelled
          ? "AI 분석 요청을 취소했습니다. 기존 기록과 분석 결과는 그대로 유지했어요."
          : task.errorMessage,
      );
    }
  }, [currentAnalysisTask, dismissAnalysisTask, id, router]);

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

  function handleAnalyze() {
    if (!experience || isAnalyzing) {
      return;
    }

    setAnalysisError("");
    void analysisTask.start();
  }

  function handleCancelAnalysis() {
    analysisTask.cancel();
  }

  function handleBackgroundAnalysis() {
    analysisTask.sendToBackground();
    router.push("/dashboard");
  }

  if (experience === undefined) {
    return (
      <LoadingStatus message="저장된 경험을 불러오는 중입니다." />
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
    <div className="product-page product-detail-page experience-detail-page sub-page">
      <div className="standalone-page-intro">
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
        <header className="sub-page-heading experience-detail-page-heading">
          <div>
            <h1>경험 상세</h1>
            <p className="page-description">
              저장한 경험의 활동 내용과 성과, AI 분석을 확인합니다.
            </p>
          </div>
          <div className="header-actions experience-detail-page-header-actions">
            <Link href="/experiences" className="button button-secondary">
              <ArrowLeft className="button-icon" aria-hidden="true" />
              나의 활동
            </Link>
          </div>
        </header>
      </div>
      <DashboardExperienceDetail
        experience={experience}
        analysis={analysis}
        variant="fullscreen"
        onDelete={handleDelete}
        onAnalyze={handleAnalyze}
        onCancelAnalysis={handleCancelAnalysis}
        onBackgroundAnalysis={handleBackgroundAnalysis}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        analysisStatusMessage={analysisStatusMessage}
      />
    </div>
  );
}
