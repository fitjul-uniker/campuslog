"use client";

import Link from "next/link";
import { AlertCircle, Plus, RotateCcw } from "lucide-react";
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
import {
  DASHBOARD_EXPERIENCE_DETAIL_ID,
  DashboardExperienceDetail,
} from "@/components/experiences/DashboardExperienceDetail";
import { DashboardTrackedActivityDetail } from "@/components/experiences/DashboardTrackedActivityDetail";
import { requestExperienceAnalysis } from "@/lib/analysisApi";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  DailyLog,
  Experience,
  ExperienceAnalysis,
  TrackedActivity,
} from "@/lib/types";
import { CountUp } from "@/components/ui/CountUp";
import { GooeyInput } from "@/components/ui/GooeyInput";

const DASHBOARD_LAYOUT_TRANSITION = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

type AnalysisRequestState = Record<
  string,
  {
    isLoading: boolean;
    error: string;
  }
>;

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
}

export function ExperienceDashboard() {
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [trackedActivities, setTrackedActivities] = useState<
    TrackedActivity[] | null
  >(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [analysesByExperienceId, setAnalysesByExperienceId] = useState<
    Record<string, ExperienceAnalysis | null>
  >({});
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisRequestByExperienceId, setAnalysisRequestByExperienceId] =
    useState<AnalysisRequestState>({});
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const lastSelectionTriggerRef = useRef<HTMLButtonElement | null>(null);
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
      })),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [experiences, trackedActivities]);

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
  const selectedTrackedActivityLogs = selectedTrackedActivity
    ? dailyLogs.filter((log) => log.activityId === selectedTrackedActivity.id)
    : [];
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

  const handleSelectActivity = (
    item: MyActivityListItem,
    trigger: HTMLButtonElement,
  ) => {
    lastSelectionTriggerRef.current = trigger;
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

    setSelectedItemKey(null);

    window.requestAnimationFrame(() => {
      if (lastSelectionTriggerRef.current?.isConnected) {
        lastSelectionTriggerRef.current.focus();
      }
    });
  }, []);

  const handleAnalyzeExperience = async (experience: Experience) => {
    const experienceId = experience.id;

    if (analysisRequestByExperienceId[experienceId]?.isLoading) {
      return;
    }

    setAnalysisRequestByExperienceId((current) => ({
      ...current,
      [experienceId]: { isLoading: true, error: "" },
    }));

    const repository = getCampusLogRepository();
    const followups =
      await repository.experienceFollowups.listByExperienceId(experience.id);
    const response = await requestExperienceAnalysis(experience, followups);

    if (!response.ok) {
      setAnalysisRequestByExperienceId((current) => ({
        ...current,
        [experienceId]: {
          isLoading: false,
          error: response.error.message,
        },
      }));
      return;
    }

    const savedAnalysis = await repository.analyses.save(response.analysis);

    if (!savedAnalysis) {
      setAnalysisRequestByExperienceId((current) => ({
        ...current,
        [experienceId]: {
          isLoading: false,
          error:
            "분석 결과를 저장하지 못했습니다. 경험이 삭제되지 않았는지 확인해 주세요.",
        },
      }));
      return;
    }

    setAnalysesByExperienceId((current) => ({
      ...current,
      [experienceId]: savedAnalysis,
    }));
    setExperiences(await repository.experiences.list());
    setAnalysisRequestByExperienceId((current) => ({
      ...current,
      [experienceId]: { isLoading: false, error: "" },
    }));
  };

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseDetail();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseDetail, selectedItem]);

  const hasSelection = selectedItem !== null;
  const activeActivityCount = trackedActivities?.length ?? 0;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`dashboard-experience-page${hasSelection ? " has-selection" : ""}`}
      >
        <LayoutGroup id="dashboard-experience-layout">
          <motion.div
            layout
            className="dashboard-experience-workspace"
            data-detail-open={hasSelection ? "true" : "false"}
            transition={{ layout: DASHBOARD_LAYOUT_TRANSITION }}
          >
            <motion.section
              layout="position"
              className="dashboard-experience-list-pane"
              aria-labelledby="dashboard-experience-heading"
              transition={{ layout: DASHBOARD_LAYOUT_TRANSITION }}
            >
              <header className="dashboard-experience-heading">
                <div className="dashboard-experience-heading-row">
                  <div className="dashboard-experience-title-group">
                    <h1 id="dashboard-experience-heading">나의 활동</h1>
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
                      placeholder="검색"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      expandedWidth={hasSelection ? 218 : 250}
                    />
                  ) : null}
                </div>
                <p>
                  진행 중인 활동과 완료된 경험을 한곳에서 확인합니다.
                </p>
                {normalizedSearchQuery && filteredActivityItems ? (
                  <p className="master-detail-search-feedback" role="status">
                    {filteredActivityItems.length}개의 활동을 찾았습니다.
                  </p>
                ) : null}
              </header>

              {loadError ? (
                <div className="dashboard-list-state is-error" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <h2>나의 활동을 불러오지 못했습니다</h2>
                  <p>{loadError}</p>
                  <button type="button" onClick={loadDashboardData}>
                    <RotateCcw aria-hidden="true" />
                    다시 시도
                  </button>
                </div>
              ) : activityItems === null ? (
                <div
                  className="dashboard-list-loading"
                  aria-busy="true"
                  aria-label="나의 활동을 불러오는 중입니다"
                >
                  {Array.from({ length: 6 }, (_, index) => (
                    <span key={index} aria-hidden="true" />
                  ))}
                </div>
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
                  onSelect={handleSelectActivity}
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
                      analysis={
                        analysesByExperienceId[selectedExperience.id] ?? null
                      }
                      onClose={handleCloseDetail}
                      onAnalyze={() =>
                        handleAnalyzeExperience(selectedExperience)
                      }
                      isAnalyzing={
                        analysisRequestByExperienceId[selectedExperience.id]
                          ?.isLoading ?? false
                      }
                      analysisError={
                        analysisRequestByExperienceId[selectedExperience.id]
                          ?.error ?? ""
                      }
                    />
                  ) : selectedTrackedActivity ? (
                    <DashboardTrackedActivityDetail
                      activity={selectedTrackedActivity}
                      logs={selectedTrackedActivityLogs}
                      onClose={handleCloseDetail}
                    />
                  ) : null}
                </motion.div>
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
