import { NextResponse } from "next/server";

import {
  AI_API_REQUEST_LIMITS,
  consumeAiApiRateLimit,
  createAiApiErrorResponse as createErrorResponse,
  rejectTooLargeAiApiRequest,
  requireAuthenticatedAiApiUser,
} from "@/lib/aiApiProtection";
import { normalizeExperienceAnalysis } from "@/lib/analysisResult";
import {
  ANSWER_DRAFT_PROMPT_VERSION,
  ANSWER_DRAFT_SCHEMA_VERSION,
  ANSWER_DRAFT_TARGET_GUIDES,
  ANSWER_DRAFT_TYPE_LABELS,
  ANSWER_DRAFT_TYPES,
  countAnswerDraftCharacters,
  getAnswerDraftCharacterLimit,
  isAnswerDraftWithinCharacterLimit,
  normalizeAnswerDraft,
  normalizeAnswerDraftResult,
} from "@/lib/answerDraftResult";
import {
  MAX_RELATED_LINK_DESCRIPTION_LENGTH,
  MAX_RELATED_LINKS,
  MAX_RELATED_LINK_URL_LENGTH,
  parseRelatedLinks,
} from "@/lib/relatedLinks";
import {
  normalizeRecommendationMatch,
  normalizeRecommendationResult,
} from "@/lib/recommendationResult";
import type {
  AnswerDraft,
  AnswerDraftResult,
  AnswerDraftsRequest,
  AnswerDraftsResponse,
  AnswerDraftType,
  Experience,
  ExperienceAnalysis,
  RecommendationMatch,
  RecommendationResult,
  RelatedLink,
} from "@/lib/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ANSWER_DRAFT_MODEL = "gpt-4.1-mini";
const OPENAI_REQUEST_TIMEOUT_MS =
  AI_API_REQUEST_LIMITS.answerDrafts.openAiTimeoutMs;
const MAX_ID_LENGTH = 160;
const MAX_EXPERIENCE_TITLE_LENGTH = 200;
const MAX_EXPERIENCE_PERIOD_LENGTH = 120;
const MAX_EXPERIENCE_ROLE_LENGTH = 200;
const MAX_EXPERIENCE_DESCRIPTION_LENGTH = 8_000;
const MAX_EXPERIENCE_ACHIEVEMENTS_LENGTH = 4_000;
const MAX_TIMESTAMP_LENGTH = 100;
const MAX_ANALYSIS_SUMMARY_LENGTH = 4_000;
const MAX_ANALYSIS_LIST_ITEM_LENGTH = 1_000;
const MAX_SERIALIZED_RECOMMENDATION_LENGTH = 36_000;
const MAX_SERIALIZED_ANALYSIS_LENGTH = 24_000;
const MAX_EVIDENCE_OPTION_LENGTH = 900;
const MAX_EVIDENCE_OPTIONS = 44;

const answerDraftsResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["draft"],
  properties: {
    draft: {
      type: "object",
      additionalProperties: false,
      required: [
        "type",
        "title",
        "content",
        "targetGuide",
        "usedEvidence",
        "missingEvidenceNotes",
        "cautions",
      ],
      properties: {
        type: {
          type: "string",
          enum: ANSWER_DRAFT_TYPES,
        },
        title: {
          type: "string",
          description: "초안 제목",
        },
        content: {
          type: "string",
          description: "사용자 기록과 근거로만 작성한 초안 본문",
        },
        targetGuide: {
          type: "string",
          description: "분량 또는 사용 상황 가이드",
        },
        usedEvidence: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: { type: "string" },
          description:
            "본문에 실제 사용한 근거. 반드시 입력 evidenceOptions의 문장을 그대로 복사",
        },
        missingEvidenceNotes: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description:
            "본문에 사실처럼 쓰지 않고 분리해야 하는 부족한 근거",
        },
        cautions: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description: "과장하거나 원본 밖으로 나가기 쉬운 주의점",
        },
      },
    },
  },
} as const;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasTextWithinLimit(value: unknown, maxLength: number): value is string {
  return hasText(value) && value.length <= maxLength;
}

function isStringWithinLimit(
  value: unknown,
  maxLength: number,
  allowEmpty = false,
): value is string {
  return (
    typeof value === "string" &&
    value.length <= maxLength &&
    (allowEmpty || value.trim().length > 0)
  );
}

