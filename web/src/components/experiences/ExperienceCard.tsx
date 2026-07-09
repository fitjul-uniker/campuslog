import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type ExperienceCardProps = {
  experience: Experience;
  analysis?: ExperienceAnalysis | null;
};

export function ExperienceCard({ experience, analysis }: ExperienceCardProps) {
  const tags = analysis?.competencyTags.slice(0, 3) ?? [];
  const hasBeenEdited = experience.createdAt !== experience.updatedAt;

  return (
    <Link href={`/experiences/${experience.id}`} className="experience-card">
      <article>
        <div className="experience-card-header">
          <div>
            <p className="experience-meta">
              {experience.period} · {experience.role}
            </p>
            <h2>{experience.title}</h2>
          </div>
          <StatusBadge status={experience.analysisStatus} />
        </div>

        <p className="experience-card-description">{experience.description}</p>

        {tags.length > 0 ? (
          <div className="experience-tags" aria-label="AI 역량 태그">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}

        <div className="experience-card-footer">
          <span>
            {hasBeenEdited ? "최근 수정" : "생성"}{" "}
            {formatDateTime(
              hasBeenEdited ? experience.updatedAt : experience.createdAt,
            )}
          </span>
          <span className="card-link">
            상세 보기
            <ArrowRight aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}
