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
import { normalizeExperienceAnalysis } from "@/lib/analysisResult";
import {
  RECOMMENDATION_PROMPT_VERSION,
  RECOMMENDATION_SCHEMA_VERSION,
  normalizeRecommendationApiResult,
  normalizeRecommendationMatch,
  normalizeRecommendationRequirements,
} from "@/lib/recommendationResult";
import type {
  Experience,
  ExperienceAnalysis,
  RecommendationApiResult,
  RecommendationMatch,
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

const recommendationV2ResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "extractedRequirements",
    "matches",
    "draftSentence",
  ],
  properties: {
    extractedRequirements: {
      type: "object",
      additionalProperties: false,
      required: [
        "requiredCompetencies",
        "preferredCompetencies",
        "keywords",
        "intent",
        "constraints",
      ],
      properties: {
        requiredCompetencies: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description: "입력 문항/JD에서 반드시 보여줘야 하는 역량",
        },
        preferredCompetencies: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description: "있으면 좋은 우대 역량 또는 보조 역량",
        },
        keywords: {
          type: "array",
          maxItems: 16,
          items: { type: "string" },
          description: "직무, 문항, 질문에서 추출한 핵심 키워드",
        },
        intent: {
          type: "string",
          description: "지원자가 답변에서 증명해야 하는 의도",
        },
        constraints: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description: "분량, 형식, 금지사항, 직무 조건 등 제약",
        },
      },
    },
    matches: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "experienceId",
          "experienceTitle",
          "rank",
          "score",
          "fitLevel",
          "matchReason",
          "matchedEvidence",
          "missingEvidence",
          "overclaimRisks",
          "suggestedAngle",
          "relatedCompetencies",
        ],
        properties: {
          experienceId: {
            type: "string",
            description: "반드시 입력 experiences 중 하나의 id",
          },
          experienceTitle: {
            type: "string",
            description: "경험 제목. 서버가 실제 제목으로 다시 검증함",
          },
          rank: {
            type: "number",
            description: "1부터 시작하는 추천 순위",
          },
          score: {
            type: "number",
            description: "0부터 100 사이의 적합도 점수",
          },
          fitLevel: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "적합도 수준",
          },
          matchReason: {
            type: "string",
            description: "이 경험이 요구사항에 맞는 이유",
          },
          matchedEvidence: {
            type: "array",
            maxItems: 6,
            items: { type: "string" },
            description: "원본 경험 또는 분석 v2에서 확인되는 근거",
          },
          missingEvidence: {
            type: "array",
            maxItems: 6,
            items: { type: "string" },
            description: "답변에 쓰기 전 보완하면 좋은 부족 근거",
          },
          overclaimRisks: {
            type: "array",
            maxItems: 6,
            items: { type: "string" },
            description: "기록에 없는 사실로 과장하기 쉬운 지점",
          },
          suggestedAngle: {
            type: "string",
            description: "이 경험을 풀어낼 추천 관점",
          },
          relatedCompetencies: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
            description: "이 추천 경험과 연결되는 역량",
          },
        },
      },
      description: "가장 적합한 경험 Top 3. 경험이 3개보다 적으면 가능한 만큼 반환",
    },
    draftSentence: {
      type: "string",
      description:
        "1순위 경험만 근거로 한 짧은 참고 문장. 긴 자기소개서 문단을 쓰지 않음",
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

function parseExperienceAnalysisForRecommendation(
  value: unknown,
): ExperienceAnalysis | null {
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
    serializedAnalysis.length > 24_000
  ) {
    return null;
  }

  return analysis;
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
          schemaVersion: analysis.schemaVersion,
          promptVersion: analysis.promptVersion,
          model: analysis.model,
          summary: analysis.summary,
          competencyTags: analysis.competencyTags,
          achievements: analysis.achievements,
          keywords: analysis.keywords,
          star: analysis.star,
          evidence: analysis.evidence.slice(0, 8),
          evidenceGaps: analysis.evidenceGaps.slice(0, 6),
          coverLetterAngles: analysis.coverLetterAngles.slice(0, 4),
          competencyEvidence: analysis.competencyEvidence.slice(0, 6),
          isStale: analysis.sourceExperienceUpdatedAt !== experience.updatedAt,
        }
      : null,
  };
}

