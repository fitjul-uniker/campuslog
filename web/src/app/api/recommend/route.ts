import { NextResponse } from "next/server";

import {
  AI_API_REQUEST_LIMITS,
  consumeAiApiRateLimit,
  createAiApiErrorResponse as createErrorResponse,
  rejectTooLargeAiApiRequest,
  requireAuthenticatedAiApiUser,
} from "@/lib/aiApiProtection";
import {
  MAX_RELATED_LINK_DESCRIPTION_LENGTH,
  MAX_RELATED_LINKS,
  MAX_RELATED_LINK_URL_LENGTH,
  parseRelatedLinks,
} from "@/lib/relatedLinks";
import type {
  Experience,
  ExperienceAnalysis,
  RecommendationApiResult,
  RecommendationPurpose,
  RelatedLink,
  RecommendRequest,
  RecommendResponse,
} from "@/lib/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const RECOMMENDATION_MODEL = "gpt-4.1-mini";
const OPENAI_REQUEST_TIMEOUT_MS =
  AI_API_REQUEST_LIMITS.recommend.openAiTimeoutMs;
const MAX_ID_LENGTH = 160;
const MAX_EXPERIENCE_TITLE_LENGTH = 200;
const MAX_EXPERIENCE_PERIOD_LENGTH = 120;
const MAX_EXPERIENCE_ROLE_LENGTH = 200;
const MAX_EXPERIENCE_DESCRIPTION_LENGTH = 8_000;
const MAX_EXPERIENCE_ACHIEVEMENTS_LENGTH = 4_000;
const MAX_TIMESTAMP_LENGTH = 100;
const MAX_RECOMMENDATION_PROMPT_LENGTH = 4_000;
const MAX_RECOMMENDATION_EXPERIENCE_COUNT = 50;
const MAX_RECOMMENDATION_ANALYSIS_COUNT = 50;
const MAX_ANALYSIS_SUMMARY_LENGTH = 4_000;
const MAX_ANALYSIS_LIST_ITEM_LENGTH = 1_000;

const PURPOSE_LABELS: Record<RecommendationPurpose, string> = {
  cover_letter: "자기소개서",
  portfolio: "포트폴리오",
  interview: "면접",
  activity_application: "대외활동/지원서",
  other: "기타",
};

type RecommendationDetailFields = Omit<
  RecommendationApiResult,
  "recommendedExperienceId" | "recommendedExperienceTitle"
>;

const selectionResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["recommendedExperienceId"],
  properties: {
    recommendedExperienceId: {
      type: "string",
      description: "추천한 경험의 id. 반드시 입력으로 받은 experiences 중 하나여야 함",
    },
  },
} as const;

const recommendationDetailResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "reason",
    "relatedTags",
    "highlightedAchievement",
    "usageDirection",
    "draftSentence",
  ],
  properties: {
    reason: {
      type: "string",
      description: "선택된 경험이 사용자의 활용 목적과 질문에 적합한 이유",
    },
    relatedTags: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "string",
      },
      description: "선택된 경험과 질문에 관련된 역량 태그 또는 키워드",
    },
    highlightedAchievement: {
      type: "string",
      description: "선택된 경험의 원본 또는 분석 결과에서 강조할 수 있는 성과",
    },
    usageDirection: {
      type: "string",
      description: "선택된 경험을 현재 목적에 맞게 풀어내는 활용 방향",
    },
    draftSentence: {
      type: "string",
      description: "사용자가 참고해 수정할 수 있는 한국어 초안 문장",
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

function isRecommendationPurpose(
  value: unknown,
): value is RecommendationPurpose {
  return (
    value === "cover_letter" ||
    value === "portfolio" ||
    value === "interview" ||
    value === "activity_application" ||
    value === "other"
  );
}

function isAnalysisStatus(value: unknown): value is Experience["analysisStatus"] {
  return (
    value === "unanalyzed" ||
    value === "analyzed" ||
    value === "needs_reanalysis"
  );
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

function parseExperienceForRecommendation(value: unknown): Experience | null {
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

function isExperienceAnalysisForRecommendation(
  value: unknown,
): value is ExperienceAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    hasTextWithinLimit(candidate.id, MAX_ID_LENGTH) &&
    hasTextWithinLimit(candidate.experienceId, MAX_ID_LENGTH) &&
    hasTextWithinLimit(candidate.summary, MAX_ANALYSIS_SUMMARY_LENGTH) &&
    isStringArray(candidate.competencyTags, 12, MAX_ANALYSIS_LIST_ITEM_LENGTH) &&
    isStringArray(candidate.achievements, 12, MAX_ANALYSIS_LIST_ITEM_LENGTH) &&
    isStringArray(candidate.keywords, 20, MAX_ANALYSIS_LIST_ITEM_LENGTH) &&
    hasTextWithinLimit(candidate.generatedAt, MAX_TIMESTAMP_LENGTH) &&
    hasTextWithinLimit(candidate.sourceExperienceUpdatedAt, MAX_TIMESTAMP_LENGTH)
  );
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

function createExperiencePromptContext(
  experience: Experience,
  analysis?: ExperienceAnalysis | null,
) {
  return {
    id: experience.id,
    title: experience.title,
    period: experience.period,
    role: experience.role,
    description: experience.description,
    achievements: experience.achievements,
    relatedLinks: experience.relatedLinks,
    analysis: analysis
      ? {
          summary: analysis.summary,
          competencyTags: analysis.competencyTags,
          achievements: analysis.achievements,
          keywords: analysis.keywords,
          isStale: analysis.sourceExperienceUpdatedAt !== experience.updatedAt,
        }
      : null,
  };
}

function createSelectionPrompt(body: RecommendRequest): string {
  const analysesByExperienceId = new Map(
    body.analyses.map((analysis) => [analysis.experienceId, analysis]),
  );

  return JSON.stringify(
    {
      instruction:
        "저장된 대학생 활동 경험 중 사용자의 활용 목적과 질문에 가장 설득력 있게 쓸 수 있는 경험 1개를 고르고 id만 반환해주세요.",
      selectionGuidelines: [
        "제목 유사도만 보지 말고 목적, 질문, 역할, 성과, 분석 태그, 키워드의 적합성을 함께 판단합니다.",
        "분석 결과가 있으면 summary, competencyTags, achievements, keywords를 적극 활용합니다.",
        "분석 결과가 없거나 오래되었으면 원본 description, achievements, role을 우선 참고합니다.",
        "원본 경험이나 분석 결과에 없는 성과를 사실처럼 만들지 않습니다.",
        "관련 링크 설명은 사용자가 적은 참고 정보로만 사용하며 링크 내용을 직접 열람하거나 검증했다고 가정하지 않습니다.",
        "recommendedExperienceId는 반드시 experiences 배열에 있는 id 중 하나를 그대로 사용합니다.",
      ],
      outputGuidelines: {
        recommendedExperienceId:
          "가장 적합한 경험의 id 하나만 반환하고, 추천 이유나 문장은 작성하지 않습니다.",
      },
      userInput: {
        purpose: body.purpose,
        purposeLabel: PURPOSE_LABELS[body.purpose],
        prompt: body.prompt,
      },
      experiences: body.experiences.map((experience) => {
        const analysis = analysesByExperienceId.get(experience.id);

        return createExperiencePromptContext(experience, analysis);
      }),
    },
    null,
    2,
  );
}

function createRecommendationDetailPrompt(
  body: RecommendRequest,
  selectedExperience: Experience,
  selectedAnalysis?: ExperienceAnalysis | null,
): string {
  return JSON.stringify(
    {
      instruction:
        "아래 selectedExperience 하나만 근거로 추천 이유, 관련 태그, 강조할 성과, 활용 방향, 참고 문장을 작성해주세요.",
      sourceRules: [
        "selectedExperience와 selectedAnalysis에 없는 프로젝트명, 서비스명, 수치, 기술, 역할을 넣지 않습니다.",
        "다른 경험이나 예시 경험의 내용, 태그, 성과를 섞지 않습니다.",
        "질문과 연결할 때도 selectedExperience에 기록된 행동과 성과만 사용합니다.",
        "관련 링크 설명은 사용자가 적은 참고 정보로만 사용하며 링크 내용을 직접 열람하거나 검증했다고 가정하지 않습니다.",
        "성과 수치가 원본에 없으면 새 수치를 만들지 말고 정성적으로 표현합니다.",
        "selectedAnalysis가 오래된 분석이면 원본 description, achievements, role을 우선합니다.",
      ],
      outputGuidelines: {
        reason: "추천 이유는 선택된 경험에 근거해 2~4문장 한국어로 작성",
        relatedTags:
          "선택된 경험에서 근거가 있는 역량 태그 또는 활용 키워드 2~6개",
        highlightedAchievement:
          "선택된 경험의 원본 또는 분석 결과에 근거한 성과 1개",
        usageDirection:
          "현재 목적에 맞게 선택된 경험을 어떤 관점으로 풀면 좋은지 설명",
        draftSentence:
          "사용자가 자기소개서/포트폴리오/면접 답변 초안으로 참고할 수 있는 자연스러운 한국어 문장",
      },
      userInput: {
        purpose: body.purpose,
        purposeLabel: PURPOSE_LABELS[body.purpose],
        prompt: body.prompt,
      },
      selectedExperience: createExperiencePromptContext(
        selectedExperience,
        selectedAnalysis,
      ),
    },
    null,
    2,
  );
}

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
      model: RECOMMENDATION_MODEL,
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

      console.warn("CampusLog recommend OpenAI request failed", {
        phase: logLabel,
        status: openAiResponse.status,
        code: errorPayload.error?.code,
        type: errorPayload.error?.type,
      });
    } catch {
      console.warn("CampusLog recommend OpenAI request failed", {
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

function parseSelectedExperience(
  rawOutput: string,
  experiences: Experience[],
): Experience | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;

    const recommendedExperienceId =
      typeof parsed.recommendedExperienceId === "string"
        ? parsed.recommendedExperienceId.trim()
        : "";
    const recommendedExperience = experiences.find(
      (experience) => experience.id === recommendedExperienceId,
    );

    return recommendedExperience ?? null;
  } catch {
    return null;
  }
}

function parseRecommendationDetailResult(
  rawOutput: string,
): RecommendationDetailFields | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;

    const reason = typeof parsed.reason === "string" ? parsed.reason.trim() : "";
    const relatedTags = normalizeStringList(parsed.relatedTags, 6);
    const highlightedAchievement =
      typeof parsed.highlightedAchievement === "string"
        ? parsed.highlightedAchievement.trim()
        : "";
    const usageDirection =
      typeof parsed.usageDirection === "string"
        ? parsed.usageDirection.trim()
        : "";
    const draftSentence =
      typeof parsed.draftSentence === "string"
        ? parsed.draftSentence.trim()
        : "";

    if (
      !reason ||
      relatedTags.length === 0 ||
      !highlightedAchievement ||
      !usageDirection ||
      !draftSentence
    ) {
      return null;
    }

    return {
      reason,
      relatedTags,
      highlightedAchievement,
      usageDirection,
      draftSentence,
    };
  } catch {
    return null;
  }
}