function isStringArray(
  value: unknown,
  maxItems = Number.POSITIVE_INFINITY,
  maxItemLength = Number.POSITIVE_INFINITY,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.length <= maxItemLength,
    )
  );
}

function isAnalysisStatus(value: unknown): value is Experience["analysisStatus"] {
  return (
    value === "unanalyzed" ||
    value === "analyzed" ||
    value === "needs_reanalysis"
  );
}

function isAnswerDraftType(value: unknown): value is AnswerDraftType {
  return ANSWER_DRAFT_TYPES.includes(value as AnswerDraftType);
}

function areRelatedLinksWithinLimit(links: RelatedLink[]): boolean {
  return (
    links.length <= MAX_RELATED_LINKS &&
    links.every(
      (link) =>
        link.url.length <= MAX_RELATED_LINK_URL_LENGTH &&
        link.description.length <= MAX_RELATED_LINK_DESCRIPTION_LENGTH,
    )
  );
}

function parseExperienceForDrafts(value: unknown): Experience | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const relatedLinks = parseRelatedLinks(candidate.relatedLinks);

  if (
    hasTextWithinLimit(candidate.id, MAX_ID_LENGTH) &&
    hasTextWithinLimit(candidate.title, MAX_EXPERIENCE_TITLE_LENGTH) &&
    hasTextWithinLimit(candidate.period, MAX_EXPERIENCE_PERIOD_LENGTH) &&
    hasTextWithinLimit(candidate.role, MAX_EXPERIENCE_ROLE_LENGTH) &&
    hasTextWithinLimit(
      candidate.description,
      MAX_EXPERIENCE_DESCRIPTION_LENGTH,
    ) &&
    isStringWithinLimit(
      candidate.achievements,
      MAX_EXPERIENCE_ACHIEVEMENTS_LENGTH,
      true,
    ) &&
    relatedLinks !== null &&
    areRelatedLinksWithinLimit(relatedLinks) &&
    hasTextWithinLimit(candidate.createdAt, MAX_TIMESTAMP_LENGTH) &&
    hasTextWithinLimit(candidate.updatedAt, MAX_TIMESTAMP_LENGTH) &&
    isAnalysisStatus(candidate.analysisStatus)
  ) {
    return {
      id: candidate.id,
      title: candidate.title,
      period: candidate.period,
      role: candidate.role,
      description: candidate.description,
      achievements: candidate.achievements,
      relatedLinks,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      analysisStatus: candidate.analysisStatus,
    };
  }

  return null;
}

function parseExperienceAnalysisForDrafts(
  value: unknown,
): ExperienceAnalysis | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const analysis = normalizeExperienceAnalysis(value);

  if (!analysis) {
    return null;
  }

  const serializedAnalysis = JSON.stringify(analysis);

  if (
    !hasTextWithinLimit(analysis.id, MAX_ID_LENGTH) ||
    !hasTextWithinLimit(analysis.experienceId, MAX_ID_LENGTH) ||
    !hasTextWithinLimit(analysis.summary, MAX_ANALYSIS_SUMMARY_LENGTH) ||
    !isStringArray(
      analysis.competencyTags,
      12,
      MAX_ANALYSIS_LIST_ITEM_LENGTH,
    ) ||
    !isStringArray(analysis.achievements, 12, MAX_ANALYSIS_LIST_ITEM_LENGTH) ||
    !isStringArray(analysis.keywords, 20, MAX_ANALYSIS_LIST_ITEM_LENGTH) ||
    !hasTextWithinLimit(analysis.generatedAt, MAX_TIMESTAMP_LENGTH) ||
    !hasTextWithinLimit(
      analysis.sourceExperienceUpdatedAt,
      MAX_TIMESTAMP_LENGTH,
    ) ||
    serializedAnalysis.length > MAX_SERIALIZED_ANALYSIS_LENGTH
  ) {
    return null;
  }

  return analysis;
}

function parseRecommendationForDrafts(
  value: unknown,
): RecommendationResult | null {
  const recommendation = normalizeRecommendationResult(value);

  if (!recommendation) {
    return null;
  }

  return JSON.stringify(recommendation).length <=
    MAX_SERIALIZED_RECOMMENDATION_LENGTH
    ? recommendation
    : null;
}

