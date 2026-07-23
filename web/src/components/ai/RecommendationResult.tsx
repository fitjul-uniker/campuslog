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
import { AIProcessingPanel } from "@/components/ai/AIProcessingPanel";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import {
  ANSWER_DRAFT_TARGET_GUIDES,
  ANSWER_DRAFT_TYPE_LABELS,
  countAnswerDraftCharacters,
  getAnswerDraftCharacterLimit,
} from "@/lib/answerDraftResult";
import { requestAnswerDrafts } from "@/lib/answerDraftApi";
import { mergeAnalysisGapAnswersIntoAnalysis } from "@/lib/analysisGapAnswers";
import { formatDateTime } from "@/lib/date";
import {
  getGenerationOptionsForPurpose,
  getRecommendationPurposeConfig,
  type RecommendationGenerationOption,
} from "@/lib/recommendationPurposeConfig";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  ActiveAnswerDraftType,
  AnswerDraft,
  AnswerDraftResult,
  AnswerDraftType,
  Experience,
  JdFinalVerdict,
  JdRequirementCategory,
  JdRequirementStatus,
  RecommendationMatch,
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

const FIT_LEVEL_LABELS = {
  high: "높음",
  medium: "보통",
  low: "낮음",
} as const;

const JD_REQUIREMENT_CATEGORY_LABELS: Record<JdRequirementCategory, string> = {
  responsibility: "담당 업무",
  required_qualification: "필수 자격요건",
  preferred_qualification: "우대사항",
  tech_stack: "기술 스택",
  required_experience: "요구 경험",
};

const JD_REQUIREMENT_STATUS_LABELS: Record<JdRequirementStatus, string> = {
  met: "충족",
  partially_met: "부분 충족",
  insufficient_evidence: "근거 부족",
  not_met: "미충족",
};

const JD_FINAL_VERDICT_LABELS: Record<JdFinalVerdict, string> = {
  recommended: "지원 추천",
  challenge_possible: "도전 지원 가능",
  needs_improvement: "현재는 보완 필요",
};

