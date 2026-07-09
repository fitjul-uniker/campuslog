import { NextResponse } from "next/server";

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
      minItems: 2,
      maxItems: 5,
      items: {
        type: "string",
      },
      description: "경험에서 드러나는 핵심 역량 태그",
    },
    achievements: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "string",
      },
      description: "경험에서 말할 수 있는 주요 성과",
    },
    keywords: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: {
        type: "string",
      },
      description: "포트폴리오, 자기소개서, 면접 준비에 활용 가능한 키워드",
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAnalysisStatus(value: unknown): value is Experience["analysisStatus"] {
  return (
    value === "unanalyzed" ||
    value === "analyzed" ||
    value === "needs_reanalysis"
  );
}

function isExperienceForAnalysis(value: unknown): value is Experience {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    hasText(candidate.id) &&
    hasText(candidate.title) &&
    hasText(candidate.period) &&
    hasText(candidate.role) &&
    hasText(candidate.description) &&
    typeof candidate.achievements === "string" &&
    isStringArray(candidate.relatedLinks) &&
    hasText(candidate.createdAt) &&
    hasText(candidate.updatedAt) &&
    isAnalysisStatus(candidate.analysisStatus)
  );
}

function createPrompt(experience: Experience): string {
  return JSON.stringify(
    {
      instruction:
        "아래 대학생 활동 경험을 분석해 자기소개서, 포트폴리오, 면접 준비에 다시 활용하기 좋은 형태로 정리해주세요. 입력되지 않은 성과를 과장하거나 꾸며내지 말고, 사용자가 기록한 내용에서 추론 가능한 범위만 사용하세요.",
      outputGuidelines: {
        summary: "2~3문장 한국어 요약",
        competencyTags:
          "문제 해결력, 협업/커뮤니케이션, 실행력/주도성, 분석력/데이터 활용력처럼 넓은 역량 범주 중심",
        achievements: "동사와 결과가 보이는 주요 성과",
        keywords: "구체 기술, 활동 방식, 산출물, 준비 상황에 재사용할 키워드",
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
  experienceId: string,
): AnalysisApiResult | null {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;

    const summary =
      typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const competencyTags = normalizeStringList(parsed.competencyTags, 5);
    const achievements = normalizeStringList(parsed.achievements, 5);
    const keywords = normalizeStringList(parsed.keywords, 8);

    if (
      !summary ||
      competencyTags.length === 0 ||
      achievements.length === 0 ||
      keywords.length === 0
    ) {
      return null;
    }

    return {
      experienceId,
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

    const experience = (body as { experience?: unknown }).experience;

    if (!isExperienceForAnalysis(experience)) {
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

    const analysis = parseAnalysisResult(outputText, body.experience.id);

    if (!analysis) {
      return createErrorResponse(
        "OPENAI_API_ERROR",
        "AI 분석 결과가 올바른 형식이 아닙니다. 다시 시도해주세요.",
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
