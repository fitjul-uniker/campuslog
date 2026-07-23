import { createIsoTimestamp } from "@/lib/date";
import {
  EXPERIENCE_FOLLOWUP_SCHEMA_VERSION,
  isExperienceFollowupTargetEvidenceType,
} from "@/lib/experienceFollowupResult";
import type {
  ExperienceAnalysis,
  ExperienceAnalysisEvidenceGap,
  ExperienceFollowup,
  ExperienceFollowupAnswer,
  ExperienceFollowupQuestion,
  ExperienceFollowupTargetEvidenceType,
} from "@/lib/types";

export type AnalysisGapAnswerItem = ExperienceAnalysisEvidenceGap & {
  followupId: string;
  questionId: string;
  targetEvidenceType: ExperienceFollowupTargetEvidenceType;
};

const DEFAULT_GAP_ANSWER_CAUTION =
  "실제로 확인되는 내용만 답하고, 기억나지 않으면 비워두세요.";

function hashText(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function compactText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]+/gi, "");
}

function getTargetEvidenceTypeForGap(
  gap: ExperienceAnalysisEvidenceGap,
): ExperienceFollowupTargetEvidenceType {
  if (isExperienceFollowupTargetEvidenceType(gap.category)) {
    return gap.category;
  }

  const haystack = `${gap.category} ${gap.title} ${gap.reason} ${gap.question}`;

  if (/수치|지표|조회|반응|성과|결과/.test(haystack)) {
    return "result_metric";
  }

  if (/역할|기여|책임|범위/.test(haystack)) {
    return "role_scope";
  }

  if (/협업|팀|동료|함께/.test(haystack)) {
    return "collaboration_scope";
  }

  if (/기술|모델|도구|스택|구현/.test(haystack)) {
    return "technical_detail";
  }

  if (/과정|행동|방법|실행|제작|분석/.test(haystack)) {
    return "process_detail";
  }

  if (/이유|판단|선택|의사결정/.test(haystack)) {
    return "decision_reason";
  }

  if (/배운|학습|느낀|회고/.test(haystack)) {
    return "learning";
  }

  return "other";
}

function getAnalysisGapFollowupId(
  experienceId: string,
  gap: ExperienceAnalysisEvidenceGap,
): string {
  return `analysis-gap-${hashText(`${experienceId}:${gap.id}`)}`;
}

function getMatchedQuestion(
  gap: ExperienceAnalysisEvidenceGap,
  followups: ExperienceFollowup[],
):
  | {
      followup: ExperienceFollowup;
      question: ExperienceFollowupQuestion;
      answer: ExperienceFollowupAnswer | null;
    }
  | null {
  const comparableQuestion = compactText(gap.question);

  const candidates = followups.flatMap((followup) => {
    if (followup.source !== "analysis_gap" || followup.status === "dismissed") {
      return [];
    }

    return followup.questions.flatMap((question) => {
      const isMatch =
        question.id === gap.id ||
        (comparableQuestion &&
          compactText(question.question) === comparableQuestion);

      if (!isMatch) {
        return [];
      }

      return [
        {
          followup,
          question,
          answer:
            followup.answers.find(
              (item) => item.questionId === question.id,
            ) ?? null,
        },
      ];
    });
  });

  return (
    candidates.find((candidate) => candidate.answer?.answer.trim()) ??
    candidates[0] ??
    null
  );
}

export function getAnalysisGapAnswerItems(
  analysis: ExperienceAnalysis,
  followups: ExperienceFollowup[],
): AnalysisGapAnswerItem[] {
  return analysis.evidenceGaps.map((gap) => {
    const matchedQuestion = getMatchedQuestion(gap, followups);
    const savedAnswer =
      matchedQuestion?.answer?.answer.trim() || gap.answer.trim();
    const updatedAt =
      matchedQuestion?.answer?.updatedAt ||
      gap.updatedAt ||
      gap.answeredAt ||
      "";

    return {
      ...gap,
      answer: savedAnswer,
      answeredAt:
        matchedQuestion?.answer?.updatedAt || gap.answeredAt || undefined,
      updatedAt,
      followupId: matchedQuestion?.followup.id ?? "",
      questionId: matchedQuestion?.question.id ?? gap.id,
      targetEvidenceType:
        matchedQuestion?.question.targetEvidenceType ??
        getTargetEvidenceTypeForGap(gap),
    };
  });
}

export function createAnalysisGapFollowup(
  experienceId: string,
  gap: AnalysisGapAnswerItem,
): ExperienceFollowup {
  const timestamp = createIsoTimestamp();

  return {
    id: getAnalysisGapFollowupId(experienceId, gap),
    schemaVersion: EXPERIENCE_FOLLOWUP_SCHEMA_VERSION,
    experienceId,
    source: "analysis_gap",
    questions: [
      {
        id: gap.id,
        question: gap.question,
        reason: gap.reason,
        targetEvidenceType: gap.targetEvidenceType,
        caution: DEFAULT_GAP_ANSWER_CAUTION,
      },
    ],
    answers: [],
    status: "open",
    generatedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function mergeAnalysisGapAnswersIntoAnalysis(
  analysis: ExperienceAnalysis,
  followups: ExperienceFollowup[],
): ExperienceAnalysis {
  const evidenceGaps = getAnalysisGapAnswerItems(analysis, followups).map(
    (item) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      topic: item.topic,
      reason: item.reason,
      question: item.question,
      answer: item.answer,
      answeredAt: item.answeredAt,
      updatedAt: item.updatedAt ?? "",
    }),
  );

  return {
    ...analysis,
    evidenceGaps,
  };
}
