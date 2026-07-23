import { NextResponse } from "next/server";

import {
  AI_API_REQUEST_LIMITS,
  consumeAiApiRateLimit,
  createAiApiErrorResponse as createErrorResponse,
  rejectTooLargeAiApiRequest,
  requireAuthenticatedAiApiUser,
} from "@/lib/aiApiProtection";
import {
  countAiInputCharacters,
  createAiRequestMetricLogger,
} from "@/lib/aiRequestMetrics";
import { createStructuredAiSseResponse } from "@/lib/structuredAiStream";
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
  normalizeRecommendationJdAnalysis,
  normalizeRecommendationMatch,
  normalizeRecommendationRequirements,
} from "@/lib/recommendationResult";
import {
  getRecommendationPurposeConfig,
  normalizeRecommendationPurpose,
} from "@/lib/recommendationPurposeConfig";
import type {
  Experience,
  ExperienceAnalysis,
  ApiErrorCode,
  RecommendationApiResult,
  RecommendationMatch,
  RecommendationPurpose,
  RelatedLink,
  RecommendRequest,
  RecommendResponse,
} from "@/lib/types";

type RecommendRouteResult = {
  response: RecommendResponse;
  status?: number;
};

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

const recommendationV2ResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "extractedRequirements",
    "jdAnalysis",
    "matches",
    "noMatchReason",
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
    jdAnalysis: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "responsibilities",
        "requiredQualifications",
        "preferredQualifications",
        "techStack",
        "requiredExperience",
        "requirementMatches",
        "emphasisPoints",
        "gaps",
        "overclaimRisks",
        "finalVerdict",
        "finalVerdictReason",
      ],
      properties: {
        summary: {
          type: "string",
          description: "JD 핵심 요약. JD 목적이 아니면 빈 문자열",
        },
        responsibilities: {
          type: "array",
          maxItems: 12,
          items: { type: "string" },
          description: "담당 업무",
        },
        requiredQualifications: {
          type: "array",
          maxItems: 12,
          items: { type: "string" },
          description: "필수 자격요건",
        },
        preferredQualifications: {
          type: "array",
          maxItems: 12,
          items: { type: "string" },
          description: "우대사항",
        },
        techStack: {
          type: "array",
          maxItems: 16,
          items: { type: "string" },
          description: "기술 스택",
        },
        requiredExperience: {
          type: "array",
          maxItems: 12,
          items: { type: "string" },
          description: "요구 경험",
        },
        requirementMatches: {
          type: "array",
          maxItems: 24,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "category",
              "requirement",
              "status",
              "matchedExperienceIds",
              "evidence",
              "missingEvidence",
            ],
            properties: {
              category: {
                type: "string",
                enum: [
                  "responsibility",
                  "required_qualification",
                  "preferred_qualification",
                  "tech_stack",
                  "required_experience",
                ],
              },
              requirement: {
                type: "string",
                description: "JD에서 추출한 단일 요구사항",
              },
              status: {
                type: "string",
                enum: [
                  "met",
                  "partially_met",
                  "insufficient_evidence",
                  "not_met",
                ],
                description: "충족, 부분 충족, 근거 부족, 미충족 중 하나",
              },
              matchedExperienceIds: {
                type: "array",
                maxItems: 6,
                items: { type: "string" },
              },
              evidence: {
                type: "array",
                maxItems: 6,
                items: { type: "string" },
                description:
                  "원본 경험 또는 보완 답변에서 확인되는 직접 근거",
              },
              missingEvidence: {
                type: "string",
                description: "근거가 부족하거나 미충족인 이유",
              },
            },
          },
        },
        emphasisPoints: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description: "지원 시 강조할 내용",
        },
        gaps: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description: "부족한 역량과 근거",
        },
        overclaimRisks: {
          type: "array",
          maxItems: 10,
          items: { type: "string" },
          description: "과장하면 안 되는 부분",
        },
        finalVerdict: {
          type: "string",
          enum: ["recommended", "challenge_possible", "needs_improvement"],
          description: "지원 추천, 도전 지원 가능, 현재는 보완 필요",
        },
        finalVerdictReason: {
          type: "string",
          description: "최종 지원 판단 이유",
        },
      },
    },
    matches: {
      type: "array",
      minItems: 0,
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
            description:
              "점수 기준 적합도 수준. score >= 75는 high, score >= 45는 medium, 그 미만은 low",
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
      description:
        "가장 적합한 경험 최대 Top 3. 근거가 부족하면 3개를 채우지 않고 적합한 경험만 반환",
    },
    noMatchReason: {
      type: "string",
      description: "matches가 비어 있을 때 추천하지 않은 이유. 있으면 빈 문자열",
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
  const followupAnswers =
    analysis?.evidenceGaps
      .filter((gap) => gap.answer.trim())
      .map((gap) => ({
        title: gap.title,
        question: gap.question,
        answer: gap.answer,
      })) ?? [];

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
          achievements: analysis.achievements,
          keywords: analysis.keywords,
          star: analysis.star,
          evidenceGaps: analysis.evidenceGaps.slice(0, 6),
          isStale: analysis.sourceExperienceUpdatedAt !== experience.updatedAt,
        }
      : null,
    directEvidenceSources: {
      originalExperienceFields: {
        title: experience.title,
        period: experience.period,
        role: experience.role,
        description: experience.description,
        achievements: experience.achievements,
        relatedLinks: experience.relatedLinks.map((link) => link.description),
      },
      followupAnswers,
    },
  };
}

