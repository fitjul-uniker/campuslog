"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenText, RefreshCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AIProcessingPanel } from "@/components/ai/AIProcessingPanel";
import { AnalysisResult } from "@/components/ai/AnalysisResult";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AnimatedGradientActionButton } from "@/components/ui/AnimatedGradientActionButton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useExperienceAnalysisTask } from "@/hooks/use-experience-analysis-task";
import { useTransientScrollbar } from "@/hooks/use-transient-scrollbar";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type ExperienceAnalysisClientProps = {
  id: string;
};

export function ExperienceAnalysisClient({ id }: ExperienceAnalysisClientProps) {
  const router = useRouter();
  const handleTransientScroll = useTransientScrollbar<HTMLDivElement>();
  const [experience, setExperience] = useState<Experience | null | undefined>(
    undefined,
  );
  const [analysis, setAnalysis] = useState<ExperienceAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const analysisTask = useExperienceAnalysisTask({
    experienceId: id,
    experienceTitle: experience?.title ?? "경험",
    sourceHref: `/experiences/${id}/analysis`,
  });
  const currentAnalysisTask = analysisTask.task;
  const dismissAnalysisTask = analysisTask.dismiss;
  const isAnalyzing = analysisTask.isPending;
  const analysisStatusMessage = currentAnalysisTask?.statusMessage ?? "";

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
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

    loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (currentAnalysisTask?.mode === "background") {
      return;
    }

    if (currentAnalysisTask?.status === "success" && currentAnalysisTask.result) {
      setExperience(currentAnalysisTask.result.experience);
      setAnalysis(currentAnalysisTask.result.analysis);
      dismissAnalysisTask();
      return;
    }

    if (currentAnalysisTask?.status === "error") {
      setAnalysisError(
        currentAnalysisTask.isCancelled
          ? "AI 분석 요청을 취소했습니다. 기존 기록과 분석 결과는 그대로 유지했어요."
          : currentAnalysisTask.errorMessage,
      );
    }
  }, [currentAnalysisTask, dismissAnalysisTask]);

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

  const sourceCharacterCount = experience
    ? experience.title.length +
      experience.role.length +
      experience.description.length +
      experience.achievements.length
    : 0;

  const analysisProcessingPanel = experience ? (
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
      statusMessage={analysisStatusMessage || undefined}
      skeletonVariant="analysis"
      longWaitThresholdMs={20_000}
      longWaitMessage="경험 원문이나 보완 답변이 길면 분석 결과 형식 검증에 시간이 더 걸릴 수 있어요."
      canCancel
      onCancel={handleCancelAnalysis}
      onBackground={handleBackgroundAnalysis}
    />
  ) : null;

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
            href: "/experiences",
            label: "나의 활동으로 돌아가기",
          }}
        />
      </div>
    );
  }

  const pageHeader = (
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
            <BreadcrumbLink href={`/experiences/${experience.id}`}>
              경험 상세
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AI 분석</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="page-header sub-page-heading">
        <div>
          <h1>분석 결과</h1>
          <p className="page-description">
            특정 활동 경험에 연결된 요약, STAR, 성과와 보완할 정보를
            확인합니다.
          </p>
        </div>
        <div className="header-actions analysis-page-header-actions">
          <Link
            href={`/experiences/${experience.id}`}
            className="button button-secondary"
          >
            <ArrowLeft className="button-icon" aria-hidden="true" />
            활동 경험 상세로 돌아가기
          </Link>
          <Link href="/experiences" className="button button-secondary">
            나의 활동으로 돌아가기
          </Link>
        </div>
      </section>
    </div>
  );

  return (
    <div className="page-stack sub-page analysis-detail-page">
      {pageHeader}
      {analysis ? (
        <>
          <AnalysisResult
            experience={experience}
            analysis={analysis}
            footer={
              <>
                {analysisError ? (
                  <p className="form-error" role="alert">
                    {analysisError}
                  </p>
                ) : null}
                <div className="panel-actions analysis-page-footer-actions">
                  <AnimatedGradientActionButton
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    aria-busy={isAnalyzing}
                    icon={<RefreshCcw />}
                  >
                    {isAnalyzing ? "분석 중..." : "다시 분석하기"}
                  </AnimatedGradientActionButton>
                </div>
              </>
            }
          />
          {isAnalyzing ? analysisProcessingPanel : null}
        </>
      ) : (
        <>
          <section
            className="detail-panel analysis-result liquid-section"
            aria-labelledby="analysis-title"
          >
            <div
              className="analysis-result-scroll"
              data-transient-scrollbar="true"
              data-scroll-page-intro="true"
              onScroll={handleTransientScroll}
            >
              <div className="detail-header">
                <div>
                  <p className="experience-meta">{experience.title}</p>
                  <h2 id="analysis-title">아직 분석 결과가 없습니다</h2>
                </div>
                <StatusBadge status={experience.analysisStatus} />
              </div>

              <div className="analysis-empty">
                <p>
                  이 경험에 저장된 AI 분석 결과가 없습니다. 상세 화면으로
                  돌아가거나 여기에서 바로 분석을 요청할 수 있습니다.
                </p>
              </div>

              {isAnalyzing ? analysisProcessingPanel : null}

              {analysisError ? (
                <p className="form-error" role="alert">
                  {analysisError}
                </p>
              ) : null}

              <div className="panel-actions analysis-page-footer-actions">
                <AnimatedGradientActionButton
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  aria-busy={isAnalyzing}
                  icon={<Sparkles />}
                >
                  {isAnalyzing ? "분석 중..." : "AI 분석 요청"}
                </AnimatedGradientActionButton>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