function hasListContent(values: string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

function getInitialDraftType(
  draftResult: AnswerDraftResult,
  generationOptions: RecommendationGenerationOption[],
): ActiveAnswerDraftType {
  return (
    generationOptions.find((option) =>
      draftResult.drafts.some((draft) => draft.type === option.type),
    )?.type ??
    generationOptions[0]?.type ??
    "custom"
  );
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
  experienceId,
  selectedType,
  onSelectType,
  isGenerating,
  isGenerateDisabled,
  onGenerate,
  generationOptions,
  primaryActionLabel,
}: {
  draftResult?: AnswerDraftResult;
  experienceId: string;
  selectedType: ActiveAnswerDraftType;
  onSelectType: (type: ActiveAnswerDraftType) => void;
  isGenerating: boolean;
  isGenerateDisabled: boolean;
  onGenerate: (type: ActiveAnswerDraftType) => void;
  generationOptions: RecommendationGenerationOption[];
  primaryActionLabel: string;
}) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const activeDraft = findDraftByType(draftResult, selectedType);
  const activeLabel = ANSWER_DRAFT_TYPE_LABELS[selectedType];
  const activeCharacterLimit = getAnswerDraftCharacterLimit(selectedType);
  const activeCharacterCount = activeDraft
    ? countAnswerDraftCharacters(activeDraft.content)
    : 0;
  const isActiveDraftWithinCharacterLimit =
    !activeDraft ||
    !activeCharacterLimit ||
    (activeCharacterCount >= activeCharacterLimit.min &&
      activeCharacterCount <= activeCharacterLimit.max);
  const missingEvidenceHeading = selectedType.startsWith("cover_letter_")
    ? "추가하면 좋은 정보 / 수정할 부분"
    : "부족한 근거";

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
        {generationOptions.map((option) => {
          const hasDraft = Boolean(findDraftByType(draftResult, option.type));
          const isActive = selectedType === option.type;

          return (
            <button
              key={option.type}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-has-draft={hasDraft ? "true" : "false"}
              className={
                isActive
                  ? "answer-draft-tab is-active"
                  : "answer-draft-tab"
              }
              disabled={isGenerateDisabled}
              onClick={() => onSelectType(option.type)}
            >
              <span>{option.label}</span>
              <small>{option.description}</small>
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
            {activeDraft && activeCharacterLimit ? (
              <p
                className={
                  isActiveDraftWithinCharacterLimit
                    ? "answer-draft-character-count"
                    : "answer-draft-character-count is-out-of-range"
                }
              >
                공백 포함 {activeCharacterCount}자
              </p>
            ) : null}
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

        <RippleButton
          className="button button-secondary answer-draft-generate-button"
          type="button"
          disabled={isGenerateDisabled}
          onClick={() => onGenerate(selectedType)}
        >
          {isGenerating ? (
            <Loader2 className="button-icon is-spinning" aria-hidden="true" />
          ) : (
            <FileText className="button-icon" aria-hidden="true" />
          )}
          {activeDraft ? `${activeLabel} 다시 생성` : primaryActionLabel}
          <RippleButtonRipples />
        </RippleButton>

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
              <h6>{missingEvidenceHeading}</h6>
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

        {activeDraft &&
        (hasListContent(activeDraft.missingEvidenceNotes) ||
          hasListContent(activeDraft.cautions)) ? (
          <Link
            href={`/experiences/${experienceId}/analysis`}
            className="recommendation-match-link answer-draft-followup-link"
          >
            분석 보완하기
          </Link>
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
    Record<string, ActiveAnswerDraftType>
  >({});
  const [generatingDraftKey, setGeneratingDraftKey] =
    useState<string | null>(null);
  const [answerDraftError, setAnswerDraftError] = useState<
    Record<string, string>
  >({});
  const isEmbedded = variant === "embedded";
  const purposeConfig = getRecommendationPurposeConfig(result.purpose);
  const generationOptions = getGenerationOptionsForPurpose(result.purpose);
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
        storedDrafts.reduce<Record<string, ActiveAnswerDraftType>>(
          (draftTypes, draft) => ({
            ...draftTypes,
            [draft.experienceId]: getInitialDraftType(
              draft,
              generationOptions,
            ),
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
  }, [generationOptions, result.id]);

  async function handleGenerateAnswerDrafts(
    match: RecommendationMatch,
    draftType: ActiveAnswerDraftType,
  ) {
    if (generatingDraftKey) {
      return;
    }

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
      const [analysis, followups] = await Promise.all([
        repository.analyses.getByExperienceId(match.experienceId),
        repository.experienceFollowups.listByExperienceId(match.experienceId),
      ]);
      const response = await requestAnswerDrafts({
        draftType,
        recommendation: result,
        match,
        experience: matchedExperience,
        analysis: analysis
          ? mergeAnalysisGapAnswersIntoAnalysis(analysis, followups)
          : null,
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
    } catch (error) {
      console.error("CampusLog answer draft generation failed", error);
      setAnswerDraftError((currentErrors) => ({
        ...currentErrors,
        [match.experienceId]: getErrorMessage(
          error,
          "답변 초안 생성 중 문제가 발생했습니다. 다시 시도해 주세요.",
        ),
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
        <p>{purposeConfig.inputLabel}</p>
      </div>

      <div className="detail-section">
        <h3>{result.purpose === "jd" ? "채용공고 / 질문" : "질문 / 문항"}</h3>
        <p>{result.prompt}</p>
      </div>

      {hasRequirements ? (
        <div className="detail-section recommendation-requirements-section">
          <h3>질문 또는 요구사항 분석</h3>
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

      {result.purpose === "jd" && result.jdAnalysis ? (
        <div className="detail-section recommendation-jd-section">
          <div className="recommendation-section-heading">
            <div>
              <h3>JD 분석</h3>
              <p className="muted-text">Job Description</p>
            </div>
            <span
              className="recommendation-jd-verdict"
              data-verdict={result.jdAnalysis.finalVerdict}
            >
              {JD_FINAL_VERDICT_LABELS[result.jdAnalysis.finalVerdict]}
            </span>
          </div>

          {result.jdAnalysis.summary ? (
            <p className="recommendation-requirements-intent">
              {result.jdAnalysis.summary}
            </p>
          ) : null}

          <div className="recommendation-requirements-grid">
            {hasListContent(result.jdAnalysis.responsibilities) ? (
              <div>
                <h4>담당 업무</h4>
                <ul className="recommendation-compact-list">
                  {result.jdAnalysis.responsibilities.map((item, index) => (
                    <li key={`jd-responsibility-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {hasListContent(result.jdAnalysis.requiredQualifications) ? (
              <div>
                <h4>필수요건</h4>
                <ul className="recommendation-compact-list">
                  {result.jdAnalysis.requiredQualifications.map(
                    (item, index) => (
                      <li key={`jd-required-${index}`}>{item}</li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
            {hasListContent(result.jdAnalysis.preferredQualifications) ? (
              <div>
                <h4>우대사항</h4>
                <ul className="recommendation-compact-list">
                  {result.jdAnalysis.preferredQualifications.map(
                    (item, index) => (
                      <li key={`jd-preferred-${index}`}>{item}</li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}
            {hasListContent(result.jdAnalysis.techStack) ? (
              <div>
                <h4>기술 스택</h4>
                <div className="experience-tags">
                  {result.jdAnalysis.techStack.map((item, index) => (
                    <span key={`jd-tech-${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {hasListContent(result.jdAnalysis.requiredExperience) ? (
              <div>
                <h4>요구 경험</h4>
                <ul className="recommendation-compact-list">
                  {result.jdAnalysis.requiredExperience.map((item, index) => (
                    <li key={`jd-experience-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {result.jdAnalysis.requirementMatches.length > 0 ? (
            <div className="recommendation-jd-match-table">
              <h4>요구사항별 경험 매칭</h4>
              <div className="recommendation-jd-match-list">
                {result.jdAnalysis.requirementMatches.map((item, index) => (
                  <article key={`${item.category}-${item.requirement}-${index}`}>
                    <div>
                      <span>
                        {JD_REQUIREMENT_CATEGORY_LABELS[item.category]}
                      </span>
                      <strong>{item.requirement}</strong>
                    </div>
                    <span data-status={item.status}>
                      {JD_REQUIREMENT_STATUS_LABELS[item.status]}
                    </span>
                    {hasListContent(item.evidence) ? (
                      <ul className="recommendation-compact-list">
                        {item.evidence.map((evidenceItem, evidenceIndex) => (
                          <li key={`jd-evidence-${index}-${evidenceIndex}`}>
                            {evidenceItem}
                          </li>
                        ))}
                      </ul>
                    ) : item.missingEvidence ? (
                      <p className="muted-text">{item.missingEvidence}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="recommendation-match-details">
            <div>
              <h5>지원 시 강조할 내용</h5>
              <DraftEvidenceList
                items={result.jdAnalysis.emphasisPoints}
                emptyText="추천 경험을 먼저 확인해 주세요."
              />
            </div>
            <div>
              <h5>부족한 역량과 근거</h5>
              <DraftEvidenceList
                items={result.jdAnalysis.gaps}
                emptyText="분리된 부족 역량 없음"
              />
            </div>
            <div>
              <h5>과장하면 안 되는 부분</h5>
              <DraftEvidenceList
                items={result.jdAnalysis.overclaimRisks}
                emptyText="기록 밖 사실 추가만 피하면 됩니다."
                isRisk
              />
            </div>
          </div>

          {result.jdAnalysis.finalVerdictReason ? (
            <div className="recommendation-match-angle">
              <h5>최종 지원 판단</h5>
              <p>{result.jdAnalysis.finalVerdictReason}</p>
            </div>
          ) : null}
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
                ? getInitialDraftType(answerDrafts, generationOptions)
                : generationOptions[0]?.type ?? "custom");
            const isGeneratingDraft =
              generatingDraftKey ===
              `${match.experienceId}:${selectedDraftType}`;
            const draftError = answerDraftError[match.experienceId];
            const hasFollowupSignal =
              hasListContent(match.missingEvidence) ||
              hasListContent(match.overclaimRisks);
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

                <div className="recommendation-match-reason">
                  <h5>추천 이유</h5>
                  <p>{match.matchReason}</p>
                </div>

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
                    <h5>직접 근거</h5>
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
                        원본 경험 또는 보완 답변에서 확인된 근거가 적습니다.
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
                    {hasFollowupSignal ? (
                      <Link
                        href={`/experiences/${matchedExperience.id}/analysis`}
                        className="recommendation-match-link"
                      >
                        분석 보완하기
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                {isGeneratingDraft ? (
                  <AIProcessingPanel
                    className="answer-draft-ai-processing"
                    title="선택한 답변 초안을 생성하고 있어요"
                    description="추천 근거와 원본 경험 안에서만 문장을 만들고, 부족한 근거는 본문과 분리합니다."
                    contextItems={[
                      {
                        label: "선택 경험",
                        value: matchedExperience?.title ?? match.experienceTitle,
                      },
                      {
                        label: "초안 유형",
                        value: ANSWER_DRAFT_TYPE_LABELS[selectedDraftType],
                      },
                      { label: "활용 목적", value: purposeConfig.label },
                      {
                        label: "목표 분량",
                        value: ANSWER_DRAFT_TARGET_GUIDES[selectedDraftType],
                      },
                    ]}
                    steps={[
                      "질문과 선택 경험의 연결 지점을 확인하고 있어요.",
                      "원본 근거를 바탕으로 답변 흐름을 만들고 있어요.",
                      "선택한 글자 수와 맞는지 확인하고 필요하면 문장을 다듬고 있어요.",
                    ]}
                    messages={[
                      {
                        afterMs: 0,
                        text: "선택한 경험과 문항을 다시 확인하고 있어요.",
                      },
                      {
                        afterMs: 7_000,
                        text: "근거가 있는 문장만 사용해 초안을 작성하고 있어요.",
                      },
                      {
                        afterMs: 18_000,
                        text: "답변의 구조와 목표 분량을 다듬고 있어요.",
                      },
                    ]}
                    skeletonVariant="answerDraft"
                    longWaitThresholdMs={24_000}
                    longWaitMessage="자기소개서 분량 조건이 있으면 글자 수를 맞추는 검토 때문에 시간이 더 걸릴 수 있어요."
                  />
                ) : null}

                {draftError ? (
                  <p className="form-error answer-draft-error" role="alert">
                    {draftError}
                  </p>
                ) : null}
                {matchedExperience ? (
                  <AnswerDraftViewer
                    draftResult={answerDrafts}
                    experienceId={matchedExperience.id}
                    selectedType={selectedDraftType}
                    onSelectType={(type) =>
                      setSelectedDraftTypes((currentTypes) => ({
                        ...currentTypes,
                        [match.experienceId]: type,
                      }))
                    }
                    isGenerating={isGeneratingDraft}
                    isGenerateDisabled={Boolean(generatingDraftKey)}
                    generationOptions={generationOptions}
                    primaryActionLabel={purposeConfig.primaryActionLabel}
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
            className="button button-secondary recommendation-copy-button"
            content={result.draftSentence}
            size="icon"
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
