import { AlertTriangle } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type AnalysisResultProps = {
  experience: Experience;
  analysis: ExperienceAnalysis;
};

export function AnalysisResult({ experience, analysis }: AnalysisResultProps) {
  const needsReanalysis =
    experience.analysisStatus === "needs_reanalysis" ||
    analysis.sourceExperienceUpdatedAt !== experience.updatedAt;

  return (
    <section className="detail-panel" aria-labelledby="analysis-result-title">
      <div className="detail-header">
        <div>
          <p className="experience-meta">{experience.title}</p>
          <h2 id="analysis-result-title">저장된 분석 결과</h2>
        </div>
        <StatusBadge status={experience.analysisStatus} />
      </div>

      {needsReanalysis ? (
        <div className="analysis-notice" role="status">
          <AlertTriangle aria-hidden="true" />
          <p>
            경험이 분석 이후 수정되었습니다. 최신 내용 기준으로 다시 분석할 수
            있습니다.
          </p>
        </div>
      ) : null}

      <div className="detail-section">
        <h3>경험 요약</h3>
        <p>{analysis.summary}</p>
      </div>

      <div className="detail-section">
        <h3>핵심 역량 태그</h3>
        {analysis.competencyTags.length > 0 ? (
          <div className="experience-tags">
            {analysis.competencyTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            입력 내용에서 근거가 확인된 핵심 역량 태그가 없습니다.
          </p>
        )}
      </div>

      <div className="detail-section">
        <h3>주요 성과</h3>
        {analysis.achievements.length > 0 ? (
          <ul className="plain-list">
            {analysis.achievements.map((achievement) => (
              <li key={achievement}>{achievement}</li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">
            입력 내용에서 확인된 주요 성과가 없습니다.
          </p>
        )}
      </div>

      <div className="detail-section">
        <h3>활용 가능한 키워드</h3>
        {analysis.keywords.length > 0 ? (
          <div className="experience-tags">
            {analysis.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            입력 내용에서 활용 가능한 키워드가 확인되지 않았습니다.
          </p>
        )}
      </div>

      <p className="muted-text">
        분석 생성일 {formatDateTime(analysis.generatedAt)}
      </p>
    </section>
  );
}
