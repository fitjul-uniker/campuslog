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

import { AnimatedExperienceList } from "@/components/experiences/AnimatedExperienceList";
import {
  DASHBOARD_EXPERIENCE_DETAIL_ID,
  DashboardExperienceDetail,
} from "@/components/experiences/DashboardExperienceDetail";
import {
  getAnalysisByExperienceId,
  getExperiences,
  saveAnalysisResult,
} from "@/lib/storage";
import { requestExperienceAnalysis } from "@/lib/analysisApi";
import type { Experience, ExperienceAnalysis } from "@/lib/types";
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
  const [analysesByExperienceId, setAnalysesByExperienceId] = useState<
    Record<string, ExperienceAnalysis | null>
  >({});
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysisRequestByExperienceId, setAnalysisRequestByExperienceId] =
    useState<AnalysisRequestState>({});
  const [selectedExperienceId, setSelectedExperienceId] = useState<
    string | null
  >(null);
  const lastSelectionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileScrollTimerRef = useRef<number | null>(null);

  const loadDashboardData = useCallback(() => {
    setLoadError("");

    try {
      const storedExperiences = getExperiences();
      setExperiences(storedExperiences);
      setAnalysesByExperienceId(
        storedExperiences.reduce<Record<string, ExperienceAnalysis | null>>(
          (analyses, experience) => {
            analyses[experience.id] = getAnalysisByExperienceId(experience.id);
            return analyses;
          },
          {},
        ),
      );
    } catch {
      setExperiences([]);
      setAnalysesByExperienceId({});
      setLoadError(
        "저장된 경험 목록을 불러오지 못했습니다. 데이터를 지우지 않았으니 잠시 후 다시 시도해 주세요.",
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

  useEffect(() => {
    if (
      selectedExperienceId &&
      experiences &&
      !experiences.some(
        (experience) => experience.id === selectedExperienceId,
      )
    ) {
      setSelectedExperienceId(null);
    }
  }, [experiences, selectedExperienceId]);

  const selectedExperience =
    experiences?.find(
      (experience) => experience.id === selectedExperienceId,
    ) ?? null;
  const normalizedSearchQuery = normalizeSearchValue(searchQuery);
  const filteredExperiences = useMemo(() => {
    if (!experiences || !normalizedSearchQuery) {
      return experiences;
    }

    return experiences.filter((experience) =>
      normalizeSearchValue(experience.title).includes(normalizedSearchQuery),
    );
  }, [experiences, normalizedSearchQuery]);

  useEffect(() => {
    if (
      selectedExperienceId &&
      filteredExperiences &&
      !filteredExperiences.some(
        (experience) => experience.id === selectedExperienceId,
      )
    ) {
      setSelectedExperienceId(null);
    }
  }, [filteredExperiences, selectedExperienceId]);

  const handleSelectExperience = (
    experience: Experience,
    trigger: HTMLButtonElement,
  ) => {
    lastSelectionTriggerRef.current = trigger;
    setSelectedExperienceId(experience.id);

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

    setSelectedExperienceId(null);

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

    const response = await requestExperienceAnalysis(experience);

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

    const savedAnalysis = saveAnalysisResult(response.analysis);

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
    setExperiences(getExperiences());
    setAnalysisRequestByExperienceId((current) => ({
      ...current,
      [experienceId]: { isLoading: false, error: "" },
    }));
  };

  useEffect(() => {
    if (!selectedExperience) {
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
  }, [handleCloseDetail, selectedExperience]);

  const hasSelection = selectedExperience !== null;

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
                    <h1 id="dashboard-experience-heading">활동 목록</h1>
                    {experiences && !loadError ? (
                      <span className="dashboard-experience-count">
                        <CountUp to={experiences.length} duration={0.75} />
                        <span className="sr-only">총 {experiences.length}개</span>
                      </span>
                    ) : null}
                  </div>
                  {experiences && experiences.length > 0 ? (
                    <GooeyInput
                      placeholder="검색"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      expandedWidth={hasSelection ? 218 : 250}
                    />
                  ) : null}
                </div>
                <p>
                  활동을 선택하면 기록한 내용을 바로 확인할 수 있습니다.
                </p>
                {normalizedSearchQuery && filteredExperiences ? (
                  <p className="master-detail-search-feedback" role="status">
                    {filteredExperiences.length}개의 활동을 찾았습니다.
                  </p>
                ) : null}
              </header>

              {loadError ? (
                <div className="dashboard-list-state is-error" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <h2>활동 목록을 불러오지 못했습니다</h2>
                  <p>{loadError}</p>
                  <button type="button" onClick={loadDashboardData}>
                    <RotateCcw aria-hidden="true" />
                    다시 시도
                  </button>
                </div>
              ) : experiences === null ? (
                <div
                  className="dashboard-list-loading"
                  aria-busy="true"
                  aria-label="저장된 활동 목록을 불러오는 중입니다"
                >
                  {Array.from({ length: 6 }, (_, index) => (
                    <span key={index} aria-hidden="true" />
                  ))}
                </div>
              ) : experiences.length === 0 ? (
                <div className="dashboard-list-state is-empty">
                  <span className="dashboard-empty-mark" aria-hidden="true">
                    +
                  </span>
                  <h2>아직 기록한 활동이 없습니다</h2>
                  <p>첫 활동을 기록하면 이곳에서 바로 꺼내볼 수 있습니다.</p>
                  <Link href="/experiences/new">첫 활동 기록하기</Link>
                </div>
              ) : filteredExperiences?.length === 0 ? (
                <div className="dashboard-list-state is-search-empty">
                  <h2>검색 결과가 없습니다</h2>
                  <p>다른 활동 제목을 검색해 보세요.</p>
                  <button type="button" onClick={() => setSearchQuery("")}>
                    검색어 지우기
                  </button>
                </div>
              ) : (
                <AnimatedExperienceList
                  experiences={filteredExperiences ?? []}
                  selectedExperienceId={selectedExperienceId}
                  detailId={DASHBOARD_EXPERIENCE_DETAIL_ID}
                  onSelect={handleSelectExperience}
                />
              )}
            </motion.section>

            <AnimatePresence initial={false} mode="popLayout">
              {selectedExperience ? (
                <motion.div
                  key="dashboard-experience-detail-slot"
                  layout
                  className="dashboard-experience-detail-slot"
                  transition={{ layout: DASHBOARD_LAYOUT_TRANSITION }}
                >
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
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <Link
          href="/experiences/new"
          className="dashboard-add-experience"
          aria-label="새 경험 기록하기"
        >
          <Plus aria-hidden="true" />
        </Link>
      </div>
    </MotionConfig>
  );
}
