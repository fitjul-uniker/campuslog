import type {
  ActiveAnswerDraftType,
  AnswerDraft,
  AnswerDraftResult,
  AnswerDraftSchemaVersion,
  AnswerDraftType,
} from "@/lib/types";

export const ANSWER_DRAFT_SCHEMA_VERSION = "v1" as const;
export const ANSWER_DRAFT_PROMPT_VERSION = "answer-drafts-v1.0";

export const ANSWER_DRAFT_TYPES: AnswerDraftType[] = [
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
];

export const ACTIVE_ANSWER_DRAFT_TYPES: ActiveAnswerDraftType[] = [
  "cover_letter_300",
  "cover_letter_500",
  "cover_letter_1000",
  "interview_30s",
  "interview_60s",
  "interview_followups",
  "jd_strategy",
  "custom",
];

export const ANSWER_DRAFT_TYPE_LABELS: Record<AnswerDraftType, string> = {
  cover_letter_300: "300자",
  cover_letter_500: "500자",
  cover_letter_1000: "1000자",
  interview_30s: "30초 답변",
  interview_60s: "1분 이상 답변",
  interview_followups: "예상 꼬리 질문",
  jd_strategy: "지원 전략",
  custom: "맞춤 결과",
  cover_letter_800: "800자 자기소개서",
  interview: "면접 답변",
  portfolio: "포트폴리오 설명",
};

export const ANSWER_DRAFT_TARGET_GUIDES: Record<AnswerDraftType, string> = {
  cover_letter_300: "260~290자 자기소개서 초안",
  cover_letter_500: "440~480자 자기소개서 초안",
  cover_letter_1000: "880~950자 자기소개서 초안",
  interview_30s: "30초 말하기용 면접 답변",
  interview_60s: "1분 이상 STAR 구조 면접 답변",
  interview_followups: "예상 꼬리 질문",
  jd_strategy: "JD 맞춤 지원 전략",
  custom: "사용자 질문에 맞춘 결과",
  cover_letter_800: "700~800자 자기소개서 초안",
  interview: "45~60초 말하기용 면접 답변",
  portfolio: "프로젝트/활동 설명용 포트폴리오 문단",
};

export const ANSWER_DRAFT_CHARACTER_LIMITS: Partial<
  Record<AnswerDraftType, { min: number; max: number }>
> = {
  cover_letter_300: { min: 260, max: 290 },
  cover_letter_500: { min: 440, max: 480 },
  cover_letter_800: { min: 700, max: 800 },
  cover_letter_1000: { min: 880, max: 950 },
};

export function countAnswerDraftCharacters(value: string): number {
  return Array.from(value).length;
}

export function getAnswerDraftCharacterLimit(
  type: AnswerDraftType,
): { min: number; max: number } | null {
  return ANSWER_DRAFT_CHARACTER_LIMITS[type] ?? null;
}

export function isAnswerDraftWithinCharacterLimit(draft: AnswerDraft): boolean {
  const limit = getAnswerDraftCharacterLimit(draft.type);

  if (!limit) {
    return true;
  }

  const characterCount = countAnswerDraftCharacters(draft.content);

  return characterCount >= limit.min && characterCount <= limit.max;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeDraftType(value: unknown): AnswerDraftType | null {
  return ANSWER_DRAFT_TYPES.includes(value as AnswerDraftType)
    ? (value as AnswerDraftType)
    : null;
}

export function normalizeAnswerDraft(value: unknown): AnswerDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const type = normalizeDraftType(candidate.type);
  const title = normalizeText(candidate.title);
  const content = normalizeText(candidate.content);

  if (!type || !title || !content) {
    return null;
  }

  return {
    type,
    title,
    content,
    targetGuide:
      normalizeText(candidate.targetGuide) || ANSWER_DRAFT_TARGET_GUIDES[type],
    usedEvidence: normalizeStringList(candidate.usedEvidence, 10),
    missingEvidenceNotes: normalizeStringList(
      candidate.missingEvidenceNotes,
      10,
    ),
    cautions: normalizeStringList(candidate.cautions, 10),
  };
}

function normalizeAnswerDrafts(value: unknown): AnswerDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const draftsByType = new Map<AnswerDraftType, AnswerDraft>();

  value.forEach((item) => {
    const draft = normalizeAnswerDraft(item);

    if (draft && !draftsByType.has(draft.type)) {
      draftsByType.set(draft.type, draft);
    }
  });

  return ANSWER_DRAFT_TYPES.map((type) => draftsByType.get(type)).filter(
    (draft): draft is AnswerDraft => Boolean(draft),
  );
}

export function normalizeAnswerDraftResult(
  value: unknown,
): AnswerDraftResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const schemaVersion: AnswerDraftSchemaVersion =
    candidate.schemaVersion === ANSWER_DRAFT_SCHEMA_VERSION
      ? ANSWER_DRAFT_SCHEMA_VERSION
      : ANSWER_DRAFT_SCHEMA_VERSION;
  const recommendationId = normalizeText(candidate.recommendationId);
  const experienceId = normalizeText(candidate.experienceId);
  const sourceMatchRank =
    typeof candidate.sourceMatchRank === "number" &&
    Number.isFinite(candidate.sourceMatchRank)
      ? Math.max(1, Math.round(candidate.sourceMatchRank))
      : 1;
  const drafts = normalizeAnswerDrafts(candidate.drafts);
  const generatedAt = normalizeText(candidate.generatedAt);

  if (
    !recommendationId ||
    !experienceId ||
    drafts.length === 0 ||
    !generatedAt
  ) {
    return null;
  }

  return {
    schemaVersion,
    promptVersion: normalizeText(candidate.promptVersion),
    model: normalizeText(candidate.model),
    recommendationId,
    experienceId,
    sourceMatchRank,
    drafts,
    generatedAt,
  };
}

export function mergeAnswerDraftResults(
  existingResult: AnswerDraftResult | null,
  incomingResult: AnswerDraftResult,
): AnswerDraftResult {
  if (
    !existingResult ||
    existingResult.recommendationId !== incomingResult.recommendationId ||
    existingResult.experienceId !== incomingResult.experienceId
  ) {
    return incomingResult;
  }

  const draftsByType = new Map<AnswerDraftType, AnswerDraft>();

  existingResult.drafts.forEach((draft) => {
    draftsByType.set(draft.type, draft);
  });
  incomingResult.drafts.forEach((draft) => {
    draftsByType.set(draft.type, draft);
  });

  return {
    ...incomingResult,
    drafts: ANSWER_DRAFT_TYPES.map((type) => draftsByType.get(type)).filter(
      (draft): draft is AnswerDraft => Boolean(draft),
    ),
  };
}
