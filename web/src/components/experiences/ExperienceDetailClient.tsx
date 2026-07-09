"use client";

import { BookOpenText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ExperienceDetail } from "@/components/experiences/ExperienceDetail";
import {
  deleteExperience,
  getAnalysisByExperienceId,
  getExperienceById,
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

  useEffect(() => {
    setExperience(getExperienceById(id));
    setAnalysis(getAnalysisByExperienceId(id));
  }, [id]);

  function handleDelete() {
    deleteExperience(id);
    router.push("/");
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
      />
    </div>
  );
}
