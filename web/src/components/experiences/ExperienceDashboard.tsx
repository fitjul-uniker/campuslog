"use client";

import Link from "next/link";
import { AlertCircle, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AnimatedExperienceList,
  type MyActivityListItem,
} from "@/components/experiences/AnimatedExperienceList";
import { getTrackedActivityDisplayState } from "@/components/activities/activityViewUtils";
import {
  DASHBOARD_EXPERIENCE_DETAIL_ID,
  DashboardExperienceDetail,
} from "@/components/experiences/DashboardExperienceDetail";
import {
  DASHBOARD_ANALYSIS_SPLIT_PANEL_ID,
  DashboardAnalysisSplitPanel,
} from "@/components/experiences/DashboardAnalysisSplitPanel";
import { DashboardTrackedActivityDetail } from "@/components/experiences/DashboardTrackedActivityDetail";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { useExperienceAnalysisTask } from "@/hooks/use-experience-analysis-task";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  DailyLog,
  Experience,
  ExperienceAnalysis,
  TrackedActivity,
} from "@/lib/types";
import { CountUp } from "@/components/ui/CountUp";
import { GooeyInput } from "@/components/ui/GooeyInput";
import { LoadingState } from "@/components/common/LoadingState";
import { usePinnedItems } from "@/hooks/use-pinned-items";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAIBackgroundTasks } from "@/components/ai/AIBackgroundTaskProvider";

const DASHBOARD_LAYOUT_TRANSITION = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

function createTrackedActivityDeleteConfirmMessage(
  activity: TrackedActivity,
  logCount: number,
): string {
  const deleteTargets = [
    `활동 "${activity.title}"`,
    logCount > 0 ? `연결된 날짜별 기록 ${logCount}개` : "",
    activity.synthesisStatus === "draft_ready" ||
    activity.synthesisStatus === "processing" ||
    activity.synthesisStatus === "failed"
      ? "AI 정리 결과"
      : "",
    activity.generatedExperienceId
      ? "이 활동에서 저장한 나의 활동과 연결된 AI 분석/추천/초안/보완 답변"
      : "",
  ].filter(Boolean);

  return `${deleteTargets.join(", ")}을 함께 삭제할까요? 삭제한 데이터는 복구할 수 없습니다.`;
}

