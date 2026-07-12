import { NextResponse } from "next/server";

import { parseRelatedLinks } from "@/lib/relatedLinks";
import type {
  AnalysisApiResult,
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorCode,
  ApiErrorResponse,
  Experience,
} from "@/lib/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ANALYSIS_MODEL = "gpt-4.1-mini";
const INSUFFICIENT_ANALYSIS_MESSAGE =
  "분석할 만한 경험 정보가 부족합니다. 활동 내용, 본인이 한 역할, 결과나 배운 점을 조금 더 구체적으로 작성해주세요.";
const MIN_ANALYSIS_TOTAL_CHAR_COUNT = 16;
const MIN_ANALYSIS_ACTION_CHAR_COUNT = 10;
const MIN_COMPETENCY_ACTION_CHAR_COUNT = 24;
const PLACEHOLDER_VALUES = new Set([
  "test",
  "tests",
  "testtest",
  "testest",
  "testing",
  "테스트",
  "asdf",
  "asdfasdf",
  "qwer",
  "qwerqwer",
  "dummy",
  "sample",
  "샘플",
  "예시",
  "없음",
  "없다",
  "없습니다",
  "해당없음",
  "내용없음",
  "기록없음",
  "몰라",
  "모름",
  "미정",
  "무",
  "none",
  "null",
  "undefined",
]);
const REPEATED_PLACEHOLDER_TOKENS = [
  "test",
  "테스트",
  "asdf",
  "qwer",
  "dummy",
  "sample",
  "샘플",
];

const analysisResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "competencyTags", "achievements", "keywords"],
  properties: {
    summary: {
      type: "string",
      description:
        "자기소개서, 포트폴리오, 면접 준비에 다시 활용하기 좋은 한국어 경험 요약",
    },
    competencyTags: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "string",
      },
      description:
        "경험에서 명시적 근거가 확인되는 핵심 역량 태그. 근거가 없으면 빈 배열",
    },
    achievements: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "string",
      },
      description:
        "경험에서 사용자가 실제로 기록한 주요 성과. 근거가 없으면 빈 배열",
    },
    keywords: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: {
        type: "string",
      },
      description:
        "포트폴리오, 자기소개서, 면접 준비에 활용 가능한 키워드. 근거가 없으면 빈 배열",
    },
  },
} as const;

function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAnalysisStatus(value: unknown): value is Experience["analysisStatus"] {
  return (
    value === "unanalyzed" ||
    value === "analyzed" ||
    value === "needs_reanalysis"
  );
}

function compactMeaningfulText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]+/gi, "");
}

function isRepeatedTokenValue(value: string, token: string): boolean {
  if (value.length <= token.length || value.length % token.length !== 0) {
    return false;
  }

  return token.repeat(value.length / token.length) === value;
}

function looksLikePlaceholder(value: string): boolean {
  const compactValue = compactMeaningfulText(value);

  if (!compactValue) {
    return true;
  }

  if (PLACEHOLDER_VALUES.has(compactValue)) {
    return true;
  }

  if (/^[tes]+$/i.test(compactValue) && compactValue.length <= 12) {
    return true;
  }

  if (/^\d+$/.test(compactValue) && compactValue.length <= 12) {
    return true;
  }

  if (
    compactValue.length >= 3 &&
    new Set(Array.from(compactValue)).size === 1
  ) {
    return true;
  }

  return REPEATED_PLACEHOLDER_TOKENS.some((token) =>
    isRepeatedTokenValue(compactValue, token),
  );
}

function getMeaningfulFieldText(value: string): string {
  return looksLikePlaceholder(value) ? "" : value.trim();
}

function countMeaningfulCharacters(values: string[]): number {
  return values.reduce((total, value) => {
    const meaningfulText = getMeaningfulFieldText(value);

    return total + compactMeaningfulText(meaningfulText).length;
  }, 0);
}

function hasSufficientAnalysisInput(experience: Experience): boolean {
  const meaningfulFieldCount = [
    experience.title,
    experience.role,
    experience.description,
    experience.achievements,
  ].filter((value) => compactMeaningfulText(getMeaningfulFieldText(value)).length >= 2)
    .length;
  const totalCharCount = countMeaningfulCharacters([
    experience.title,
    experience.role,
    experience.description,
    experience.achievements,
  ]);
  const actionCharCount = countMeaningfulCharacters([
    experience.description,
    experience.achievements,
  ]);

  return (
    meaningfulFieldCount >= 2 &&
    totalCharCount >= MIN_ANALYSIS_TOTAL_CHAR_COUNT &&
    actionCharCount >= MIN_ANALYSIS_ACTION_CHAR_COUNT
  );
}

function hasSufficientCompetencyEvidence(experience: Experience): boolean {
  return (
    countMeaningfulCharacters([
      experience.description,
      experience.achievements,
    ]) >= MIN_COMPETENCY_ACTION_CHAR_COUNT
  );
}

