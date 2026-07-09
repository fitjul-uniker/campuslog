"use client";

import Link from "next/link";
import { BookOpenText, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import {
  getAnalysisByExperienceId,
  getExperiences,
} from "@/lib/storage";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

export function ExperienceDashboard() {
  const [experiences, setExperiences] = useState<Experience[] | null>(null);
  const [analysesByExperienceId, setAnalysesByExperienceId] = useState<
    Record<string, ExperienceAnalysis | null>
  >({});

  useEffect(() => {
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
  }, []);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">경험 목록 대시보드</p>
          <h1>나의 경험</h1>
          <p className="page-description">
            프로젝트, 공모전, 인턴, 대외활동 경험을 한곳에서 확인하는
            시작 화면입니다.
          </p>
        </div>

        <div className="header-actions">
          <Link href="/experiences/new" className="button button-primary">
            <Plus className="button-icon" aria-hidden="true" />
            새 경험 기록
          </Link>
          <Link href="/recommend" className="button button-secondary">
            <Sparkles className="button-icon" aria-hidden="true" />
            AI 추천
          </Link>
        </div>
      </section>

      {experiences === null ? (
        <section className="placeholder-panel">
          <p className="muted-text">저장된 경험을 불러오는 중입니다.</p>
        </section>
      ) : experiences.length === 0 ? (
        <EmptyState
          title="아직 기록한 활동 경험이 없습니다"
          description="첫 경험을 기록하면 이후 이 화면에서 최근 수정한 경험부터 확인할 수 있습니다."
          icon={<BookOpenText />}
          primaryAction={{
            href: "/experiences/new",
            label: "첫 경험 기록하기",
          }}
          secondaryAction={{
            href: "/recommend",
            label: "AI 추천 화면 보기",
          }}
        />
      ) : (
        <section className="experience-list" aria-label="저장된 활동 경험 목록">
          {experiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              analysis={analysesByExperienceId[experience.id]}
            />
          ))}
        </section>
      )}
    </div>
  );
}