function createRecommendationPrompt(body: RecommendRequest): string {
  const analysesByExperienceId = new Map(
    body.analyses.map((analysis) => [analysis.experienceId, analysis]),
  );
  const topMatchCount = Math.min(3, body.experiences.length);

  return JSON.stringify(
    {
      instruction:
        "사용자의 자기소개서 문항, 면접 질문, JD, 지원서 원문에서 요구사항을 구조화하고 저장된 경험 중 가장 적합한 경험 Top 3를 추천해주세요.",
      schemaMetadata: {
        schemaVersion: RECOMMENDATION_SCHEMA_VERSION,
        promptVersion: RECOMMENDATION_PROMPT_VERSION,
        model: RECOMMENDATION_MODEL,
      },
      requirementGuidelines: [
        "입력 전체에서 필수 역량, 우대 역량, 핵심 키워드, 답변 의도, 제약 조건을 먼저 추출합니다.",
        "JD나 지원서 원문이 길어도 질문의 핵심 의도와 요구 역량을 우선합니다.",
        "제약 조건에는 분량, 형식, 직무 조건, 금지사항처럼 답변 전략에 영향을 주는 내용을 넣습니다.",
      ],
      matchingGuidelines: [
        `matches는 정확히 ${topMatchCount}개를 반환합니다. 경험이 3개 이상이면 반드시 3개입니다.`,
        "rank는 1부터 시작하며 중복하지 않습니다.",
        "제목 유사도만 보지 말고 목적, 질문, 역할, 성과, 분석 태그, 키워드, STAR, 원본 evidence를 함께 판단합니다.",
        "분석 v2가 있으면 star, evidence, evidenceGaps, coverLetterAngles, competencyEvidence를 우선 활용합니다.",
        "분석이 없거나 오래되었으면 원본 description, achievements, role, relatedLinks 설명을 fallback 근거로 사용합니다.",
        "matchedEvidence에는 입력 원본 또는 분석 결과에서 실제 확인되는 근거만 씁니다.",
        "근거가 약하거나 빠진 부분은 missingEvidence에 분리하고, 사실처럼 보강하지 않습니다.",
        "기록에 없는 성과, 수치, 리더십, 협업 규모, 사용 기술, 결과를 넣고 싶어지는 지점은 overclaimRisks에 분리합니다.",
        "suggestedAngle은 활용 관점만 제안하고, 긴 자기소개서 문단을 생성하지 않습니다.",
        "draftSentence는 1순위 경험만 근거로 한 짧은 참고 문장 1개로 제한합니다.",
        "experienceId는 반드시 experiences 배열에 있는 id 중 하나를 그대로 사용합니다.",
        "experienceTitle은 해당 id의 제목을 사용합니다. 서버가 실제 제목으로 다시 검증합니다.",
      ],
      sourceRules: [
        "원본 경험이나 분석 결과에 없는 프로젝트명, 서비스명, 수치, 성과, 역할을 만들지 않습니다.",
        "관련 링크 설명은 사용자가 적은 참고 정보로만 사용하며 링크 내용을 직접 열람하거나 검증했다고 가정하지 않습니다.",
        "사용자 기록의 약점을 숨기지 말고 부족 근거와 과장 위험으로 분리합니다.",
        "답변 초안 생성, 300자/700자 본문 작성, 기록 보완 질문 생성은 이번 결과에 포함하지 않습니다.",
      ],
      outputGuidelines: {
        extractedRequirements:
          "요구사항 구조화 결과를 간결한 한국어 배열과 문장으로 반환",
        matches:
          "Top 3 경험을 비교할 수 있게 matchReason, matchedEvidence, missingEvidence, overclaimRisks, suggestedAngle을 모두 작성",
        draftSentence:
          "긴 문단이 아니라 1문장 참고 문장만 작성하고 원본에 없는 사실은 넣지 않음",
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

function uniqueStringList(values: string[], maxItems: number): string[] {
  const seenValues = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const normalizedValue = value.toLocaleLowerCase("ko-KR");

      if (seenValues.has(normalizedValue)) {
        return false;
      }

      seenValues.add(normalizedValue);
      return true;
    })
    .slice(0, maxItems);
}

function parseRecommendationV2Result(
  rawOutput: string,
  experiences: Experience[],
): RecommendationApiResult | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;
    const experiencesById = new Map(
      experiences.map((experience) => [experience.id, experience]),
    );
    const extractedRequirements = normalizeRecommendationRequirements(
      parsed.extractedRequirements,
    );
    const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    const seenExperienceIds = new Set<string>();
    const matches = rawMatches
      .map(normalizeRecommendationMatch)
      .filter((match): match is RecommendationMatch => {
        if (!match || seenExperienceIds.has(match.experienceId)) {
          return false;
        }

        if (!experiencesById.has(match.experienceId)) {
          return false;
        }

        seenExperienceIds.add(match.experienceId);
        return true;
      })
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3)
      .map((match, index) => {
        const experience = experiencesById.get(match.experienceId);

        return {
          ...match,
          experienceTitle: experience?.title ?? match.experienceTitle,
          rank: index + 1,
        };
      });

    const draftSentence =
      typeof parsed.draftSentence === "string"
        ? parsed.draftSentence.trim()
        : "";

    if (matches.length === 0 || !draftSentence) {
      return null;
    }

    const topMatch = matches[0];
    const topExperience = experiencesById.get(topMatch.experienceId);

    if (!topExperience) {
      return null;
    }

    return normalizeRecommendationApiResult({
      schemaVersion: RECOMMENDATION_SCHEMA_VERSION,
      promptVersion: RECOMMENDATION_PROMPT_VERSION,
      model: RECOMMENDATION_MODEL,
      extractedRequirements,
      matches,
      recommendedExperienceId: topExperience.id,
      recommendedExperienceTitle: topExperience.title,
      reason: topMatch.matchReason,
      relatedTags: uniqueStringList(
        [
          ...topMatch.relatedCompetencies,
          ...extractedRequirements.requiredCompetencies,
          ...extractedRequirements.preferredCompetencies,
          ...extractedRequirements.keywords,
        ],
        8,
      ),
      highlightedAchievement:
        topMatch.matchedEvidence[0] ?? topMatch.matchReason,
      usageDirection: topMatch.suggestedAngle,
      draftSentence,
    });
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
    const analyses = rawAnalyses
      .map(parseExperienceAnalysisForRecommendation)
      .filter((analysis): analysis is ExperienceAnalysis => analysis !== null);

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
    const recommendationOutput = await requestOpenAiStructuredOutput({
      apiKey,
      systemContent:
        "당신은 CampusLog의 AI 추천 v2 도우미입니다. 입력 문항/JD 요구사항을 구조화하고, 사용자가 저장한 경험과 분석 v2 근거만으로 경험 Top 3를 추천합니다. 원본에 없는 사실은 만들지 않고 부족 근거와 과장 위험을 분리합니다.",
      userContent: createRecommendationPrompt(body),
      schemaName: "campuslog_experience_recommendation_v2",
      schema: recommendationV2ResponseSchema,
      maxOutputTokens: 2400,
      logLabel: "recommendation-v2",
      signal: openAiAbortController.signal,
    });

    if (!recommendationOutput.ok) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        recommendationOutput.reason === "invalid_output"
          ? "AI 기반 활동 추천 응답을 해석하지 못했습니다. 다시 시도해주세요."
          : "AI 기반 활동 추천 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    const recommendation = parseRecommendationV2Result(
      recommendationOutput.outputText,
      body.experiences,
    );

    if (!recommendation) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 기반 활동 추천 결과가 올바른 형식이 아닙니다. 다시 시도해주세요.",
        502,
      );
    }

    return NextResponse.json<RecommendResponse>({
      ok: true,
      recommendation,
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
