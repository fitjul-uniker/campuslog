"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BookOpenText } from "lucide-react";
import type { AnimationEvent, MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { LoadingState } from "@/components/common/LoadingState";
import { SortSelect } from "@/components/common/SortSelect";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import {
  getAnalysisByExperienceId,
  getExperiences,
} from "@/lib/storage";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

export function ExperienceDashboard() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [analysesByExperienceId, setAnalysesByExperienceId] = useState<
    Record<string, ExperienceAnalysis | null>
  >({});
  const [loadError, setLoadError] = useState("");
  const [isPageTurning, setIsPageTurning] = useState(false);

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

  const handlePageTurn = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (isPageTurning) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/experiences/new");
      return;
    }

    setIsPageTurning(true);
  };

  const handlePageTurnEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === "dashboard-page-turn" && isPageTurning) {
      router.push("/experiences/new");
    }
  };

  return (
    <div className={`page-stack${isPageTurning ? " is-page-turning" : ""}`}>
      <section className="page-header dashboard-note-header">
        <div>
          <p className="eyebrow">경험 목록 대시보드</p>
          <h1>나의 경험</h1>
          <p className="page-description">
            저장한 프로젝트, 공모전, 인턴, 대외활동 경험을 확인하고 다시
            꺼내 쓰기 쉽게 관리합니다.
          </p>
        </div>
      </section>

      <div
        className="dashboard-right-page"
        onAnimationEnd={handlePageTurnEnd}
      >
        <div className="dashboard-page-front">
          {loadError ? (
            <section className="alert-panel" role="alert">
              <AlertCircle aria-hidden="true" />
              <div>
                <h2>경험 목록을 불러오지 못했습니다</h2>
                <p>{loadError}</p>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={loadDashboardData}
                >
                  다시 시도
                </button>
              </div>
            </section>
          ) : experiences === null ? (
            <LoadingState
              variant="cards"
              count={3}
              message="저장된 경험 목록을 불러오는 중입니다."
            />
          ) : experiences.length === 0 ? (
            <EmptyState
              title="아직 기록한 활동 경험이 없습니다"
              description="경험을 기록하면 AI 분석과 추천에 활용할 수 있습니다. 추천을 받으려면 먼저 활동 경험을 하나 이상 저장해 주세요."
              icon={<BookOpenText />}
            />
          ) : (
            <section className="experience-list-section notebook-list-section">
              <div className="list-toolbar">
                <div>
                  <p className="eyebrow">저장된 경험</p>
                  <h2>총 {experiences.length}개</h2>
                  <p className="muted-text">
                    목록은 현재 최근 수정한 경험부터 표시됩니다.
                  </p>
                </div>

                <div className="list-controls" aria-label="경험 목록 도구">
                  <SortSelect
                    value="updated_desc"
                    disabled
                    helperText="정렬 변경은 추후 제공됩니다."
                    options={[
                      { value: "updated_desc", label: "최신 수정순" },
                      { value: "created_asc", label: "오래된 작성순" },
                      { value: "period_desc", label: "활동 기간순" },
                    ]}
                  />
                  <FilterDropdown
                    value="all"
                    disabled
                    helperText="필터 적용은 추후 제공됩니다."
                    options={[
                      { value: "all", label: "전체 상태" },
                      { value: "unanalyzed", label: "미분석" },
                      { value: "analyzed", label: "분석 완료" },
                      { value: "needs_reanalysis", label: "재분석 필요" },
                    ]}
                  />
                </div>
              </div>

              <div
                className="experience-list"
                aria-label="저장된 활동 경험 목록"
              >
                {experiences.map((experience) => (
                  <ExperienceCard
                    key={experience.id}
                    experience={experience}
                    analysis={analysesByExperienceId[experience.id]}
                  />
                ))}
              </div>
            </section>
          )}

          <Link
            href="/experiences/new"
            className="dashboard-page-turn-link"
            onClick={handlePageTurn}
            aria-disabled={isPageTurning}
          >
            새 경험 기록하기
          </Link>
        </div>
        <div className="dashboard-page-back" aria-hidden="true" />
      </div>
    </div>
  );
}
