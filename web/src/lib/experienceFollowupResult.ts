import type {
  AnswerDraftType,
  ExperienceFollowup,
  ExperienceFollowupAnswer,
  ExperienceFollowupQuestion,
  ExperienceFollowupSchemaVersion,
  ExperienceFollowupSource,
  ExperienceFollowupStatus,
  ExperienceFollowupTargetEvidenceType,
} from "@/lib/types";

export const EXPERIENCE_FOLLOWUP_SCHEMA_VERSION = "v1" as const;
export const EXPERIENCE_FOLLOWUP_PROMPT_VERSION = "evidence-followups-v1.0";

export const EXPERIENCE_FOLLOWUP_SOURCES = [
  "analysis_gap",
  "recommendation_missing_evidence",
  "recommendation_overclaim_risk",
  "answer_draft_missing_evidence",
  "answer_draft_caution",
  "manual",
] as const satisfies readonly ExperienceFollowupSource[];

export const EXPERIENCE_FOLLOWUP_TARGET_EVIDENCE_TYPES = [
  "result_metric",
  "role_scope",
  "collaboration_scope",
  "technical_detail",
  "process_detail",
  "decision_reason",
  "learning",
  "other",
] as const satisfies readonly ExperienceFollowupTargetEvidenceType[];

const ANSWER_DRAFT_TYPES = [
  "cover_letter_300",
  "cover_letter_500",
  "cover_letter_1000",
  "interview_30s",
  "interview_60s",
  "interview_followups",
  "jd_strategy",
  "custom",
  "cover_letter_800",
  "interview",
  "portfolio",
] as const satisfies readonly AnswerDraftType[];

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isExperienceFollowupSource(
  value: unknown,
): value is ExperienceFollowupSource {
  return EXPERIENCE_FOLLOWUP_SOURCES.includes(
    value as ExperienceFollowupSource,
  );
}

export function isExperienceFollowupTargetEvidenceType(
  value: unknown,
): value is ExperienceFollowupTargetEvidenceType {
  return EXPERIENCE_FOLLOWUP_TARGET_EVIDENCE_TYPES.includes(
    value as ExperienceFollowupTargetEvidenceType,
  );
}

function normalizeStatus(value: unknown): ExperienceFollowupStatus {
  if (value === "answered" || value === "dismissed" || value === "open") {
    return value;
  }

  return "open";
}

function normalizeAnswerDraftType(value: unknown): AnswerDraftType | undefined {
  return ANSWER_DRAFT_TYPES.includes(value as AnswerDraftType)
    ? (value as AnswerDraftType)
    : undefined;
}

export function normalizeExperienceFollowupQuestions(
  value: unknown,
  maxItems: number,
): ExperienceFollowupQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const id = normalizeText(candidate.id);
      const question = normalizeText(candidate.question);
      const reason = normalizeText(candidate.reason);
      const targetEvidenceType = candidate.targetEvidenceType;
      const caution = normalizeText(candidate.caution);

      if (
        !id ||
        seenIds.has(id) ||
        !question ||
        !reason ||
        !isExperienceFollowupTargetEvidenceType(targetEvidenceType)
      ) {
        return null;
      }

      seenIds.add(id);
      return {
        id,
        question,
        reason,
        targetEvidenceType,
        caution,
      } satisfies ExperienceFollowupQuestion;
    })
    .filter(
      (question): question is ExperienceFollowupQuestion => question !== null,
    )
    .slice(0, maxItems);
}

export function normalizeExperienceFollowupAnswers(
  value: unknown,
  questionIds: Set<string>,
  maxItems: number,
): ExperienceFollowupAnswer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenQuestionIds = new Set<string>();

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const questionId = normalizeText(candidate.questionId);
      const answer = normalizeText(candidate.answer);
      const createdAt = normalizeText(candidate.createdAt);
      const updatedAt = normalizeText(candidate.updatedAt);

      if (
        !questionId ||
        !questionIds.has(questionId) ||
        seenQuestionIds.has(questionId) ||
        !answer ||
        !createdAt ||
        !updatedAt
      ) {
        return null;
      }

      seenQuestionIds.add(questionId);
      return {
        questionId,
        answer,
        createdAt,
        updatedAt,
      } satisfies ExperienceFollowupAnswer;
    })
    .filter((answer): answer is ExperienceFollowupAnswer => answer !== null)
    .slice(0, maxItems);
}

export function normalizeExperienceFollowup(
  value: unknown,
): ExperienceFollowup | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = normalizeText(candidate.id);
  const experienceId = normalizeText(candidate.experienceId);
  const source = candidate.source;
  const questions = normalizeExperienceFollowupQuestions(
    candidate.questions,
    6,
  );
  const questionIds = new Set(questions.map((question) => question.id));
  const answers = normalizeExperienceFollowupAnswers(
    candidate.answers,
    questionIds,
    questions.length,
  );
  const generatedAt = normalizeText(candidate.generatedAt);
  const updatedAt = normalizeText(candidate.updatedAt);

  if (
    !id ||
    !experienceId ||
    !isExperienceFollowupSource(source) ||
    questions.length === 0 ||
    !generatedAt ||
    !updatedAt
  ) {
    return null;
  }

  const schemaVersion: ExperienceFollowupSchemaVersion =
    candidate.schemaVersion === EXPERIENCE_FOLLOWUP_SCHEMA_VERSION
      ? EXPERIENCE_FOLLOWUP_SCHEMA_VERSION
      : EXPERIENCE_FOLLOWUP_SCHEMA_VERSION;

  return {
    id,
    schemaVersion,
    experienceId,
    source,
    sourceRecommendationId:
      normalizeText(candidate.sourceRecommendationId) || undefined,
    sourceAnswerDraftType: normalizeAnswerDraftType(
      candidate.sourceAnswerDraftType,
    ),
    questions,
    answers,
    status: normalizeStatus(candidate.status),
    generatedAt,
    updatedAt,
  };
}

export function hasAnsweredFollowup(followup: ExperienceFollowup): boolean {
  return followup.answers.some((answer) => answer.answer.trim().length > 0);
}

export function getFollowupStatus(
  questions: ExperienceFollowupQuestion[],
  answers: ExperienceFollowupAnswer[],
  currentStatus: ExperienceFollowupStatus,
): ExperienceFollowupStatus {
  if (currentStatus === "dismissed") {
    return "dismissed";
  }

  const answeredQuestionIds = new Set(
    answers
      .filter((answer) => answer.answer.trim().length > 0)
      .map((answer) => answer.questionId),
  );

  return questions.every((question) => answeredQuestionIds.has(question.id))
    ? "answered"
    : "open";
}