function createRecommendationPrompt(body: RecommendRequest): string {
  const analysesByExperienceId = new Map(
    body.analyses.map((analysis) => [analysis.experienceId, analysis]),
  );
  const purposeConfig = getRecommendationPurposeConfig(body.purpose);

  return JSON.stringify(
    {
      instruction:
        "사용자의 입력을 역량, 기술, 행동, 역할, 성과로 분해하고 전달된 후보 경험 중 직접 근거가 있는 경험만 최대 Top 3로 추천해주세요.",
      schemaMetadata: {
        schemaVersion: RECOMMENDATION_SCHEMA_VERSION,
        promptVersion: RECOMMENDATION_PROMPT_VERSION,
        model: RECOMMENDATION_MODEL,
      },
      purposeGuidelines: {
        purpose: body.purpose,
        label: purposeConfig.inputLabel,
        recommendationOnly:
          "이번 단계에서는 추천과 분석만 수행합니다. 자기소개서, 면접 답변, 지원 전략, 포트폴리오 문단 같은 결과물은 생성하지 않습니다.",
      },
      requirementGuidelines: [
        "입력 전체에서 필수 역량, 우대 역량, 핵심 키워드, 답변 의도, 제약 조건을 먼저 추출합니다.",
        "질문이나 JD를 역량, 기술, 행동, 역할, 성과 단위로 분해합니다.",
        "JD나 긴 원문은 담당 업무, 필수 자격요건, 우대사항, 기술 스택, 요구 경험을 구분합니다.",
        "제약 조건에는 분량, 형식, 직무 조건, 금지사항처럼 답변 전략에 영향을 주는 내용을 넣습니다.",
      ],
      jdGuidelines: [
        "purpose가 jd이면 jdAnalysis를 반드시 채웁니다.",
        "JD 요구사항별 status는 met, partially_met, insufficient_evidence, not_met 중 하나만 사용합니다.",
        "status 판단의 evidence는 원본 경험 또는 보완 답변에서 확인되는 직접 근거만 씁니다.",
        "finalVerdict는 recommended, challenge_possible, needs_improvement 중 하나만 사용합니다.",
        "purpose가 jd가 아니면 jdAnalysis의 문자열은 빈 문자열, 배열은 빈 배열로 둡니다.",
      ],
      matchingGuidelines: [
        "matches는 최대 3개만 반환합니다. 적합한 경험이 1~2개뿐이면 1~2개만 반환합니다.",
        "직접 근거가 부족한 경험으로 억지로 3개를 채우지 않습니다.",
        "전달된 후보 경험에서 직접 근거가 있는 후보가 하나도 없으면 matches는 빈 배열로 두고 noMatchReason에 이유를 씁니다.",
        "rank는 1부터 시작하며 중복하지 않습니다.",
        "fitLevel은 score 기준으로만 정합니다. score >= 75는 high, score >= 45는 medium, 그 미만은 low입니다.",
        "제목 유사도만 보지 말고 목적, 질문, 역할, 원본 성과, 분석 요약, STAR, 주요 성과, 키워드, 부족 정보의 보완 답변을 함께 판단합니다.",
        "분석 v2의 summary, star, achievements, keywords는 경험 이해를 위한 참고 자료입니다. 사실 근거로 단독 사용하지 않습니다.",
        "evidenceGaps에 answer가 있으면 사용자가 보완한 사실로 보고 직접 근거에 반영합니다. 단, 원본 경험에 원래 있던 내용처럼 표현하지 않습니다.",
        "분석이 없거나 오래되었으면 원본 description, achievements, role, relatedLinks 설명을 fallback 근거로 사용합니다.",
        "matchReason은 AI의 해석과 추천 이유입니다.",
        "matchedEvidence에는 원본 경험 필드 또는 보완 답변에서 실제 확인되는 직접 근거만 씁니다.",
        "근거가 약하거나 빠진 부분은 missingEvidence에 분리하고, 사실처럼 보강하지 않습니다.",
        "기록에 없는 성과, 수치, 리더십, 협업 규모, 사용 기술, 결과를 넣고 싶어지는 지점은 overclaimRisks에 분리합니다.",
        "suggestedAngle은 활용 관점만 제안하고, 긴 자기소개서 문단을 생성하지 않습니다.",
        "draftSentence는 1순위 경험만 근거로 한 짧은 참고 문장 1개로 제한합니다. matches가 비어 있으면 빈 문자열입니다.",
        "experienceId는 반드시 experiences 배열에 있는 id 중 하나를 그대로 사용합니다.",
        "experienceTitle은 해당 id의 제목을 사용합니다. 서버가 실제 제목으로 다시 검증합니다.",
      ],
      sourceRules: [
        "사실 근거는 원본 경험과 보완 답변만 사용합니다.",
        "기존 AI 분석 결과는 참고 자료로만 사용합니다.",
        "원본 경험이나 보완 답변에 없는 프로젝트명, 서비스명, 기술명, 수치, 사용자 수, 성과, 역할을 만들지 않습니다.",
        "관련 링크 설명은 사용자가 적은 참고 정보로만 사용하며 링크 내용을 직접 열람하거나 검증했다고 가정하지 않습니다.",
        "사용자 기록의 약점을 숨기지 말고 부족 근거와 과장 위험으로 분리합니다.",
        "답변 초안 생성, 면접 답변 작성, JD 지원 전략 작성, 기록 보완 질문 생성은 이번 결과에 포함하지 않습니다.",
      ],
      outputGuidelines: {
        extractedRequirements:
          "요구사항 구조화 결과를 간결한 한국어 배열과 문장으로 반환",
        jdAnalysis:
          "JD 목적일 때 JD 핵심 요약, 요구사항 분류, 요구사항별 경험 매칭, 강조점, 부족 역량, 과장 주의점, 최종 지원 판단을 반환",
        matches:
          "최대 Top 3 경험을 비교할 수 있게 matchReason, matchedEvidence, missingEvidence, overclaimRisks, suggestedAngle을 모두 작성",
        draftSentence:
          "긴 문단이 아니라 1문장 참고 문장만 작성하고 원본에 없는 사실은 넣지 않음",
      },
      userInput: {
        purpose: body.purpose,
        purposeLabel: purposeConfig.inputLabel,
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

type ParsedRecommendationV2Result =
  | {
      ok: true;
      recommendation: RecommendationApiResult;
    }
  | {
      ok: false;
      reason: "no_match";
      message: string;
    };

function parseRecommendationV2Result(
  rawOutput: string,
  experiences: Experience[],
  purpose: RecommendationPurpose,
): ParsedRecommendationV2Result | null {
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

    if (matches.length === 0) {
      const noMatchReason =
        typeof parsed.noMatchReason === "string"
          ? parsed.noMatchReason.trim()
          : "";

      return {
        ok: false,
        reason: "no_match",
        message:
          noMatchReason ||
          "저장된 경험에서 직접 근거가 충분한 추천 후보를 찾지 못했습니다.",
      };
    }

    const draftSentence =
      typeof parsed.draftSentence === "string"
        ? parsed.draftSentence.trim()
        : "";

    if (!draftSentence) {
      return null;
    }

    const jdAnalysis = normalizeRecommendationJdAnalysis(parsed.jdAnalysis);

    if (purpose === "jd" && !jdAnalysis) {
      return null;
    }

    const topMatch = matches[0];
    const topExperience = experiencesById.get(topMatch.experienceId);

    if (!topExperience) {
      return null;
    }

    const recommendation = normalizeRecommendationApiResult({
      schemaVersion: RECOMMENDATION_SCHEMA_VERSION,
      promptVersion: RECOMMENDATION_PROMPT_VERSION,
      model: RECOMMENDATION_MODEL,
      extractedRequirements,
      jdAnalysis: purpose === "jd" ? jdAnalysis : null,
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

    return recommendation
      ? {
          ok: true,
          recommendation,
        }
      : null;
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
    const purpose = normalizeRecommendationPurpose(candidate.purpose);

    if (
      !purpose ||
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
      purpose,
      prompt: candidate.prompt.trim(),
      experiences,
      analyses,
      stream: candidate.stream === true,
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

  const parsedBody = body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey?.trim()) {
    return createErrorResponse(
      "MISSING_API_KEY",
      "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다.",
      500,
    );
  }

  const openAiApiKey = apiKey.trim();

  const aiMetric = createAiRequestMetricLogger({
    feature: "experience_recommendation",
    responseType: parsedBody.stream ? "sse_stream" : "structured_json",
    inputCharacterCount: countAiInputCharacters([
      parsedBody.purpose,
      parsedBody.prompt,
      parsedBody.experiences.map((experience) => [
        experience.title,
        experience.period,
        experience.role,
        experience.description,
        experience.achievements,
        experience.relatedLinks.map((link) => link.description),
      ]),
      parsedBody.analyses.map((analysis) => [
        analysis.summary,
        analysis.achievements,
        analysis.keywords,
        Object.values(analysis.star),
        analysis.evidenceGaps.map((gap) => [gap.title, gap.reason, gap.answer]),
      ]),
    ]),
    experienceCount: parsedBody.experiences.length,
    model: RECOMMENDATION_MODEL,
    retry: false,
  });
  const createTrackedErrorResult = (
    code: ApiErrorCode,
    message: string,
    status: number,
  ): RecommendRouteResult => {
    aiMetric.complete({ status: "error" });
    return {
      response: {
        ok: false,
        error: {
          code,
          message,
        },
      },
      status,
    };
  };

  async function executeRecommendationRequest(
    sendStatus?: (message: string) => void,
  ): Promise<RecommendRouteResult> {
    const openAiAbortController = new AbortController();
    let didOpenAiRequestTimeOut = false;
    const openAiTimeoutId = setTimeout(() => {
      didOpenAiRequestTimeOut = true;
      openAiAbortController.abort();
    }, OPENAI_REQUEST_TIMEOUT_MS);
    const handleClientAbort = () => {
      openAiAbortController.abort();
    };

    if (request.signal.aborted) {
      handleClientAbort();
    } else {
      request.signal.addEventListener("abort", handleClientAbort, {
        once: true,
      });
    }

    try {
      sendStatus?.("질문과 활용 목적을 확인했어요.");
      sendStatus?.("선별된 후보 경험과 분석 결과를 함께 비교하고 있어요.");

      const recommendationOutput = await requestOpenAiStructuredOutput({
        apiKey: openAiApiKey,
        systemContent:
          "당신은 CampusLog의 AI 추천 v2 도우미입니다. 입력 문항/JD 요구사항을 구조화하고, 전달된 후보 경험 context와 보완 답변을 사실 근거로 삼아 적합한 경험만 최대 Top 3로 추천합니다. 기존 AI 분석은 참고 자료로만 사용하고, 원본에 없는 사실은 만들지 않으며 추천 이유와 직접 근거, 부족 근거, 과장 위험을 분리합니다.",
        userContent: createRecommendationPrompt(parsedBody),
        schemaName: "campuslog_experience_recommendation_v2",
        schema: recommendationV2ResponseSchema,
        maxOutputTokens: 4200,
        logLabel: "recommendation-v2",
        signal: openAiAbortController.signal,
      });

      if (!recommendationOutput.ok) {
        return createTrackedErrorResult(
          "OPENAI_API_ERROR",
          recommendationOutput.reason === "invalid_output"
            ? "AI 기반 활동 추천 응답을 해석하지 못했습니다. 다시 시도해주세요."
            : "AI 기반 활동 추천 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
          502,
        );
      }

      sendStatus?.("추천 결과 형식을 검증하고 있어요.");
      const recommendation = parseRecommendationV2Result(
        recommendationOutput.outputText,
        parsedBody.experiences,
        parsedBody.purpose,
      );

      if (!recommendation) {
        return createTrackedErrorResult(
          "OPENAI_API_ERROR",
          "AI 기반 활동 추천 결과가 올바른 형식이 아닙니다. 다시 시도해주세요.",
          502,
        );
      }

      if (!recommendation.ok) {
        return createTrackedErrorResult(
          "INSUFFICIENT_INPUT",
          `${recommendation.message} 경험 내용을 보완하거나 질문을 더 구체적으로 입력해 주세요.`,
          422,
        );
      }

      sendStatus?.("추천 Top 후보와 부족 근거를 정리하고 있어요.");
      aiMetric.complete({ status: "success" });
      return {
        response: {
          ok: true,
          recommendation: recommendation.recommendation,
        },
      };
    } catch {
      if (request.signal.aborted && !didOpenAiRequestTimeOut) {
        aiMetric.complete({ status: "cancelled" });
        return {
          response: {
            ok: false,
            error: {
              code: "REQUEST_CANCELLED",
              message: "AI 추천 요청을 취소했습니다.",
            },
          },
          status: 499,
        };
      }

      if (didOpenAiRequestTimeOut) {
        return createTrackedErrorResult(
          "OPENAI_API_ERROR",
          "AI 기반 활동 추천 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
          504,
        );
      }

      return createTrackedErrorResult(
        "UNKNOWN_ERROR",
        "알 수 없는 오류로 AI 기반 활동 추천을 완료하지 못했습니다.",
        500,
      );
    } finally {
      clearTimeout(openAiTimeoutId);
      request.signal.removeEventListener("abort", handleClientAbort);
    }
  }

  if (parsedBody.stream) {
    return createStructuredAiSseResponse<RecommendResponse>(async (sender) => {
      const result = await executeRecommendationRequest(sender.sendStatus);

      if (result.response.ok) {
        sender.sendCompleted(result.response);
      } else {
        sender.sendError(result.response);
      }
    });
  }

  const result = await executeRecommendationRequest();

  return NextResponse.json<RecommendResponse>(result.response, {
    status: result.status ?? 200,
  });
}
