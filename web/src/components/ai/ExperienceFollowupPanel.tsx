"use client";

import { AlertTriangle, CheckCircle2, HelpCircle, RefreshCcw, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { requestEvidenceFollowupQuestions } from "@/lib/evidenceFollowupApi";
import { hasAnsweredFollowup } from "@/lib/experienceFollowupResult";
import { formatDateTime } from "@/lib/date";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  Experience,
  ExperienceAnalysis,
  ExperienceFollowup,
  ExperienceFollowupSource,
  ExperienceFollowupTargetEvidenceType,
} from "@/lib/types";

type ExperienceFollowupPanelProps = {
  experience: Experience;
  analysis: ExperienceAnalysis | null;
  isAnalyzing: boolean;
  onReanalyze: () => void;
  onFollowupsChanged: () => void;
};

const SOURCE_LABELS: Record<ExperienceFollowupSource, string> = {
  analysis_gap: "분석 부족 정보",
  recommendation_missing_evidence: "추천 부족 근거",
  recommendation_overclaim_risk: "추천 과장 위험",
  answer_draft_missing_evidence: "초안 부족 근거",
  answer_draft_caution: "초안 과장 주의점",
  manual: "직접 보완",
};

const TARGET_EVIDENCE_LABELS: Record<
  ExperienceFollowupTargetEvidenceType,
  string
> = {
  result_metric: "결과/지표",
  role_scope: "역할 범위",
  collaboration_scope: "협업 범위",
  technical_detail: "기술 세부",
  process_detail: "과정 세부",
  decision_reason: "판단 이유",
  learning: "배운 점",
  other: "기타",
};

