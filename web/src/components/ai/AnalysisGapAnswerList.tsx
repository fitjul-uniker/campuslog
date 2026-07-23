"use client";

import { AlertTriangle, CheckCircle2, PencilLine, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { formatDateTime } from "@/lib/date";
import {
  createAnalysisGapFollowup,
  getAnalysisGapAnswerItems,
  type AnalysisGapAnswerItem,
} from "@/lib/analysisGapAnswers";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type {
  Experience,
  ExperienceAnalysis,
  ExperienceFollowup,
} from "@/lib/types";

type AnalysisGapAnswerListProps = {
  experience: Experience;
  analysis: ExperienceAnalysis;
};

const CATEGORY_LABELS: Record<string, string> = {
  result_metric: "결과/지표",
  role_scope: "역할 범위",
  collaboration_scope: "협업 범위",
  technical_detail: "기술 세부",
  process_detail: "과정 세부",
  decision_reason: "판단 이유",
  learning: "배운 점",
  other: "기타",
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function createDraftAnswers(
  items: AnalysisGapAnswerItem[],
): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, item.answer]));
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

export function AnalysisGapAnswerList({
  experience,
  analysis,
}: AnalysisGapAnswerListProps) {
  const [followups, setFollowups] = useState<ExperienceFollowup[]>([]);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingGapId, setSavingGapId] = useState<string | null>(null);
  const [savedGapIds, setSavedGapIds] = useState<Set<string>>(new Set());
  const [errorByGapId, setErrorByGapId] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");

  const answerItems = useMemo(
    () => getAnalysisGapAnswerItems(analysis, followups),
    [analysis, followups],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadGapAnswers() {
      setIsLoading(true);
      setLoadError("");

      try {
        const repository = getCampusLogRepository();
        const storedFollowups =
          await repository.experienceFollowups.listByExperienceId(
            experience.id,
          );

        if (!isMounted) {
          return;
        }

        const items = getAnalysisGapAnswerItems(analysis, storedFollowups);
        setFollowups(storedFollowups);
        setDraftAnswers(createDraftAnswers(items));
      } catch (error) {
        console.error("CampusLog analysis gap answer load failed", error);
        if (isMounted) {
          setFollowups([]);
          setDraftAnswers({});
          setLoadError(
            getErrorMessage(error, "보완 답변을 불러오지 못했습니다."),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGapAnswers();

    return () => {
      isMounted = false;
    };
  }, [analysis, experience.id]);

  async function handleSaveAnswer(item: AnalysisGapAnswerItem) {
    const answer = draftAnswers[item.id]?.trim() ?? "";

    if (!answer) {
      setErrorByGapId((current) => ({
        ...current,
        [item.id]: "보완 답변을 입력한 뒤 저장해 주세요.",
      }));
      return;
    }

    setSavingGapId(item.id);
    setErrorByGapId((current) => ({ ...current, [item.id]: "" }));

    try {
      const repository = getCampusLogRepository();
      let followupId = item.followupId;
      let questionId = item.questionId;

      if (!followupId) {
        const savedFollowup = await repository.experienceFollowups.save(
          createAnalysisGapFollowup(experience.id, item),
        );

        if (!savedFollowup) {
          setErrorByGapId((current) => ({
            ...current,
            [item.id]: "보완 답변을 저장할 준비를 하지 못했습니다.",
          }));
          return;
        }

        followupId = savedFollowup.id;
        questionId = savedFollowup.questions[0]?.id ?? item.id;
        setFollowups((current) => [savedFollowup, ...current]);
      }

      const savedFollowup =
        await repository.experienceFollowups.answerQuestion(
          followupId,
          questionId,
          answer,
        );

      if (!savedFollowup) {
        setErrorByGapId((current) => ({
          ...current,
          [item.id]: "보완 답변을 저장하지 못했습니다.",
        }));
        return;
      }

      await repository.analyses.saveGapAnswer(experience.id, item.id, answer);

      setFollowups((current) => {
        const hasExisting = current.some(
          (followup) => followup.id === savedFollowup.id,
        );

        return hasExisting
          ? current.map((followup) =>
              followup.id === savedFollowup.id ? savedFollowup : followup,
            )
          : [savedFollowup, ...current];
      });
      setDraftAnswers((current) => ({
        ...current,
        [item.id]: answer,
      }));
      setSavedGapIds((current) => new Set(current).add(item.id));
    } catch (error) {
      console.error("CampusLog analysis gap answer save failed", error);
      setErrorByGapId((current) => ({
        ...current,
        [item.id]: getErrorMessage(
          error,
          "보완 답변 저장 중 문제가 발생했습니다.",
        ),
      }));
    } finally {
      setSavingGapId(null);
    }
  }

  if (analysis.evidenceGaps.length === 0) {
    return (
      <p className="muted-text">
        현재 분석에서 별도로 분리한 부족 정보가 없습니다.
      </p>
    );
  }

  if (isLoading) {
    return <p className="muted-text">보완 답변을 불러오는 중입니다.</p>;
  }

  return (
    <div className="analysis-gap-answer-block">
      <div className="analysis-gap-answer-intro">
        <PencilLine aria-hidden="true" />
        <p>
          답변은 원본 경험을 수정하지 않고 분석에 연결된 보완 답변으로
          저장됩니다. 추천에는 바로 반영되며, 요약과 STAR까지 갱신하려면 다시
          분석하기를 사용하세요.
        </p>
      </div>

      {loadError ? (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="analysis-gap-answer-list">
        {answerItems.map((item) => {
          const draftAnswer = draftAnswers[item.id] ?? "";
          const savedAnswer = item.answer.trim();
          const isSaving = savingGapId === item.id;
          const isEditing = draftAnswer.trim() !== savedAnswer;
          const hasDraft = draftAnswer.trim().length > 0;
          const error = errorByGapId[item.id];
          const wasSavedNow = savedGapIds.has(item.id);

          return (
            <article
              className="analysis-gap-answer-card"
              key={item.id}
              data-answered={savedAnswer ? "true" : "false"}
            >
              <div className="analysis-gap-answer-card-header">
                <div>
                  <span>{getCategoryLabel(item.category)}</span>
                  <h4>{item.title}</h4>
                </div>
                {savedAnswer ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <AlertTriangle aria-hidden="true" />
                )}
              </div>

              <p className="analysis-gap-reason">{item.reason}</p>
              <p className="analysis-gap-question">{item.question}</p>

              {savedAnswer ? (
                <div className="analysis-gap-saved-answer">
                  <strong>저장된 답변</strong>
                  <p>{savedAnswer}</p>
                </div>
              ) : null}

              <label className="sr-only" htmlFor={`gap-answer-${item.id}`}>
                {item.title} 보완 답변
              </label>
              <textarea
                id={`gap-answer-${item.id}`}
                className="analysis-gap-answer-input"
                value={draftAnswer}
                rows={4}
                maxLength={1600}
                placeholder="실제로 기억하거나 기록에서 확인할 수 있는 내용만 적어주세요."
                onChange={(event) => {
                  setDraftAnswers((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }));
                  setSavedGapIds((current) => {
                    const next = new Set(current);
                    next.delete(item.id);
                    return next;
                  });
                  setErrorByGapId((current) => ({
                    ...current,
                    [item.id]: "",
                  }));
                }}
              />

              <div className="analysis-gap-answer-actions">
                <span>
                  {isSaving
                    ? "저장 중"
                    : error
                      ? "저장 실패"
                      : isEditing && savedAnswer
                        ? "기존 답변 수정 중"
                        : isEditing && hasDraft
                          ? "답변 작성 중"
                          : savedAnswer
                            ? wasSavedNow
                              ? "저장 완료"
                              : `마지막 저장 ${formatDateTime(item.updatedAt ?? item.answeredAt ?? "")}`
                            : "답변 없음"}
                </span>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => handleSaveAnswer(item)}
                  disabled={isSaving || !hasDraft || (!isEditing && Boolean(savedAnswer))}
                >
                  <Save className="button-icon" aria-hidden="true" />
                  {isSaving ? "저장 중..." : savedAnswer ? "수정 저장" : "답변 저장"}
                </button>
              </div>

              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
