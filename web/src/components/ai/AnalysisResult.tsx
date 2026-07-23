import { AlertTriangle } from "lucide-react";

import { AnalysisGapAnswerList } from "@/components/ai/AnalysisGapAnswerList";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

type AnalysisResultProps = {
  experience: Experience;
  analysis: ExperienceAnalysis;
  variant?: "default" | "embedded";
};

export function AnalysisResult({
  experience,
  analysis,
  variant = "default",
}: AnalysisResultProps) {
  const isSourceOutdated =
    analysis.sourceExperienceUpdatedAt !== experience.updatedAt;
  const hasLegacyReanalysisStatus =
    experience.analysisStatus === "needs_reanalysis" && !isSourceOutdated;
  const starItems = [
    ["상황", analysis.star.situation],
    ["과제", analysis.star.task],
    ["행동", analysis.star.action],
    ["결과", analysis.star.result],
  ] as const;
  const hasStar = starItems.some(([, value]) => value);
  const isEmbedded = variant === "embedded";

  return (
    <section
      className={`detail-panel analysis-result${isEmbedded ? " is-embedded" : ""}`}
      aria-label={isEmbedded ? "상세 AI 분석 결과" : undefined}
      aria-labelledby={isEmbedded ? undefined : "analysis-result-title"}
    >
      {!isEmbedded ? (
        <div className="detail-header">
          <div>
            <p className="experience-meta">{experience.title}</p>
            <h2 id="analysis-result-title">저장된 분석 결과</h2>
          </div>
          <StatusBadge status={experience.analysisStatus} />
        </div>
      ) : null}

      {isSourceOutdated ? (
        <div className="analysis-notice" role="status">
          <AlertTriangle aria-hidden="true" />
          <p>
            원본 경험이 분석 이후 수정되어 업데이트가 필요합니다. 보완 답변은
            추천에 바로 반영되지만, 요약과 STAR까지 최신화하려면 다시 분석하기를
            사용하세요.
          </p>
        </div>
      ) : (
        <div className="analysis-info-notice" role="status">
          <p>
            원본 경험이 바뀌면 업데이트 필요로 표시됩니다. 보완 답변만 추가한
            경우 추천에는 바로 반영되며, 요약과 STAR까지 반영하려면 다시
            분석하기를 사용하세요.
          </p>
        </div>
      )}

      {hasLegacyReanalysisStatus ? (
        <div className="analysis-info-notice" role="status">
          <p>
            이전 보완 답변 저장으로 재분석 필요 상태가 남아 있을 수 있습니다.
            원본 경험이 바뀌지 않았다면 추천에는 저장된 보완 답변이 함께
            사용됩니다.
          </p>
        </div>
      ) : null}

      <div className="detail-section">
        <h3>경험 요약</h3>
        <p>{analysis.summary}</p>
      </div>

      <div className="detail-section">
        <h3>STAR 구조</h3>
        {hasStar ? (
          <dl className="analysis-star-grid">
            {starItems.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "현재 기록만으로는 구분하기 어렵습니다."}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted-text">
            현재 기록만으로 STAR 구조를 안정적으로 나누기 어렵습니다.
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
        <h3>부족한 정보</h3>
        <AnalysisGapAnswerList experience={experience} analysis={analysis} />
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