function parseMatchForDrafts(value: unknown): RecommendationMatch | null {
  return normalizeRecommendationMatch(value);
}

function normalizeEvidenceText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("ko-KR");
}

function truncateEvidenceOption(value: string): string {
  const trimmedValue = value.replace(/\s+/g, " ").trim();

  if (trimmedValue.length <= MAX_EVIDENCE_OPTION_LENGTH) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, MAX_EVIDENCE_OPTION_LENGTH - 1)}…`;
}

function createEvidenceOptions(
  experience: Experience,
  match: RecommendationMatch,
  analysis: ExperienceAnalysis | null,
): string[] {
  const options: string[] = [];
  const seenOptions = new Set<string>();
  const addOption = (label: string, value: string) => {
    const text = truncateEvidenceOption(`${label}: ${value}`);
    const normalizedText = normalizeEvidenceText(text);

    if (!value.trim() || seenOptions.has(normalizedText)) {
      return;
    }

    seenOptions.add(normalizedText);
    options.push(text);
  };

  addOption("경험 제목", experience.title);
  addOption("활동 기간", experience.period);
  addOption("역할", experience.role);
  addOption("원본 설명", experience.description);
  addOption("원본 성과", experience.achievements);

  experience.relatedLinks.forEach((link) => {
    addOption("관련 링크 설명", link.description);
  });

  match.matchedEvidence.forEach((item) => {
    addOption("추천 매칭 근거", item);
  });

  if (analysis) {
    addOption("분석 요약", analysis.summary);
    analysis.achievements.forEach((item) => addOption("분석 성과", item));
    Object.entries(analysis.star).forEach(([key, value]) => {
      addOption(`STAR ${key}`, value);
    });
    analysis.evidence.forEach((item) => {
      addOption("분석 원본 근거", item.quote);
    });
    analysis.coverLetterAngles.forEach((angle) => {
      angle.supportingEvidence.forEach((item) => {
        addOption("자소서 각도 근거", item);
      });
    });
    analysis.competencyEvidence.forEach((competency) => {
      competency.evidence.forEach((item) => {
        addOption(`역량 근거 ${competency.competency}`, item);
      });
    });
  }

  return options.slice(0, MAX_EVIDENCE_OPTIONS);
}

function filterUsedEvidence(
  values: string[],
  evidenceOptions: string[],
): string[] {
  const optionsByNormalizedText = new Map(
    evidenceOptions.map((option) => [normalizeEvidenceText(option), option]),
  );
  const usedEvidence: string[] = [];
  const seenValues = new Set<string>();

  values.forEach((value) => {
    const normalizedValue = normalizeEvidenceText(value);
    const exactOption = optionsByNormalizedText.get(normalizedValue);
    const fuzzyOption =
      exactOption ??
      evidenceOptions.find((option) => {
        const normalizedOption = normalizeEvidenceText(option);

        return (
          normalizedOption.includes(normalizedValue) ||
          normalizedValue.includes(normalizedOption)
        );
      });

    if (!fuzzyOption) {
      return;
    }

    const normalizedOption = normalizeEvidenceText(fuzzyOption);

    if (seenValues.has(normalizedOption)) {
      return;
    }

    seenValues.add(normalizedOption);
    usedEvidence.push(fuzzyOption);
  });

  return usedEvidence.slice(0, 10);
}

function mergeNotes(primary: string[], secondary: string[]): string[] {
  const seenValues = new Set<string>();

  return [...primary, ...secondary]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const normalizedItem = normalizeEvidenceText(item);

      if (seenValues.has(normalizedItem)) {
        return false;
      }

      seenValues.add(normalizedItem);
      return true;
    })
    .slice(0, 10);
}

function createDraftPromptContext(body: AnswerDraftsRequest) {
  const characterLimit = getAnswerDraftCharacterLimit(body.draftType);
  const selectedDraftType = {
    type: body.draftType,
    label: ANSWER_DRAFT_TYPE_LABELS[body.draftType],
    targetGuide: ANSWER_DRAFT_TARGET_GUIDES[body.draftType],
    characterLimit,
  };

  return {
    instruction:
      "추천 v2에서 선택한 경험과 분석 v2 근거를 바탕으로 사용자가 선택한 답변 초안 1개를 작성해주세요.",
    schemaMetadata: {
      schemaVersion: ANSWER_DRAFT_SCHEMA_VERSION,
      promptVersion: ANSWER_DRAFT_PROMPT_VERSION,
      model: ANSWER_DRAFT_MODEL,
    },
    selectedDraftType,
    selectedRecommendation: {
      id: body.recommendation.id,
      purpose: body.recommendation.purpose,
      prompt: body.recommendation.prompt,
      extractedRequirements: body.recommendation.extractedRequirements,
    },
    selectedMatch: body.match,
    experience: {
      id: body.experience.id,
      title: body.experience.title,
      period: body.experience.period,
      role: body.experience.role,
      description: body.experience.description,
      achievements: body.experience.achievements,
      relatedLinks: body.experience.relatedLinks,
    },
    analysis: body.analysis
      ? {
          schemaVersion: body.analysis.schemaVersion,
          summary: body.analysis.summary,
          competencyTags: body.analysis.competencyTags,
          achievements: body.analysis.achievements,
          keywords: body.analysis.keywords,
          star: body.analysis.star,
          evidence: body.analysis.evidence.slice(0, 8),
          evidenceGaps: body.analysis.evidenceGaps.slice(0, 6),
          coverLetterAngles: body.analysis.coverLetterAngles.slice(0, 4),
          competencyEvidence: body.analysis.competencyEvidence.slice(0, 6),
          isStale:
            body.analysis.sourceExperienceUpdatedAt !==
              body.experience.updatedAt ||
            body.experience.analysisStatus === "needs_reanalysis",
        }
      : null,
    sourceRules: [
      "selectedRecommendation.prompt는 초안이 직접 답해야 하는 원 질문/문항/JD/면접 질문입니다.",
      "selectedRecommendation.extractedRequirements는 원 질문에서 추출한 요구사항이며, 본문은 이 요구사항에 맞춰 선택 경험을 풀어야 합니다.",
      "본문에는 experience 원본, selectedMatch.matchedEvidence, analysis 안에서 확인되는 사실만 사용합니다.",
      "원본 기록에 없는 성과, 수치, 역할, 협업 규모, 사용 기술명, 수상명, 프로젝트명, 결과를 만들지 않습니다.",
      "요구사항 키워드는 답변 방향을 잡는 데만 쓰고, 기록 근거가 없으면 사용자가 그 역량을 입증했다고 단정하지 않습니다.",
      "근거가 부족한 내용은 본문에 넣지 말고 missingEvidenceNotes에 분리합니다.",
      "과장하기 쉬운 지점은 cautions에 분리합니다.",
      "usedEvidence는 반드시 evidenceOptions 중 실제 사용한 문장을 그대로 복사합니다.",
      "답변은 최종본이 아니라 사용자가 수정할 초안이라는 톤을 유지하되, 본문 안에 사용법 안내 문장은 넣지 않습니다.",
    ],
    outputRules: [
      `draft.type은 반드시 ${body.draftType}입니다.`,
      `draft.title은 ${selectedDraftType.label} 목적에 맞춥니다.`,
      `draft.targetGuide는 반드시 "${selectedDraftType.targetGuide}"입니다.`,
      characterLimit
        ? `draft.content는 공백, 문장부호, 줄바꿈을 포함해 ${characterLimit.min}자 이상 ${characterLimit.max}자 이하로 작성합니다.`
        : "draft.content는 targetGuide에 맞는 분량으로 작성합니다.",
      "글자 수는 JavaScript Array.from(draft.content).length 기준입니다.",
      "자기소개서 초안은 selectedRecommendation.prompt의 문항에 직접 답하는 글로 작성합니다.",
      "면접 답변은 selectedRecommendation.prompt가 면접 질문이라고 보고 45~60초 안에 말할 수 있는 구어체 한국어로 작성합니다.",
      "포트폴리오 설명은 selectedRecommendation.prompt의 목적/JD 요구사항을 고려해 프로젝트/활동 설명용으로 간결하게 작성합니다.",
      "긴 한 문장보다 모바일에서 읽기 쉬운 짧은 문단을 사용합니다.",
    ],
    evidenceOptions: createEvidenceOptions(
      body.experience,
      body.match,
      body.analysis,
    ),
  };
}

function createAnswerDraftPrompt(body: AnswerDraftsRequest): string {
  return JSON.stringify(createDraftPromptContext(body), null, 2);
}

type OpenAiStructuredOutputResult =
  | {
      ok: true;
      outputText: string;
    }
  | {
      ok: false;
      reason: "api_error" | "invalid_output";
    };

type OpenAiStructuredOutputInput = {
  apiKey: string;
  systemContent: string;
  userContent: string;
  schemaName: string;
  schema: unknown;
  maxOutputTokens: number;
  logLabel: string;
  signal: AbortSignal;
};

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    output_text?: unknown;
    output?: unknown;
  };

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  if (!Array.isArray(response.output)) {
    return null;
  }

  for (const item of response.output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const text = (contentItem as { text?: unknown }).text;

      if (typeof text === "string" && text.trim()) {
        return text;
      }
    }
  }

  return null;
}

async function requestOpenAiStructuredOutput({
  apiKey,
  systemContent,
  userContent,
  schemaName,
  schema,
  maxOutputTokens,
  logLabel,
  signal,
}: OpenAiStructuredOutputInput): Promise<OpenAiStructuredOutputResult> {
  const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANSWER_DRAFT_MODEL,
      input: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
      max_output_tokens: maxOutputTokens,
      store: false,
    }),
  });

  if (!openAiResponse.ok) {
    try {
      const errorPayload = (await openAiResponse.json()) as {
        error?: {
          code?: unknown;
          type?: unknown;
        };
      };

      console.warn("CampusLog answer drafts OpenAI request failed", {
        phase: logLabel,
        status: openAiResponse.status,
        code: errorPayload.error?.code,
        type: errorPayload.error?.type,
      });
    } catch {
      console.warn("CampusLog answer drafts OpenAI request failed", {
        phase: logLabel,
        status: openAiResponse.status,
      });
    }

    return {
      ok: false,
      reason: "api_error",
    };
  }

  const openAiPayload = (await openAiResponse.json()) as unknown;
  const outputText = extractOutputText(openAiPayload);

  if (!outputText) {
    return {
      ok: false,
      reason: "invalid_output",
    };
  }

  return {
    ok: true,
    outputText,
  };
}

function stripJsonFence(value: string): string {
  const match = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  return (match?.[1] ?? value).trim();
}

function parseAnswerDraftsResult(
  rawOutput: string,
  body: AnswerDraftsRequest,
  evidenceOptions: string[],
): AnswerDraftResult | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;
    const fallbackMissingEvidence = [
      ...body.match.missingEvidence,
      ...(body.analysis?.evidenceGaps.map(
        (gap) => `${gap.topic}: ${gap.reason}`,
      ) ?? []),
    ];
    const fallbackCautions = [
      ...body.match.overclaimRisks,
      ...(body.analysis?.coverLetterAngles
        .map((angle) => angle.caution)
        .filter(Boolean) ?? []),
    ];
    const rawDraft = parsed.draft;

    if (!rawDraft || typeof rawDraft !== "object") {
      return null;
    }

    const candidate = rawDraft as Record<string, unknown>;
    const draft = normalizeAnswerDraft({
      ...candidate,
      usedEvidence: filterUsedEvidence(
        Array.isArray(candidate.usedEvidence)
          ? candidate.usedEvidence.filter(
              (evidence): evidence is string => typeof evidence === "string",
            )
          : [],
        evidenceOptions,
      ),
    });

    if (
      !draft ||
      draft.type !== body.draftType ||
      draft.usedEvidence.length === 0
    ) {
      return null;
    }

    const normalizedDraft: AnswerDraft = {
      ...draft,
      targetGuide: ANSWER_DRAFT_TARGET_GUIDES[draft.type],
      missingEvidenceNotes: mergeNotes(
        draft.missingEvidenceNotes,
        fallbackMissingEvidence,
      ),
      cautions: mergeNotes(draft.cautions, fallbackCautions),
    };

    return normalizeAnswerDraftResult({
      schemaVersion: ANSWER_DRAFT_SCHEMA_VERSION,
      promptVersion: ANSWER_DRAFT_PROMPT_VERSION,
      model: ANSWER_DRAFT_MODEL,
      recommendationId: body.recommendation.id,
      experienceId: body.experience.id,
      sourceMatchRank: body.match.rank,
      drafts: [normalizedDraft],
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

type AnswerDraftLengthIssue = {
  count: number;
  min: number;
  max: number;
};

function getAnswerDraftLengthIssue(
  answerDrafts: AnswerDraftResult,
  draftType: AnswerDraftType,
): AnswerDraftLengthIssue | null {
  const draft = answerDrafts.drafts.find((draft) => draft.type === draftType);
  const limit = getAnswerDraftCharacterLimit(draftType);

  if (!draft || !limit || isAnswerDraftWithinCharacterLimit(draft)) {
    return null;
  }

  return {
    count: countAnswerDraftCharacters(draft.content),
    min: limit.min,
    max: limit.max,
  };
}

function createAnswerDraftRepairPrompt(
  body: AnswerDraftsRequest,
  answerDrafts: AnswerDraftResult,
  lengthIssue: AnswerDraftLengthIssue,
): string {
  const draft = answerDrafts.drafts.find((draft) => draft.type === body.draftType);

  return JSON.stringify(
    {
      instruction:
        "아래 초안은 글자 수 조건을 만족하지 못했습니다. 원본 근거와 안전 규칙은 유지하고, draft.content만 분량 기준에 맞게 다시 작성해주세요.",
      originalContext: createDraftPromptContext(body),
      lengthIssue: {
        currentCharacterCount: lengthIssue.count,
        requiredMinimum: lengthIssue.min,
        requiredMaximum: lengthIssue.max,
        countingRule:
          "공백, 문장부호, 줄바꿈을 포함한 JavaScript Array.from(draft.content).length",
      },
      previousDraft: draft,
      repairRules: [
        `draft.type은 반드시 ${body.draftType}입니다.`,
        `draft.targetGuide는 반드시 "${ANSWER_DRAFT_TARGET_GUIDES[body.draftType]}"입니다.`,
        `draft.content는 공백 포함 ${lengthIssue.min}자 이상 ${lengthIssue.max}자 이하로 맞춥니다.`,
        "원본에 없는 성과, 수치, 역할, 협업 규모, 기술명은 새로 만들지 않습니다.",
        "usedEvidence는 originalContext.evidenceOptions 중 실제 사용한 문장을 그대로 복사합니다.",
        "부족한 근거와 과장 위험은 본문에 사실처럼 넣지 말고 missingEvidenceNotes와 cautions에 유지합니다.",
      ],
    },
    null,
    2,
  );
}

async function readRequestBody(
  request: Request,
): Promise<AnswerDraftsRequest | null> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return null;
    }

    const candidate = body as Record<string, unknown>;
    const draftType = candidate.draftType;
    const recommendation = parseRecommendationForDrafts(
      candidate.recommendation,
    );
    const match = parseMatchForDrafts(candidate.match);
    const experience = parseExperienceForDrafts(candidate.experience);
    const analysis = parseExperienceAnalysisForDrafts(candidate.analysis);

    if (
      !isAnswerDraftType(draftType) ||
      !recommendation ||
      !match ||
      !experience
    ) {
      return null;
    }

    const matchBelongsToRecommendation =
      recommendation.matches.some(
        (item) =>
          item.experienceId === match.experienceId &&
          item.rank === match.rank,
      ) || recommendation.recommendedExperienceId === match.experienceId;

    if (
      !matchBelongsToRecommendation ||
      match.experienceId !== experience.id ||
      (analysis && analysis.experienceId !== experience.id)
    ) {
      return null;
    }

    return {
      draftType,
      recommendation,
      match,
      experience,
      analysis,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedAiApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const rateLimitResponse = consumeAiApiRateLimit(auth.userId, "answerDrafts");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestSizeResponse = rejectTooLargeAiApiRequest(
    request,
    "answerDrafts",
  );

  if (requestSizeResponse) {
    return requestSizeResponse;
  }

  const body = await readRequestBody(request);

  if (!body) {
    return createErrorResponse(
      "BAD_REQUEST",
      "답변 초안 생성에 필요한 입력 데이터가 올바르지 않습니다.",
      400,
    );
  }

  const evidenceOptions = createEvidenceOptions(
    body.experience,
    body.match,
    body.analysis,
  );

  if (evidenceOptions.length === 0) {
    return createErrorResponse(
      "INSUFFICIENT_INPUT",
      "답변 초안을 만들 수 있는 원본 근거가 부족합니다.",
      422,
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey?.trim()) {
    return createErrorResponse(
      "MISSING_API_KEY",
      "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다.",
      500,
    );
  }

  const openAiAbortController = new AbortController();
  let didOpenAiRequestTimeOut = false;
  const openAiTimeoutId = setTimeout(() => {
    didOpenAiRequestTimeOut = true;
    openAiAbortController.abort();
  }, OPENAI_REQUEST_TIMEOUT_MS);

  try {
    const draftOutput = await requestOpenAiStructuredOutput({
      apiKey,
      systemContent:
        "당신은 CampusLog의 답변 초안 생성 도우미입니다. 추천 v2에 사용된 원 질문/문항과 분석 v2 근거만으로 사용자가 선택한 자기소개서, 면접, 포트폴리오 초안 1개를 작성합니다. 원본에 없는 성과, 수치, 역할, 협업 규모, 기술명은 만들지 않고 부족 근거와 과장 위험을 별도 필드로 분리합니다.",
      userContent: createAnswerDraftPrompt(body),
      schemaName: "campuslog_answer_drafts_v1",
      schema: answerDraftsResponseSchema,
      maxOutputTokens: 2600,
      logLabel: "answer-drafts-v1",
      signal: openAiAbortController.signal,
    });

    if (!draftOutput.ok) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        draftOutput.reason === "invalid_output"
          ? "답변 초안 생성 응답을 해석하지 못했습니다. 다시 시도해주세요."
          : "답변 초안 생성 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    let answerDrafts = parseAnswerDraftsResult(
      draftOutput.outputText,
      body,
      evidenceOptions,
    );

    if (!answerDrafts) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "답변 초안 생성 결과가 올바른 형식이 아닙니다. 다시 시도해주세요.",
        502,
      );
    }

    const lengthIssue = getAnswerDraftLengthIssue(answerDrafts, body.draftType);

    if (lengthIssue) {
      const repairedDraftOutput = await requestOpenAiStructuredOutput({
        apiKey,
        systemContent:
          "당신은 CampusLog의 답변 초안 분량 교정 도우미입니다. 원본 근거만 사용하면서 자기소개서 초안의 공백 포함 글자 수를 사용자가 선택한 범위 안으로 정확히 맞춥니다.",
        userContent: createAnswerDraftRepairPrompt(
          body,
          answerDrafts,
          lengthIssue,
        ),
        schemaName: "campuslog_answer_drafts_length_repair_v1",
        schema: answerDraftsResponseSchema,
        maxOutputTokens: 3200,
        logLabel: "answer-drafts-length-repair-v1",
        signal: openAiAbortController.signal,
      });

      if (!repairedDraftOutput.ok) {
        return createErrorResponse(
          "OPENAI_API_ERROR",
          "답변 초안 분량을 맞추지 못했습니다. 다시 시도해주세요.",
          502,
        );
      }

      const repairedAnswerDrafts = parseAnswerDraftsResult(
        repairedDraftOutput.outputText,
        body,
        evidenceOptions,
      );

      if (!repairedAnswerDrafts) {
        return createErrorResponse(
          "OPENAI_API_ERROR",
          "답변 초안 분량을 맞추지 못했습니다. 다시 시도해주세요.",
          502,
        );
      }

      answerDrafts = repairedAnswerDrafts;

      const repairedLengthIssue = getAnswerDraftLengthIssue(
        repairedAnswerDrafts,
        body.draftType,
      );

      if (repairedLengthIssue) {
        console.warn("CampusLog answer draft length repair out of range", {
          draftType: body.draftType,
          characterCount: repairedLengthIssue.count,
          minimum: repairedLengthIssue.min,
          maximum: repairedLengthIssue.max,
        });
      }
    }

    return NextResponse.json<AnswerDraftsResponse>({
      ok: true,
      answerDrafts,
    });
  } catch {
    if (didOpenAiRequestTimeOut) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "답변 초안 생성 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        504,
      );
    }

    return createErrorResponse(
      "UNKNOWN_ERROR",
      "알 수 없는 오류로 답변 초안 생성을 완료하지 못했습니다.",
      500,
    );
  } finally {
    clearTimeout(openAiTimeoutId);
  }
}