export function ExperienceDashboard() {
  const router = useRouter();
  const { tasks: aiTasks } = useAIBackgroundTasks();
  const experiencePins = usePinnedItems("experience");
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [trackedActivities, setTrackedActivities] = useState<
    TrackedActivity[] | null
  >(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [analysesByExperienceId, setAnalysesByExperienceId] = useState<
    Record<string, ExperienceAnalysis | null>
  >({});
  const [loadError, setLoadError] = useState("");
  const [experienceDeleteError, setExperienceDeleteError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisErrorByExperienceId, setAnalysisErrorByExperienceId] =
    useState<Record<string, string>>({});
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const lastSelectionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const analysisTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileScrollTimerRef = useRef<number | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoadError("");

    try {
      const repository = getCampusLogRepository();
      const [storedExperiences, storedTrackedActivities, storedDailyLogs] =
        await Promise.all([
          repository.experiences.list(),
          repository.trackedActivities.list(),
          repository.dailyLogs.list(),
        ]);
      const activeTrackedActivities = storedTrackedActivities.filter(
        (activity) => activity.status === "active",
      );
      const storedAnalyses = await Promise.all(
        storedExperiences.map(async (experience) => [
          experience.id,
          await repository.analyses.getByExperienceId(experience.id),
        ]),
      );
      setExperiences(storedExperiences);
      setTrackedActivities(activeTrackedActivities);
      setDailyLogs(storedDailyLogs);
      setAnalysesByExperienceId(Object.fromEntries(storedAnalyses));
    } catch {
      setExperiences([]);
      setTrackedActivities([]);
      setDailyLogs([]);
      setAnalysesByExperienceId({});
      setLoadError(
        "저장된 활동 목록을 불러오지 못했습니다. 계정 데이터는 지우지 않았으니 잠시 후 다시 시도해 주세요.",
      );
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    return () => {
      if (mobileScrollTimerRef.current !== null) {
        window.clearTimeout(mobileScrollTimerRef.current);
      }
    };
  }, []);

  const activityItems = useMemo<MyActivityListItem[] | null>(() => {
    if (experiences === null || trackedActivities === null) {
      return null;
    }

    return [
      ...experiences.map<MyActivityListItem>((experience) => ({
        key: `experience:${experience.id}`,
        id: experience.id,
        title: experience.title,
        kind: "experience",
        updatedAt: experience.updatedAt,
      })),
      ...trackedActivities.map<MyActivityListItem>((activity) => ({
        key: `tracked:${activity.id}`,
        id: activity.id,
        title: activity.title,
        kind: "tracked",
        updatedAt: activity.updatedAt,
        displayState: getTrackedActivityDisplayState(activity),
      })),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [experiences, trackedActivities]);

  const focusedDashboardAnalysisTask = aiTasks.find(
    (task) =>
      task.type === "experience-analysis" &&
      task.status === "pending" &&
      task.mode === "focused" &&
      task.sourceHref === "/experiences",
  );

  useEffect(() => {
    if (
      selectedItemKey ||
      !activityItems ||
      !focusedDashboardAnalysisTask?.targetId
    ) {
      return;
    }

    const taskItemKey = `experience:${focusedDashboardAnalysisTask.targetId}`;

    if (activityItems.some((item) => item.key === taskItemKey)) {
      setSelectedItemKey(taskItemKey);
    }
  }, [activityItems, focusedDashboardAnalysisTask, selectedItemKey]);

  useEffect(() => {
    if (
      selectedItemKey &&
      activityItems &&
      !activityItems.some((item) => item.key === selectedItemKey)
    ) {
      setSelectedItemKey(null);
    }
  }, [activityItems, selectedItemKey]);

  const selectedItem =
    activityItems?.find((item) => item.key === selectedItemKey) ?? null;
  const selectedExperience =
    selectedItem?.kind === "experience"
      ? (experiences?.find(
          (experience) => experience.id === selectedItem.id,
        ) ?? null)
      : null;
  const selectedTrackedActivity =
    selectedItem?.kind === "tracked"
      ? (trackedActivities?.find(
          (activity) => activity.id === selectedItem.id,
        ) ?? null)
      : null;
  const selectedAnalysis = selectedExperience
    ? (analysesByExperienceId[selectedExperience.id] ?? null)
    : null;
  const selectedTrackedActivityLogs = selectedTrackedActivity
    ? dailyLogs.filter((log) => log.activityId === selectedTrackedActivity.id)
    : [];
  const analysisTask = useExperienceAnalysisTask({
    experienceId: selectedExperience?.id ?? "",
    experienceTitle: selectedExperience?.title ?? "경험",
    sourceHref: "/experiences",
  });
  const currentAnalysisTask = analysisTask.task;
  const dismissAnalysisTask = analysisTask.dismiss;
  const normalizedSearchQuery = normalizeSearchValue(searchQuery);
  const filteredActivityItems = useMemo(() => {
    if (!activityItems || !normalizedSearchQuery) {
      return activityItems;
    }

    return activityItems.filter((item) =>
      normalizeSearchValue(item.title).includes(normalizedSearchQuery),
    );
  }, [activityItems, normalizedSearchQuery]);

  useEffect(() => {
    if (
      selectedItemKey &&
      filteredActivityItems &&
      !filteredActivityItems.some((item) => item.key === selectedItemKey)
    ) {
      setSelectedItemKey(null);
    }
  }, [filteredActivityItems, selectedItemKey]);

  useEffect(() => {
    if (!selectedExperience || !selectedAnalysis) {
      setIsAnalysisOpen(false);
    }
  }, [selectedAnalysis, selectedExperience]);

  useEffect(() => {
    if (!selectedExperience || currentAnalysisTask?.mode === "background") {
      return;
    }

    const experienceId = selectedExperience.id;

    if (currentAnalysisTask?.status === "success" && currentAnalysisTask.result) {
      setAnalysesByExperienceId((current) => ({
        ...current,
        [experienceId]: currentAnalysisTask.result?.analysis ?? null,
      }));
      setExperiences((current) =>
        current?.map((item) =>
          item.id === experienceId
            ? (currentAnalysisTask.result?.experience ?? item)
            : item,
        ) ?? null,
      );
      setAnalysisErrorByExperienceId((current) => ({
        ...current,
        [experienceId]: "",
      }));
      dismissAnalysisTask();
      return;
    }

    if (currentAnalysisTask?.status === "error") {
      setAnalysisErrorByExperienceId((current) => ({
        ...current,
        [experienceId]: currentAnalysisTask.isCancelled
          ? "AI 분석 요청을 취소했습니다. 기존 기록과 분석 결과는 그대로 유지했어요."
          : currentAnalysisTask.errorMessage,
      }));
    }
  }, [currentAnalysisTask, dismissAnalysisTask, selectedExperience]);

  const handleSelectActivity = (
    item: MyActivityListItem,
    trigger: HTMLButtonElement,
  ) => {
    lastSelectionTriggerRef.current = trigger;
    setExperienceDeleteError("");
    setIsAnalysisOpen(false);
    setSelectedItemKey(item.key);

    if (window.matchMedia("(max-width: 860px)").matches) {
      if (mobileScrollTimerRef.current !== null) {
        window.clearTimeout(mobileScrollTimerRef.current);
      }

      mobileScrollTimerRef.current = window.setTimeout(() => {
        document.getElementById(DASHBOARD_EXPERIENCE_DETAIL_ID)?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "start",
        });
        mobileScrollTimerRef.current = null;
      }, 80);
    }
  };

  const handleCloseDetail = useCallback(() => {
    if (mobileScrollTimerRef.current !== null) {
      window.clearTimeout(mobileScrollTimerRef.current);
      mobileScrollTimerRef.current = null;
    }

    setIsAnalysisOpen(false);
    setSelectedItemKey(null);

    window.requestAnimationFrame(() => {
      if (lastSelectionTriggerRef.current?.isConnected) {
        lastSelectionTriggerRef.current.focus();
      }
    });
  }, []);

  const handleOpenAnalysis = (trigger: HTMLButtonElement) => {
    analysisTriggerRef.current = trigger;
    setIsAnalysisOpen(true);

    if (window.matchMedia("(max-width: 860px)").matches) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(DASHBOARD_ANALYSIS_SPLIT_PANEL_ID)
          ?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "start",
          });
      });
    }
  };

  const handleCloseAnalysis = useCallback(() => {
    setIsAnalysisOpen(false);

    window.requestAnimationFrame(() => {
      if (analysisTriggerRef.current?.isConnected) {
        analysisTriggerRef.current.focus();
      }
    });
  }, []);

  const handleAnalyzeExperience = (experience: Experience) => {
    const experienceId = experience.id;

    if (analysisTask.isPending || experienceId !== selectedExperience?.id) {
      return;
    }

    setAnalysisErrorByExperienceId((current) => ({
      ...current,
      [experienceId]: "",
    }));
    void analysisTask.start();
  };

  const handleCancelAnalyzeExperience = () => {
    analysisTask.cancel();
  };

  const handleBackgroundAnalyzeExperience = () => {
    analysisTask.sendToBackground();
    router.push("/dashboard");
  };

  const handleDeleteExperience = async (experience: Experience) => {
    setExperienceDeleteError("");
    const repository = getCampusLogRepository();
    let didDelete = false;

    try {
      didDelete = await repository.experiences.delete(experience.id);
    } catch {
      didDelete = false;
    }

    if (!didDelete) {
      setExperienceDeleteError(
        "경험을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    setExperiences((currentExperiences) =>
      currentExperiences?.filter(
        (storedExperience) => storedExperience.id !== experience.id,
      ) ?? currentExperiences,
    );
    setAnalysesByExperienceId((currentAnalyses) => {
      const nextAnalyses = { ...currentAnalyses };
      delete nextAnalyses[experience.id];
      return nextAnalyses;
    });
    setAnalysisErrorByExperienceId((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[experience.id];
      return nextErrors;
    });
    setIsAnalysisOpen(false);
    setSelectedItemKey(null);
  };

  const handleDeleteTrackedActivity = async (
    activity: TrackedActivity,
    logCount: number,
  ) => {
    if (
      !window.confirm(
        createTrackedActivityDeleteConfirmMessage(activity, logCount),
      )
    ) {
      return;
    }

    const repository = getCampusLogRepository();
    let didDelete = false;

    try {
      didDelete = await repository.trackedActivities.delete(activity.id);
    } catch {
      didDelete = false;
    }

    if (!didDelete) {
      setLoadError("활동을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setTrackedActivities((currentActivities) =>
      currentActivities
        ? currentActivities.filter(
            (storedActivity) => storedActivity.id !== activity.id,
          )
        : currentActivities,
    );
    setDailyLogs((currentLogs) =>
      currentLogs.filter((log) => log.activityId !== activity.id),
    );
    setSelectedItemKey((currentKey) =>
      currentKey === `tracked:${activity.id}` ? null : currentKey,
    );
    setLoadError("");
  };

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isAnalysisOpen) {
          handleCloseAnalysis();
        } else {
          handleCloseDetail();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseAnalysis, handleCloseDetail, isAnalysisOpen, selectedItem]);

  const hasSelection = selectedItem !== null;
  const activeActivityCount =
    trackedActivities?.filter(
      (activity) => getTrackedActivityDisplayState(activity) === "active",
    ).length ?? 0;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`dashboard-experience-page primary-page${hasSelection ? " has-selection" : ""}${isAnalysisOpen ? " has-analysis" : ""}`}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="breadcrumb-brand-link">
                CampusLog
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>나의 활동</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="dashboard-experience-heading primary-page-heading">
          <h1 id="dashboard-experience-heading">나의 활동</h1>
          <p className="primary-page-description">
            진행 중인 활동과 완료된 경험을 한곳에서 확인합니다.
          </p>
        </header>

        <LayoutGroup id="dashboard-experience-layout">
          <motion.div
            layout
            className="dashboard-experience-workspace"
            data-detail-open={hasSelection && !isAnalysisOpen ? "true" : "false"}
            data-analysis-open={isAnalysisOpen ? "true" : "false"}
            transition={{ layout: DASHBOARD_LAYOUT_TRANSITION }}
          >
            <motion.section
              layout="position"
              className="dashboard-experience-list-pane liquid-workspace"
              aria-labelledby="dashboard-experience-list-heading"
              transition={{ layout: DASHBOARD_LAYOUT_TRANSITION }}
            >
              {activityItems !== null ? (
                <header className="dashboard-experience-section-heading">
                  <div className="dashboard-experience-heading-row">
                    <div className="dashboard-experience-title-group">
                      <h2 id="dashboard-experience-list-heading">전체 활동</h2>
                      {activityItems && !loadError ? (
                        <span className="dashboard-experience-count">
                          <CountUp to={activityItems.length} duration={0.75} />
                          <span className="sr-only">
                            전체 활동 {activityItems.length}개
                          </span>
                        </span>
                      ) : null}
                      {activityItems && !loadError ? (
                        <span className="dashboard-active-activity-count">
                          진행 중
                          <CountUp to={activeActivityCount} duration={0.75} />
                          <span className="sr-only">
                            {activeActivityCount}개
                          </span>
                        </span>
                      ) : null}
                    </div>
                    {activityItems && activityItems.length > 0 ? (
                      <GooeyInput
                        className="dashboard-experience-search"
                        placeholder="검색"
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        expandedWidth={hasSelection ? 218 : 250}
                      />
                    ) : null}
                  </div>
                  {normalizedSearchQuery && filteredActivityItems ? (
                    <p className="master-detail-search-feedback" role="status">
                      {filteredActivityItems.length}개의 활동을 찾았습니다.
                    </p>
                  ) : null}
                </header>
              ) : null}

              {activityItems === null ? (
                <h2 id="dashboard-experience-list-heading" className="sr-only">
                  전체 활동
                </h2>
              ) : null}

              {experiencePins.error ? (
                <div className="pinned-list-error" role="alert">
                  <span>{experiencePins.error}</span>
                  <button type="button" onClick={experiencePins.clearError}>
                    닫기
                  </button>
                </div>
              ) : null}

              {loadError ? (
                <div className="dashboard-list-state is-error" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <h2>나의 활동을 불러오지 못했습니다</h2>
                  <p>{loadError}</p>
                  <RippleButton type="button" onClick={loadDashboardData}>
                    <RotateCcw aria-hidden="true" />
                    다시 시도
                    <RippleButtonRipples />
                  </RippleButton>
                </div>
              ) : activityItems === null ? (
                <LoadingState
                  variant="list"
                  count={6}
                  message="나의 활동을 불러오는 중입니다."
                />
              ) : activityItems.length === 0 ? (
                <div className="dashboard-list-state is-empty">
                  <span className="dashboard-empty-mark" aria-hidden="true">
                    +
                  </span>
                  <h2>아직 등록한 활동이 없습니다</h2>
                  <p>진행할 활동을 시작하거나 과거 경험을 직접 기록해 보세요.</p>
                  <Link href="/experiences/new">과거 경험 기록하기</Link>
                </div>
              ) : filteredActivityItems?.length === 0 ? (
                <div className="dashboard-list-state is-search-empty">
                  <h2>검색 결과가 없습니다</h2>
                  <p>다른 활동 제목을 검색해 보세요.</p>
                  <button type="button" onClick={() => setSearchQuery("")}>
                    검색어 지우기
                  </button>
                </div>
              ) : (
                <AnimatedExperienceList
                  items={filteredActivityItems ?? []}
                  selectedItemKey={selectedItemKey}
                  detailId={DASHBOARD_EXPERIENCE_DETAIL_ID}
                  pinnedItems={experiencePins.pinnedItems}
                  pendingPinIds={experiencePins.pendingIds}
                  onSelect={handleSelectActivity}
                  onTogglePin={experiencePins.togglePinned}
                />
              )}
            </motion.section>

            <AnimatePresence initial={false} mode="wait">
              {selectedExperience || selectedTrackedActivity ? (
                <motion.div
                  key={selectedItemKey}
                  layout
                  className="dashboard-experience-detail-slot"
                  transition={{ layout: DASHBOARD_LAYOUT_TRANSITION }}
                >
                  {selectedExperience ? (
                    <DashboardExperienceDetail
                      experience={selectedExperience}
                      analysis={selectedAnalysis}
                      onClose={handleCloseDetail}
                      onAnalyze={() =>
                        handleAnalyzeExperience(selectedExperience)
                      }
                      onCancelAnalysis={() =>
                        handleCancelAnalyzeExperience()
                      }
                      onBackgroundAnalysis={handleBackgroundAnalyzeExperience}
                      onOpenAnalysis={handleOpenAnalysis}
                      isAnalysisOpen={isAnalysisOpen}
                      isAnalyzing={analysisTask.isPending}
                      analysisError={
                        experienceDeleteError ||
                        analysisErrorByExperienceId[selectedExperience.id] ||
                        ""
                      }
                      analysisStatusMessage={
                        currentAnalysisTask?.statusMessage ?? ""
                      }
                      onDelete={() =>
                        handleDeleteExperience(selectedExperience)
                      }
                    />
                  ) : selectedTrackedActivity ? (
                    <DashboardTrackedActivityDetail
                      activity={selectedTrackedActivity}
                      logs={selectedTrackedActivityLogs}
                      onClose={handleCloseDetail}
                      onDelete={handleDeleteTrackedActivity}
                    />
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {isAnalysisOpen &&
              selectedExperience &&
              selectedAnalysis ? (
                <DashboardAnalysisSplitPanel
                  key={`analysis:${selectedExperience.id}`}
                  experience={selectedExperience}
                  analysis={selectedAnalysis}
                  isAnalyzing={analysisTask.isPending}
                  analysisError={
                    analysisErrorByExperienceId[selectedExperience.id] ?? ""
                  }
                  analysisStatusMessage={
                    currentAnalysisTask?.statusMessage ?? ""
                  }
                  onClose={handleCloseAnalysis}
                  onReanalyze={() =>
                    handleAnalyzeExperience(selectedExperience)
                  }
                  onCancelAnalysis={() =>
                    handleCancelAnalyzeExperience()
                  }
                  onBackgroundAnalysis={handleBackgroundAnalyzeExperience}
                />
              ) : null}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <Link
          href="/experiences/new"
          className="dashboard-add-experience"
          aria-label="과거 경험 기록하기"
        >
          <Plus aria-hidden="true" />
        </Link>
      </div>
    </MotionConfig>
  );
}
