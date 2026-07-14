import { AlertTriangle } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime } from "@/lib/date";
import type {
  Experience,
  ExperienceAnalysis,
  ExperienceAnalysisEvidenceSource,
} from "@/lib/types";

type AnalysisResultProps = {
  experience: Experience;
  analysis: ExperienceAnalysis;
};

const EVIDENCE_SOURCE_LABELS: Record<ExperienceAnalysisEvidenceSource, string> = {
  title: "활동명",
  period: "기간",
  role: "역할",
  description: "활동 내용",
  achievements: "성과",
  relatedLinks: "관련 링크",
  followupAnswers: "보완 답변",
};

export function AnalysisResult({ experience, analysis }: AnalysisResultProps) {
  const needsReanalysis =
    experience.analysisStatus === "needs_reanalysis" ||
    analysis.sourceExperienceUpdatedAt !== experience.updatedAt;
  const starItems = [
    ["상황", analysis.star.situation],
    ["과제", analysis.star.task],
    ["행동", analysis.star.action],
    ["결과", analysis.star.result],
  ] as const;
  const hasStar = starItems.some(([, value]) => value);

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
            경험 또는 보완 답변이 분석 이후 바뀌었습니다. 최신 내용 기준으로
            다시 분석할 수 있습니다.
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
        <h3>역량별 근거</h3>
        {analysis.competencyEvidence.length > 0 ? (
          <ul className="analysis-structured-list">
            {analysis.competencyEvidence.map((item) => (
              <li key={`${item.competency}-${item.explanation}`}>
                <strong>{item.competency}</strong>
                <p>{item.explanation}</p>
                <ul>
                  {item.evidence.map((evidence) => (
                    <li key={evidence}>{evidence}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">
            입력 내용에서 역량과 직접 연결되는 근거가 충분히 확인되지
            않았습니다.
          </p>
        )}
      </div>

      <div className="detail-section">
        <h3>원본 근거</h3>
        {analysis.evidence.length > 0 ? (
          <ul className="analysis-evidence-list">
            {analysis.evidence.map((item, index) => (
              <li key={`${item.source}-${item.quote}-${index}`}>
                <span>{EVIDENCE_SOURCE_LABELS[item.source]}</span>
                <q>{item.quote}</q>
                <p>{item.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">
            저장된 분석에 별도 원본 근거가 없습니다. 다시 분석하면 v2 근거
            구조가 생성됩니다.
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
        {analysis.evidenceGaps.length > 0 ? (
          <ul className="analysis-structured-list">
            {analysis.evidenceGaps.map((gap) => (
              <li key={`${gap.topic}-${gap.question}`}>
                <strong>{gap.topic}</strong>
                <p>{gap.reason}</p>
                <p className="analysis-follow-up">{gap.question}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">
            현재 분석에서 별도로 분리한 부족 정보가 없습니다.
          </p>
        )}
      </div>

      <div className="detail-section">
        <h3>자소서 소재 각도</h3>
        {analysis.coverLetterAngles.length > 0 ? (
          <ul className="analysis-structured-list">
            {analysis.coverLetterAngles.map((item) => (
              <li key={`${item.title}-${item.angle}`}>
                <strong>{item.title}</strong>
                <p>{item.angle}</p>
                {item.supportingEvidence.length > 0 ? (
                  <ul>
                    {item.supportingEvidence.map((evidence) => (
                      <li key={evidence}>{evidence}</li>
                    ))}
                  </ul>
                ) : null}
                {item.caution ? (
                  <p className="analysis-caution">{item.caution}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">
            현재 기록만으로 바로 제안할 자소서 소재 각도가 충분하지 않습니다.
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
