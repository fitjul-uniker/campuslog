import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type ExperienceCardProps = {
  experience: Experience;
  analysis?: ExperienceAnalysis | null;
};

function getPreviewText(experience: Experience) {
  return experience.description || experience.achievements;
}

export function ExperienceCard({ experience, analysis }: ExperienceCardProps) {
  const aiTags = (analysis?.keywords ?? []).filter(
    (tag, index, tags) => tags.indexOf(tag) === index,
  );
  const visibleTags = aiTags.slice(0, 4);
  const hiddenTagCount = Math.max(aiTags.length - visibleTags.length, 0);
  const hasBeenEdited = experience.createdAt !== experience.updatedAt;
  const displayDate = hasBeenEdited ? experience.updatedAt : experience.createdAt;
  const previewText = getPreviewText(experience);

  return (
    <Link href={`/experiences/${experience.id}`} className="experience-card">
      <article className="experience-card-body">
        <div className="experience-card-header">
          <div className="experience-card-title-group">
            <h2>{experience.title}</h2>
            <StatusBadge status={experience.analysisStatus} />
          </div>
        </div>

        <dl className="experience-card-meta" aria-label="경험 기본 정보">
          <div>
            <dt>활동 기간</dt>
            <dd>{experience.period}</dd>
          </div>
          <div>
            <dt>역할</dt>
            <dd>{experience.role}</dd>
          </div>
        </dl>

        {previewText ? (
          <p className="experience-card-description">{previewText}</p>
        ) : null}

        {visibleTags.length > 0 ? (
          <div className="experience-tags" aria-label="AI 활용 키워드">
            {visibleTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
            {hiddenTagCount > 0 ? <span>+{hiddenTagCount}</span> : null}
          </div>
        ) : null}

        <div className="experience-card-footer">
          <span>
            {hasBeenEdited ? "최근 수정" : "생성"}{" "}
            {formatDateTime(displayDate)}
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