async function readRequestBody(
  request: Request,
): Promise<RecommendRequest | null> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return null;
    }

    const candidate = body as Record<string, unknown>;
    const rawExperiences = candidate.experiences;
    const rawAnalyses = candidate.analyses;

    if (
      !isRecommendationPurpose(candidate.purpose) ||
      !hasTextWithinLimit(candidate.prompt, MAX_RECOMMENDATION_PROMPT_LENGTH) ||
      !Array.isArray(rawExperiences) ||
      !Array.isArray(rawAnalyses)
    ) {
      return null;
    }

    if (
      rawExperiences.length === 0 ||
      rawExperiences.length > MAX_RECOMMENDATION_EXPERIENCE_COUNT ||
      rawAnalyses.length > MAX_RECOMMENDATION_ANALYSIS_COUNT
    ) {
      return null;
    }

    const experiences = rawExperiences
      .map(parseExperienceForRecommendation)
      .filter((experience): experience is Experience => experience !== null);
    const analyses = rawAnalyses.filter(isExperienceAnalysisForRecommendation);

    if (
      experiences.length === 0 ||
      experiences.length !== rawExperiences.length ||
      analyses.length !== rawAnalyses.length
    ) {
      return null;
    }

    return {
      purpose: candidate.purpose,
      prompt: candidate.prompt.trim(),
      experiences,
      analyses,
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

  const rateLimitResponse = consumeAiApiRateLimit(auth.userId, "recommend");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestSizeResponse = rejectTooLargeAiApiRequest(request, "recommend");

  if (requestSizeResponse) {
    return requestSizeResponse;
  }

  const body = await readRequestBody(request);

  if (!body) {
    return createErrorResponse(
      "BAD_REQUEST",
      "추천에 필요한 입력 데이터가 올바르지 않습니다.",
      400,
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
    const selectionOutput = await requestOpenAiStructuredOutput({
      apiKey,
      systemContent:
        "당신은 CampusLog의 AI 경험 선택 도우미입니다. 저장된 경험 중 가장 적합한 경험 id 하나만 반환합니다.",
      userContent: createSelectionPrompt(body),
      schemaName: "campuslog_experience_selection",
      schema: selectionResponseSchema,
      maxOutputTokens: 200,
      logLabel: "selection",
      signal: openAiAbortController.signal,
    });

    if (!selectionOutput.ok) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        selectionOutput.reason === "invalid_output"
          ? "AI 기반 활동 추천 응답을 해석하지 못했습니다. 다시 시도해주세요."
          : "AI 기반 활동 추천 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    const selectedExperience = parseSelectedExperience(
      selectionOutput.outputText,
      body.experiences,
    );

    if (!selectedExperience) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 기반 활동 추천 결과가 올바른 경험을 가리키지 않습니다. 다시 시도해주세요.",
        502,
      );
    }

    const analysesByExperienceId = new Map(
      body.analyses.map((analysis) => [analysis.experienceId, analysis]),
    );
    const selectedAnalysis =
      analysesByExperienceId.get(selectedExperience.id) ?? null;
    const detailOutput = await requestOpenAiStructuredOutput({
      apiKey,
      systemContent:
        "당신은 CampusLog의 AI 경험 활용 도우미입니다. 제공된 selectedExperience 하나만 근거로 과장 없이 한국어 추천 이유와 활용 문장을 작성합니다.",
      userContent: createRecommendationDetailPrompt(
        body,
        selectedExperience,
        selectedAnalysis,
      ),
      schemaName: "campuslog_experience_recommendation_detail",
      schema: recommendationDetailResponseSchema,
      maxOutputTokens: 1000,
      logLabel: "detail",
      signal: openAiAbortController.signal,
    });

    if (!detailOutput.ok) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        detailOutput.reason === "invalid_output"
          ? "AI 기반 활동 추천 응답을 해석하지 못했습니다. 다시 시도해주세요."
          : "AI 기반 활동 추천 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    const recommendationDetail = parseRecommendationDetailResult(
      detailOutput.outputText,
    );

    if (!recommendationDetail) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 기반 활동 추천 결과가 올바른 형식이 아닙니다. 다시 시도해주세요.",
        502,
      );
    }

    return NextResponse.json<RecommendResponse>({
      ok: true,
      recommendation: {
        recommendedExperienceId: selectedExperience.id,
        recommendedExperienceTitle: selectedExperience.title,
        ...recommendationDetail,
      },
    });
  } catch {
    if (didOpenAiRequestTimeOut) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 기반 활동 추천 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        504,
      );
    }

    return createErrorResponse(
      "UNKNOWN_ERROR",
      "알 수 없는 오류로 AI 기반 활동 추천을 완료하지 못했습니다.",
      500,
    );
  } finally {
    clearTimeout(openAiTimeoutId);
  }
}