function parseExperienceForAnalysis(value: unknown): Experience | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const relatedLinks = parseRelatedLinks(candidate.relatedLinks);

  if (
    hasText(candidate.id) &&
    hasText(candidate.title) &&
    hasText(candidate.period) &&
    hasText(candidate.role) &&
    hasText(candidate.description) &&
    typeof candidate.achievements === "string" &&
    relatedLinks !== null &&
    hasText(candidate.createdAt) &&
    hasText(candidate.updatedAt) &&
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

function createPrompt(experience: Experience): string {
  return JSON.stringify(
    {
      instruction:
        "아래 대학생 활동 경험을 분석해 자기소개서, 포트폴리오, 면접 준비에 다시 활용하기 좋은 형태로 정리해주세요. 입력되지 않은 성과를 과장하거나 꾸며내지 말고, 사용자가 기록한 내용에서 추론 가능한 범위만 사용하세요. 근거가 부족한 항목은 억지로 채우지 말고 빈 배열로 반환하세요.",
      qualityRules: [
        "핵심 역량 태그는 사용자의 실제 행동, 문제 해결, 협업, 성과가 원문에 드러날 때만 생성합니다.",
        "활동명, 기간, 역할명만으로 역량 태그를 추정하지 않습니다.",
        "test, testtest, asdf, 없음처럼 의미 없는 입력은 분석 근거로 사용하지 않습니다.",
        "원문에 없는 성과, 수치, 협업 여부, 리더십을 사실처럼 만들지 않습니다.",
        "관련 링크의 설명은 사용자가 적은 참고 정보이며, 링크 내용을 직접 열람하거나 검증했다고 가정하지 않습니다.",
      ],
      outputGuidelines: {
        summary: "2~3문장 한국어 요약",
        competencyTags:
          "0~5개. 문제 해결력, 협업/커뮤니케이션, 실행력/주도성, 분석력/데이터 활용력처럼 넓은 역량 범주 중심. 근거가 없으면 빈 배열",
        achievements: "0~5개. 동사와 결과가 보이는 주요 성과. 근거가 없으면 빈 배열",
        keywords:
          "0~8개. 구체 기술, 활동 방식, 산출물, 준비 상황에 재사용할 키워드. 근거가 없으면 빈 배열",
      },
      experience: {
        title: experience.title,
        period: experience.period,
        role: experience.role,
        description: experience.description,
        achievements: experience.achievements,
        relatedLinks: experience.relatedLinks,
      },
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

function parseAnalysisResult(
  rawOutput: string,
  experience: Experience,
): AnalysisApiResult | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;

    const summary =
      typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const competencyTags = hasSufficientCompetencyEvidence(experience)
      ? normalizeStringList(parsed.competencyTags, 5)
      : [];
    const achievements = normalizeStringList(parsed.achievements, 5);
    const keywords = normalizeStringList(parsed.keywords, 8);

    if (
      !summary ||
      (competencyTags.length === 0 &&
        achievements.length === 0 &&
        keywords.length === 0)
    ) {
      return null;
    }

    return {
      experienceId: experience.id,
      summary,
      competencyTags,
      achievements,
      keywords,
    };
  } catch {
    return null;
  }
}

async function readRequestBody(request: Request): Promise<AnalyzeRequest | null> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return null;
    }

    const experience = parseExperienceForAnalysis(
      (body as { experience?: unknown }).experience,
    );

    if (!experience) {
      return null;
    }

    return { experience };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await readRequestBody(request);

  if (!body) {
    return createErrorResponse(
      "BAD_REQUEST",
      "분석할 경험 데이터가 올바르지 않습니다.",
      400,
    );
  }

  if (!hasSufficientAnalysisInput(body.experience)) {
    return createErrorResponse(
      "INSUFFICIENT_INPUT",
      INSUFFICIENT_ANALYSIS_MESSAGE,
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

  try {
    const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        input: [
          {
            role: "system",
            content:
              "당신은 CampusLog의 AI 경험 분석 도우미입니다. 대학생 활동 경험을 과장 없이 분석하고, 한국어로 간결하고 재사용 가능한 결과만 제공합니다.",
          },
          {
            role: "user",
            content: createPrompt(body.experience),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "campuslog_experience_analysis",
            strict: true,
            schema: analysisResponseSchema,
          },
        },
        max_output_tokens: 900,
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

        console.warn("CampusLog analyze OpenAI request failed", {
          status: openAiResponse.status,
          code: errorPayload.error?.code,
          type: errorPayload.error?.type,
        });
      } catch {
        console.warn("CampusLog analyze OpenAI request failed", {
          status: openAiResponse.status,
        });
      }

      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 분석 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    const openAiPayload = (await openAiResponse.json()) as unknown;
    const outputText = extractOutputText(openAiPayload);

    if (!outputText) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 분석 응답을 해석하지 못했습니다. 다시 시도해주세요.",
        502,
      );
    }

    const analysis = parseAnalysisResult(outputText, body.experience);

    if (!analysis) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "입력된 경험에서 분석에 필요한 단서를 충분히 찾지 못했습니다. 활동에서 맡은 일, 직접 한 행동, 결과나 배운 점을 조금 더 구체적으로 기록한 뒤 다시 요청해주세요.",
        502,
      );
    }

    return NextResponse.json<AnalyzeResponse>({
      ok: true,
      analysis,
    });
  } catch {
    return createErrorResponse(
      "UNKNOWN_ERROR",
      "알 수 없는 오류로 AI 분석을 완료하지 못했습니다.",
      500,
    );
  }
}
