"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { CopyButton } from "@/components/animate-ui/components/buttons/copy";
import {
  ANSWER_DRAFT_TYPE_LABELS,
  ANSWER_DRAFT_TYPES,
} from "@/lib/answerDraftResult";
import { requestAnswerDrafts } from "@/lib/answerDraftApi";
import { formatDateTime } from "@/lib/date";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  AnswerDraft,
  AnswerDraftResult,
  AnswerDraftType,
  Experience,
  RecommendationMatch,
  RecommendationPurpose,
  RecommendationResult as Result,
} from "@/lib/types";

type RecommendationResultProps = {
  result: Result;
  experience?: Experience | null;
  experiences?: Experience[];
  variant?: "default" | "embedded";
  onClose?: () => void;
};

type CopyStatus = "idle" | "success" | "failed";

const PURPOSE_LABELS: Record<RecommendationPurpose, string> = {
  cover_letter: "자기소개서",
  portfolio: "포트폴리오",
  interview: "면접",
  activity_application: "대외활동/지원서",
  other: "기타",
};

const FIT_LEVEL_LABELS = {
  high: "높음",
  medium: "보통",
  low: "낮음",
} as const;

function hasListContent(values: string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

function getInitialDraftType(draftResult: AnswerDraftResult): AnswerDraftType {
  return draftResult.drafts[0]?.type ?? "cover_letter_500";
}

function findDraftByType(
  draftResult: AnswerDraftResult | undefined,
  type: AnswerDraftType,
): AnswerDraft | undefined {
  return draftResult?.drafts.find((draft) => draft.type === type);
}

function DraftEvidenceList({
  items,
  emptyText,
  isRisk = false,
}: {
  items: string[];
  emptyText: string;
  isRisk?: boolean;
}) {
  return hasListContent(items) ? (
    <ul className={`recommendation-compact-list${isRisk ? " is-risk" : ""}`}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>
          {isRisk ? <AlertTriangle aria-hidden="true" /> : null}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="muted-text">{emptyText}</p>
  );
}

function AnswerDraftViewer({
  draftResult,
  selectedType,
  onSelectType,
  isGenerating,
  onGenerate,
}: {
  draftResult?: AnswerDraftResult;
  selectedType: AnswerDraftType;
  onSelectType: (type: AnswerDraftType) => void;
  isGenerating: boolean;
  onGenerate: (type: AnswerDraftType) => void;
}) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const activeDraft = findDraftByType(draftResult, selectedType);
  const activeLabel = ANSWER_DRAFT_TYPE_LABELS[selectedType];

  useEffect(() => {
    setCopyStatus("idle");
  }, [selectedType]);

  return (
    <div className="answer-draft-viewer">
      <div
        className="answer-draft-tabs"
        role="tablist"
        aria-label="답변 초안 버전"
      >
        {ANSWER_DRAFT_TYPES.map((type) => {
          const hasDraft = Boolean(findDraftByType(draftResult, type));
          const isActive = selectedType === type;

          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-has-draft={hasDraft ? "true" : "false"}
              className={
                isActive
                  ? "answer-draft-tab is-active"
                  : "answer-draft-tab"
              }
              onClick={() => onSelectType(type)}
            >
              {ANSWER_DRAFT_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      <div className="answer-draft-body">
        <div className="answer-draft-heading">
          <div>
            <h5>{activeDraft?.title ?? activeLabel}</h5>
            <p>
              {activeDraft?.targetGuide ??
                `아직 생성하지 않은 ${activeLabel} 초안`}
            </p>
          </div>
          {activeDraft ? (
            <CopyButton
              className="button button-secondary"
              content={activeDraft.content}
              label="본문 복사"
              copiedLabel="복사 완료"
              onCopiedChange={(copied) =>
                setCopyStatus(copied ? "success" : "idle")
              }
              onCopyError={() => setCopyStatus("failed")}
            />
          ) : null}
        </div>

        {activeDraft ? (
          <p className="answer-draft-content">{activeDraft.content}</p>
        ) : (
          <p className="answer-draft-empty">
            선택한 버전의 초안을 아직 생성하지 않았습니다.
          </p>
        )}

        <button
          className="button button-secondary answer-draft-generate-button"
          type="button"
          disabled={isGenerating}
          onClick={() => onGenerate(selectedType)}
        >
          {isGenerating ? (
            <Loader2 className="button-icon is-spinning" aria-hidden="true" />
          ) : (
            <FileText className="button-icon" aria-hidden="true" />
          )}
          {activeDraft ? `${activeLabel} 다시 생성` : `${activeLabel} 생성`}
        </button>

        {copyStatus === "success" ? (
          <p className="copy-status" role="status">
            초안 본문을 클립보드에 복사했습니다.
          </p>
        ) : null}
        {copyStatus === "failed" ? (
          <p className="form-error" role="alert">
            복사에 실패했습니다. 본문을 직접 선택해 복사해주세요.
          </p>
        ) : null}

        {activeDraft ? (
          <div className="answer-draft-evidence-grid">
            <div>
              <h6>사용된 근거</h6>
              <DraftEvidenceList
                items={activeDraft.usedEvidence}
                emptyText="표시할 근거가 없습니다."
              />
            </div>
            <div>
              <h6>부족한 근거</h6>
              <DraftEvidenceList
                items={activeDraft.missingEvidenceNotes}
                emptyText="분리된 부족 근거 없음"
              />
            </div>
            <div>
              <h6>과장 주의점</h6>
              <DraftEvidenceList
                items={activeDraft.cautions}
                emptyText="기록 밖 사실 추가만 피하면 됩니다."
                isRisk
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function RecommendationResult({
  result,
  experience,
  experiences = experience ? [experience] : [],
  variant = "default",
  onClose,
}: RecommendationResultProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [answerDraftsByExperienceId, setAnswerDraftsByExperienceId] = useState<
    Record<string, AnswerDraftResult>
  >({});
  const [selectedDraftTypes, setSelectedDraftTypes] = useState<
    Record<string, AnswerDraftType>
  >({});
  const [generatingDraftKey, setGeneratingDraftKey] =
    useState<string | null>(null);
  const [answerDraftError, setAnswerDraftError] = useState<
    Record<string, string>
  >({});
  const isEmbedded = variant === "embedded";
  const requirements = result.extractedRequirements;
  const hasRequirements =
    hasListContent(requirements.requiredCompetencies) ||
    hasListContent(requirements.preferredCompetencies) ||
    hasListContent(requirements.keywords) ||
    hasListContent(requirements.constraints) ||
    requirements.intent.trim().length > 0;
  const matches = result.matches.length > 0
    ? result.matches
    : [
        {
          experienceId: result.recommendedExperienceId,
          experienceTitle: result.recommendedExperienceTitle,
          rank: 1,
          score: 100,
          fitLevel: "high" as const,
          matchReason: result.reason,
          matchedEvidence: result.highlightedAchievement
            ? [result.highlightedAchievement]
            : [],
          missingEvidence: [],
          overclaimRisks: [],
          suggestedAngle: result.usageDirection,
          relatedCompetencies: result.relatedTags,
        },
      ];
  const experiencesById = new Map(
    experiences.map((item) => [item.id, item]),
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAnswerDrafts() {
      const repository = getCampusLogRepository();
      const storedDrafts =
        await repository.answerDrafts.listByRecommendationId(result.id);

      if (!isMounted) {
        return;
      }

      setAnswerDraftsByExperienceId(
        storedDrafts.reduce<Record<string, AnswerDraftResult>>(
          (drafts, draft) => ({
            ...drafts,
            [draft.experienceId]: draft,
          }),
          {},
        ),
      );
      setSelectedDraftTypes(
        storedDrafts.reduce<Record<string, AnswerDraftType>>(
          (draftTypes, draft) => ({
            ...draftTypes,
            [draft.experienceId]: getInitialDraftType(draft),
          }),
          {},
        ),
      );
    }

    setAnswerDraftsByExperienceId({});
    setSelectedDraftTypes({});
    setAnswerDraftError({});
    loadAnswerDrafts().catch(() => {
      if (isMounted) {
        setAnswerDraftsByExperienceId({});
      }
    });

    return () => {
      isMounted = false;
    };
  }, [result.id]);

  async function handleGenerateAnswerDrafts(
    match: RecommendationMatch,
    draftType: AnswerDraftType,
  ) {
    const matchedExperience = experiencesById.get(match.experienceId);
    const draftKey = `${match.experienceId}:${draftType}`;

    if (!matchedExperience) {
      setAnswerDraftError((currentErrors) => ({
        ...currentErrors,
        [match.experienceId]:
          "선택한 경험 원본을 찾지 못해 초안을 생성할 수 없습니다.",
      }));
      return;
    }

    setGeneratingDraftKey(draftKey);
    setAnswerDraftError((currentErrors) => ({
      ...currentErrors,
      [match.experienceId]: "",
    }));

    try {
      const repository = getCampusLogRepository();
      const analysis = await repository.analyses.getByExperienceId(
        match.experienceId,
      );
      const response = await requestAnswerDrafts({
        draftType,
        recommendation: result,
        match,
        experience: matchedExperience,
        analysis,
      });

      if (!response.ok) {
        setAnswerDraftError((currentErrors) => ({
          ...currentErrors,
          [match.experienceId]: response.error.message,
        }));
        return;
      }

      const savedDraft = await repository.answerDrafts.save(
        response.answerDrafts,
      );

      if (!savedDraft) {
        setAnswerDraftError((currentErrors) => ({
          ...currentErrors,
          [match.experienceId]:
            "답변 초안을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        }));
        return;
      }

      setAnswerDraftsByExperienceId((currentDrafts) => ({
        ...currentDrafts,
        [savedDraft.experienceId]: savedDraft,
      }));
      setSelectedDraftTypes((currentTypes) => ({
        ...currentTypes,
        [savedDraft.experienceId]: draftType,
      }));
    } catch {
      setAnswerDraftError((currentErrors) => ({
        ...currentErrors,
        [match.experienceId]:
          "답변 초안 생성 중 문제가 발생했습니다. 다시 시도해 주세요.",
      }));
    } finally {
      setGeneratingDraftKey(null);
    }
  }

  return (
    <section
      className={
        isEmbedded
          ? "recommendation-result is-embedded"
          : "detail-panel recommendation-result"
      }
      aria-labelledby="recommendation-title"
    >
      <div className="detail-header">
        <div>
          <p className="experience-meta recommendation-result-kicker">
            AI 기반 활동 추천 결과
          </p>
          <h2 id="recommendation-title">
            {result.recommendedExperienceTitle}
          </h2>
        </div>
        {experience || onClose ? (
          <div className="recommendation-result-header-actions">
            {experience ? (
              <Link
                href={`/experiences/${experience.id}`}
                className="button button-secondary"
              >
                <ExternalLink className="button-icon" aria-hidden="true" />
                활동
              </Link>
            ) : null}
            {onClose ? (
              <button
                className="dashboard-detail-close"
                type="button"
                onClick={onClose}
                aria-label="추천 기록 상세 닫기"
              >
                <X aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {experience ? (
        <dl className="meta-grid recommendation-meta">
          <div>
            <dt>기간</dt>
            <dd>{experience.period}</dd>
          </div>
          <div>
            <dt>역할</dt>
            <dd>{experience.role}</dd>
          </div>
          <div>
            <dt>추천 생성일</dt>
            <dd>{formatDateTime(result.generatedAt)}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted-text">
          추천 생성일 {formatDateTime(result.generatedAt)}
        </p>
      )}

      <div className="detail-section">
        <h3>활용 목적</h3>
        <p>{PURPOSE_LABELS[result.purpose]}</p>
      </div>

      <div className="detail-section">
        <h3>질문 / 문항</h3>
        <p>{result.prompt}</p>
      </div>

      {hasRequirements ? (
        <div className="detail-section recommendation-requirements-section">
          <h3>추출한 요구사항</h3>
          {requirements.intent ? (
            <p className="recommendation-requirements-intent">
              {requirements.intent}
            </p>
          ) : null}
          <div className="recommendation-requirements-grid">
            {hasListContent(requirements.requiredCompetencies) ? (
              <div>
                <h4>필수 역량</h4>
                <div className="experience-tags">
                  {requirements.requiredCompetencies.map((item, index) => (
                    <span key={`required-${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {hasListContent(requirements.preferredCompetencies) ? (
              <div>
                <h4>우대 역량</h4>
                <div className="experience-tags">
                  {requirements.preferredCompetencies.map((item, index) => (
                    <span key={`preferred-${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {hasListContent(requirements.keywords) ? (
              <div>
                <h4>키워드</h4>
                <div className="experience-tags">
                  {requirements.keywords.map((item, index) => (
                    <span key={`keyword-${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {hasListContent(requirements.constraints) ? (
              <div>
                <h4>제약</h4>
                <ul className="recommendation-compact-list">
                  {requirements.constraints.map((item, index) => (
                    <li key={`constraint-${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="detail-section recommendation-matches-section">
        <h3>추천 경험 Top {matches.length}</h3>
        <div className="recommendation-match-list">
          {matches.map((match) => {
            const matchedExperience = experiencesById.get(match.experienceId);
            const answerDrafts = answerDraftsByExperienceId[match.experienceId];
            const selectedDraftType =
              selectedDraftTypes[match.experienceId] ??
              (answerDrafts
                ? getInitialDraftType(answerDrafts)
                : "cover_letter_500");
            const isGeneratingDraft =
              generatingDraftKey ===
              `${match.experienceId}:${selectedDraftType}`;
            const draftError = answerDraftError[match.experienceId];

            return (
              <article
                className="recommendation-match-card"
                key={`${match.rank}-${match.experienceId}`}
              >
                <div className="recommendation-match-header">
                  <div>
                    <span className="recommendation-match-rank">
                      {match.rank}순위
                    </span>
                    <h4>{match.experienceTitle}</h4>
                  </div>
                  <span
                    className="recommendation-fit-badge"
                    data-fit-level={match.fitLevel}
                  >
                    {FIT_LEVEL_LABELS[match.fitLevel]} · {match.score}
                  </span>
                </div>

                <p>{match.matchReason}</p>

                {hasListContent(match.relatedCompetencies) ? (
                  <div className="experience-tags">
                    {match.relatedCompetencies.map((tag, index) => (
                      <span key={`${match.experienceId}-tag-${tag}-${index}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="recommendation-match-details">
                  <div>
                    <h5>매칭 근거</h5>
                    {hasListContent(match.matchedEvidence) ? (
                      <ul className="recommendation-compact-list">
                        {match.matchedEvidence.map((item, index) => (
                          <li
                            key={`${match.experienceId}-evidence-${index}`}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">
                        확인된 근거가 적어 원본 경험을 함께 검토해 주세요.
                      </p>
                    )}
                  </div>

                  <div>
                    <h5>부족한 근거</h5>
                    {hasListContent(match.missingEvidence) ? (
                      <ul className="recommendation-compact-list">
                        {match.missingEvidence.map((item, index) => (
                          <li key={`${match.experienceId}-missing-${index}`}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">뚜렷한 부족 근거 없음</p>
                    )}
                  </div>

                  <div>
                    <h5>과장 주의점</h5>
                    {hasListContent(match.overclaimRisks) ? (
                      <ul className="recommendation-compact-list is-risk">
                        {match.overclaimRisks.map((item, index) => (
                          <li key={`${match.experienceId}-risk-${index}`}>
                            <AlertTriangle aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">기록 밖 사실 추가만 피하면 됩니다.</p>
                    )}
                  </div>
                </div>

                <div className="recommendation-match-angle">
                  <h5>활용 각도</h5>
                  <p>{match.suggestedAngle}</p>
                </div>

                {matchedExperience ? (
                  <div className="recommendation-match-actions">
                    <Link
                      href={`/experiences/${matchedExperience.id}`}
                      className="recommendation-match-link"
                    >
                      활동 보기
                    </Link>
                  </div>
                ) : null}

                {isGeneratingDraft ? (
                  <p className="answer-draft-status" role="status">
                    선택한 답변 초안을 생성하는 중입니다.
                  </p>
                ) : null}

                {draftError ? (
                  <p className="form-error answer-draft-error" role="alert">
                    {draftError}
                  </p>
                ) : null}

                {matchedExperience ? (
                  <AnswerDraftViewer
                    draftResult={answerDrafts}
                    selectedType={selectedDraftType}
                    onSelectType={(type) =>
                      setSelectedDraftTypes((currentTypes) => ({
                        ...currentTypes,
                        [match.experienceId]: type,
                      }))
                    }
                    isGenerating={isGeneratingDraft}
                    onGenerate={(draftType) =>
                      handleGenerateAnswerDrafts(match, draftType)
                    }
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      <div className="detail-section recommendation-legacy-summary">
        <h3>1순위 요약</h3>
        <p>{result.reason}</p>
        {hasListContent(result.relatedTags) ? (
          <div className="experience-tags">
            {result.relatedTags.map((tag, index) => (
              <span key={`${tag}-${index}`}>{tag}</span>
            ))}
          </div>
        ) : null}
        <p>{result.highlightedAchievement}</p>
        <p>{result.usageDirection}</p>
      </div>

      <div className="detail-section">
        <div className="recommendation-section-heading">
          <h3>참고 문장</h3>
          <CopyButton
            className="button button-secondary"
            content={result.draftSentence}
            onCopiedChange={(copied) =>
              setCopyStatus(copied ? "success" : "idle")
            }
            onCopyError={() => setCopyStatus("failed")}
          />
        </div>
        <p className="draft-sentence">{result.draftSentence}</p>
        {copyStatus === "success" ? (
          <p className="copy-status" role="status">
            참고 문장을 클립보드에 복사했습니다.
          </p>
        ) : null}
        {copyStatus === "failed" ? (
          <p className="form-error" role="alert">
            복사에 실패했습니다. 문장을 직접 선택해 복사해주세요.
          </p>
        ) : null}
      </div>
    </section>
  );
}