function getAnswerKey(followupId: string, questionId: string): string {
  return `${followupId}:${questionId}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

function createDraftAnswers(
  followups: ExperienceFollowup[],
): Record<string, string> {
  return followups.reduce<Record<string, string>>((drafts, followup) => {
    followup.answers.forEach((answer) => {
      drafts[getAnswerKey(followup.id, answer.questionId)] = answer.answer;
    });

    return drafts;
  }, {});
}

function mergeSavedAnswersIntoDrafts(
  currentDrafts: Record<string, string>,
  followups: ExperienceFollowup[],
  overwriteKeys: string[] = [],
): Record<string, string> {
  const savedDrafts = createDraftAnswers(followups);
  const keysToOverwrite = new Set(overwriteKeys);

  return Object.entries(savedDrafts).reduce(
    (nextDrafts, [answerKey, savedAnswer]) => {
      if (
        keysToOverwrite.has(answerKey) ||
        currentDrafts[answerKey] === undefined
      ) {
        return {
          ...nextDrafts,
          [answerKey]: savedAnswer,
        };
      }

      return nextDrafts;
    },
    { ...currentDrafts },
  );
}

export function ExperienceFollowupPanel({
  experience,
  analysis,
  isAnalyzing,
  onReanalyze,
  onFollowupsChanged,
}: ExperienceFollowupPanelProps) {
  const [followups, setFollowups] = useState<ExperienceFollowup[]>([]);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savingAnswerKey, setSavingAnswerKey] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const hasAnalysisGaps = Boolean(analysis?.evidenceGaps.length);
  const answeredFollowupCount = useMemo(
    () => followups.filter(hasAnsweredFollowup).length,
    [followups],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadFollowups() {
      setIsLoading(true);
      setError("");

      try {
        const repository = getCampusLogRepository();
        const storedFollowups =
          await repository.experienceFollowups.listByExperienceId(
            experience.id,
          );

        if (!isMounted) {
          return;
        }

        setFollowups(storedFollowups);
        setDraftAnswers(createDraftAnswers(storedFollowups));
      } catch (error) {
        console.error("CampusLog followup load failed", error);
        if (isMounted) {
          setFollowups([]);
          setDraftAnswers({});
          setError(getErrorMessage(error, "보완 질문을 불러오지 못했습니다."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFollowups();

    return () => {
      isMounted = false;
    };
  }, [experience.id]);

  async function handleGenerateFollowup() {
    if (!analysis || !hasAnalysisGaps) {
      setError("현재 분석에서 질문으로 바꿀 부족 정보가 없습니다.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setMessage("");

    const response = await requestEvidenceFollowupQuestions({
      experience,
      analysis,
      source: "analysis_gap",
    });

    if (!response.ok) {
      setError(response.error.message);
      setIsGenerating(false);
      return;
    }

    try {
      const repository = getCampusLogRepository();
      const savedFollowup = await repository.experienceFollowups.save(
        response.followup,
      );

      if (!savedFollowup) {
        setError("보완 질문을 저장하지 못했습니다.");
        setIsGenerating(false);
        return;
      }

      const nextFollowups = [
        savedFollowup,
        ...followups.filter((followup) => followup.id !== savedFollowup.id),
      ];
      setFollowups(nextFollowups);
      setDraftAnswers((currentDrafts) =>
        mergeSavedAnswersIntoDrafts(currentDrafts, nextFollowups),
      );
      setMessage("보완 질문을 생성했습니다.");
    } catch (error) {
      console.error("CampusLog followup save failed", error);
      setError(getErrorMessage(error, "보완 질문 저장 중 문제가 발생했습니다."));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveAnswer(followupId: string, questionId: string) {
    const answerKey = getAnswerKey(followupId, questionId);
    const answer = draftAnswers[answerKey]?.trim() ?? "";

    if (!answer) {
      setError("보완 답변을 입력한 뒤 저장해 주세요.");
      return;
    }

    setSavingAnswerKey(answerKey);
    setError("");
    setMessage("");

    try {
      const repository = getCampusLogRepository();
      const savedFollowup =
        await repository.experienceFollowups.answerQuestion(
          followupId,
          questionId,
          answer,
        );

      if (!savedFollowup) {
        setError("보완 답변을 저장하지 못했습니다.");
        return;
      }

      const nextFollowups = followups.map((followup) =>
        followup.id === savedFollowup.id ? savedFollowup : followup,
      );
      setFollowups(nextFollowups);
      setDraftAnswers((currentDrafts) =>
        mergeSavedAnswersIntoDrafts(currentDrafts, nextFollowups, [answerKey]),
      );
      setMessage("보완 답변을 저장했습니다.");
      onFollowupsChanged();
    } catch (error) {
      console.error("CampusLog followup answer save failed", error);
      setError(getErrorMessage(error, "보완 답변 저장 중 문제가 발생했습니다."));
    } finally {
      setSavingAnswerKey(null);
    }
  }

  async function handleDismiss(followupId: string) {
    setDismissingId(followupId);
    setError("");
    setMessage("");

    try {
      const repository = getCampusLogRepository();
      const dismissedFollowup =
        await repository.experienceFollowups.dismiss(followupId);

      if (!dismissedFollowup) {
        setError("보완 질문을 숨기지 못했습니다.");
        return;
      }

      setFollowups((currentFollowups) =>
        currentFollowups.map((followup) =>
          followup.id === dismissedFollowup.id ? dismissedFollowup : followup,
        ),
      );
      setMessage("보완 질문을 숨겼습니다.");
    } catch (error) {
      console.error("CampusLog followup dismiss failed", error);
      setError(getErrorMessage(error, "보완 질문 처리 중 문제가 발생했습니다."));
    } finally {
      setDismissingId(null);
    }
  }

  async function handleRestore(followupId: string) {
    setRestoringId(followupId);
    setError("");
    setMessage("");

    try {
      const repository = getCampusLogRepository();
      const restoredFollowup =
        await repository.experienceFollowups.restore(followupId);

      if (!restoredFollowup) {
        setError("숨긴 보완 질문을 복원하지 못했습니다.");
        return;
      }

      setFollowups((currentFollowups) =>
        currentFollowups.map((followup) =>
          followup.id === restoredFollowup.id ? restoredFollowup : followup,
        ),
      );
      setDraftAnswers((currentDrafts) =>
        mergeSavedAnswersIntoDrafts(currentDrafts, [restoredFollowup]),
      );
      setMessage("숨긴 보완 질문을 복원했습니다.");
    } catch (error) {
      console.error("CampusLog followup restore failed", error);
      setError(getErrorMessage(error, "보완 질문 복원 중 문제가 발생했습니다."));
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <section className="detail-panel followup-panel" aria-labelledby="followup-title">
      <div className="detail-header">
        <div>
          <p className="experience-meta">{experience.title}</p>
          <h2 id="followup-title">기록 보완 질문</h2>
        </div>
      </div>

      <div className="followup-intro">
        <HelpCircle aria-hidden="true" />
        <p>
          보완 답변은 원본 활동 내용과 별도로 저장됩니다. 실제로 기억하거나
          기록에서 확인할 수 있는 내용만 적고, 없는 수치나 역할은 만들지
          않아도 됩니다.
        </p>
      </div>

      <div className="followup-actions">
        <RippleButton
          className="button button-primary"
          type="button"
          onClick={handleGenerateFollowup}
          disabled={isGenerating || !hasAnalysisGaps}
        >
          <Sparkles className="button-icon" aria-hidden="true" />
          {isGenerating ? "질문 생성 중..." : "부족한 정보로 질문 만들기"}
          <RippleButtonRipples />
        </RippleButton>
        {answeredFollowupCount > 0 ? (
          <RippleButton
            className="button button-secondary"
            type="button"
            onClick={onReanalyze}
            disabled={isAnalyzing}
          >
            <RefreshCcw className="button-icon" aria-hidden="true" />
            {isAnalyzing ? "분석 중..." : "보완 답변으로 다시 분석"}
            <RippleButtonRipples />
          </RippleButton>
        ) : null}
      </div>

      {!hasAnalysisGaps ? (
        <p className="muted-text">
          현재 분석에는 질문으로 바꿀 부족 정보가 없습니다.
        </p>
      ) : null}

      {message ? (
        <p className="copy-status" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="muted-text">보완 질문을 불러오는 중입니다.</p>
      ) : followups.length > 0 ? (
        <div className="followup-list">
          {followups.map((followup) => (
            <article
              className="followup-card"
              key={followup.id}
              data-status={followup.status}
            >
              <div className="followup-card-header">
                <div>
                  <span>{SOURCE_LABELS[followup.source]}</span>
                  <h3>
                    {followup.status === "dismissed"
                      ? "숨긴 보완 질문"
                      : followup.status === "answered"
                        ? "답변 완료"
                        : "답변 대기"}
                  </h3>
                  <p>생성일 {formatDateTime(followup.generatedAt)}</p>
                </div>
                {followup.status === "answered" ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : followup.status === "dismissed" ? (
                  <X aria-hidden="true" />
                ) : (
                  <AlertTriangle aria-hidden="true" />
                )}
              </div>

              {followup.questions.map((question) => {
                const answerKey = getAnswerKey(followup.id, question.id);
                const savedAnswer = followup.answers.find(
                  (answer) => answer.questionId === question.id,
                );
                const isSaving = savingAnswerKey === answerKey;

                return (
                  <div className="followup-question" key={question.id}>
                    <div className="followup-question-prompt">
                      <span>
                        {TARGET_EVIDENCE_LABELS[question.targetEvidenceType]}
                      </span>
                      <h4>{question.question}</h4>
                    </div>

                    {followup.status === "dismissed" ? (
                      savedAnswer ? (
                        <p className="followup-saved-answer">
                          {savedAnswer.answer}
                        </p>
                      ) : null
                    ) : (
                      <>
                        <label className="sr-only" htmlFor={answerKey}>
                          보완 답변
                        </label>
                        <textarea
                          id={answerKey}
                          className="followup-answer-input"
                          value={draftAnswers[answerKey] ?? ""}
                          rows={4}
                          maxLength={1600}
                          placeholder="실제로 확인되는 내용만 적어주세요."
                          onChange={(event) =>
                            setDraftAnswers((currentDrafts) => ({
                              ...currentDrafts,
                              [answerKey]: event.target.value,
                            }))
                          }
                        />
                        <div className="followup-question-actions">
                          {savedAnswer ? (
                            <span>
                              마지막 저장 {formatDateTime(savedAnswer.updatedAt)}
                            </span>
                          ) : null}
                          <RippleButton
                            className="button button-secondary"
                            type="button"
                            onClick={() =>
                              handleSaveAnswer(followup.id, question.id)
                            }
                            disabled={isSaving}
                          >
                            {isSaving ? "저장 중..." : "답변 저장"}
                            <RippleButtonRipples />
                          </RippleButton>
                        </div>
                      </>
                    )}

                    <div className="followup-question-support">
                      <p>{question.reason}</p>
                      {question.caution ? (
                        <p className="analysis-caution">{question.caution}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {followup.status === "dismissed" ? (
                <button
                  className="button button-secondary followup-restore-button"
                  type="button"
                  onClick={() => handleRestore(followup.id)}
                  disabled={restoringId === followup.id}
                >
                  <RefreshCcw className="button-icon" aria-hidden="true" />
                  {restoringId === followup.id ? "복원 중..." : "질문 복원"}
                </button>
              ) : (
                <button
                  className="button button-ghost followup-dismiss-button"
                  type="button"
                  onClick={() => handleDismiss(followup.id)}
                  disabled={dismissingId === followup.id}
                >
                  <X className="button-icon" aria-hidden="true" />
                  {dismissingId === followup.id ? "처리 중..." : "질문 숨기기"}
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-text">
          아직 저장된 보완 질문이 없습니다. 부족한 정보가 있으면 질문을 만든
          뒤 답변을 별도로 저장할 수 있습니다.
        </p>
      )}
    </section>
  );
}
