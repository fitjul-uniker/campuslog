import { NextResponse } from "next/server";

import {
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_SCHEMA_VERSION,
  normalizeAnalysisEvidenceGaps,
  normalizeAnalysisStar,
  normalizeStringList,
} from "@/lib/analysisResult";
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
  hasAnsweredFollowup,
  normalizeExperienceFollowup,
} from "@/lib/experienceFollowupResult";
import {
  MAX_RELATED_LINK_DESCRIPTION_LENGTH,
  MAX_RELATED_LINKS,
  MAX_RELATED_LINK_URL_LENGTH,
  parseRelatedLinks,
} from "@/lib/relatedLinks";
import type {
  AnalysisApiResult,
  AnalyzeRequest,
  AnalyzeResponse,
  ApiErrorCode,
  RelatedLink,
  Experience,
  ExperienceFollowup,
} from "@/lib/types";

type AnalyzeRouteResult = {
  response: AnalyzeResponse;
  status?: number;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ANALYSIS_MODEL = "gpt-4.1-mini";
const OPENAI_REQUEST_TIMEOUT_MS =
  AI_API_REQUEST_LIMITS.analyze.openAiTimeoutMs;
const INSUFFICIENT_ANALYSIS_MESSAGE =
  "분석할 만한 경험 정보가 부족합니다. 활동 내용, 본인이 한 역할, 결과나 배운 점을 조금 더 구체적으로 작성해주세요.";
const MIN_ANALYSIS_TOTAL_CHAR_COUNT = 16;
const MIN_ANALYSIS_ACTION_CHAR_COUNT = 10;
const MAX_ID_LENGTH = 160;
const MAX_EXPERIENCE_TITLE_LENGTH = 200;
const MAX_EXPERIENCE_PERIOD_LENGTH = 120;
const MAX_EXPERIENCE_ROLE_LENGTH = 200;
const MAX_EXPERIENCE_DESCRIPTION_LENGTH = 8_000;
const MAX_EXPERIENCE_ACHIEVEMENTS_LENGTH = 4_000;
const MAX_TIMESTAMP_LENGTH = 100;
const MAX_ANALYSIS_FOLLOWUP_COUNT = 12;
const MAX_ANALYSIS_FOLLOWUP_ANSWER_COUNT = 24;
const MAX_ANALYSIS_FOLLOWUP_ANSWER_LENGTH = 1_600;
const MAX_SERIALIZED_FOLLOWUPS_LENGTH = 32_000;
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
  required: ["summary", "achievements", "keywords", "star", "evidenceGaps"],
  properties: {
    summary: {
      type: "string",
      description:
        "자기소개서, 포트폴리오, 면접 준비에 다시 활용하기 좋은 한국어 경험 요약",
    },
    achievements: {
      type: "array",
      minItems: 0,
      maxItems: 4,
      items: {
        type: "string",
      },
      description:
        "경험에서 사용자가 실제로 기록한 주요 성과. 같은 내용을 반복하지 않고 근거가 없으면 빈 배열",
    },
    keywords: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: {
        type: "string",
      },
      description:
        "포트폴리오, 자기소개서, 면접 준비에 활용 가능한 키워드. 근거가 없으면 빈 배열",
    },
    star: {
      type: "object",
      additionalProperties: false,
      required: ["situation", "task", "action", "result"],
      properties: {
        situation: {
          type: "string",
          description:
            "원본에서 확인되는 활동 배경이나 문제 상황. 불명확하면 빈 문자열",
        },
        task: {
          type: "string",
          description:
            "사용자가 맡은 과제나 목표. 원본에서 확인되지 않으면 빈 문자열",
        },
        action: {
          type: "string",
          description:
            "사용자가 직접 한 행동. 원본에서 확인되지 않으면 빈 문자열",
        },
        result: {
          type: "string",
          description:
            "원본에 기록된 결과, 성과, 배운 점. 확인되지 않으면 빈 문자열",
        },
      },
    },
    evidenceGaps: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "category",
          "title",
          "reason",
          "question",
          "answer",
          "updatedAt",
        ],
        properties: {
          id: {
            type: "string",
            description:
              "부족 정보 항목의 안정적인 식별자. 영어 소문자, 숫자, 하이픈 중심으로 작성",
          },
          category: {
            type: "string",
            enum: [
              "result_metric",
              "role_scope",
              "collaboration_scope",
              "technical_detail",
              "process_detail",
              "decision_reason",
              "learning",
              "other",
            ],
            description: "부족한 정보의 범주",
          },
          title: {
            type: "string",
            description: "부족한 정보 카드의 짧은 제목",
          },
          reason: {
            type: "string",
            description:
              "현재 기록만으로 사실처럼 말하기 어려운 이유",
          },
          question: {
            type: "string",
            description:
              "사용자가 다음에 보완하면 좋은 구체적인 질문",
          },
          answer: {
            type: "string",
            description:
              "신규 분석 시에는 빈 문자열. 사용자가 나중에 답변하면 앱이 저장",
          },
          updatedAt: {
            type: "string",
            description:
              "신규 분석 시에는 빈 문자열. 사용자가 나중에 답변하면 앱이 ISO 시각으로 저장",
          },
        },
      },
      description:
        "근거가 약하거나 원본에 없는 성과, 수치, 역할, 결과는 여기에 분리",
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

type FollowupAnswerContext = {
  followupId: string;
  questionId: string;
  question: string;
  answer: string;
};

function getFollowupAnswerContexts(
  followups: ExperienceFollowup[],
): FollowupAnswerContext[] {
  return followups.flatMap((followup) => {
    const questionsById = new Map(
      followup.questions.map((question) => [question.id, question]),
    );

    return followup.answers.flatMap((answer) => {
      const question = questionsById.get(answer.questionId);

      if (!question || !answer.answer.trim()) {
        return [];
      }

      return [
        {
          followupId: followup.id,
          questionId: answer.questionId,
          question: question.question,
          answer: answer.answer,
        },
      ];
    });
  });
}

function hasSufficientAnalysisInput(
  experience: Experience,
  followups: ExperienceFollowup[],
): boolean {
  const followupAnswers = getFollowupAnswerContexts(followups).map(
    (item) => item.answer,
  );
  const meaningfulFieldCount = [
    experience.title,
    experience.role,
    experience.description,
    experience.achievements,
    ...followupAnswers,
  ].filter((value) => compactMeaningfulText(getMeaningfulFieldText(value)).length >= 2)
    .length;
  const totalCharCount = countMeaningfulCharacters([
    experience.title,
    experience.role,
    experience.description,
    experience.achievements,
    ...followupAnswers,
  ]);
  const actionCharCount = countMeaningfulCharacters([
    experience.description,
    experience.achievements,
    ...followupAnswers,
  ]);

  return (
    meaningfulFieldCount >= 2 &&
    totalCharCount >= MIN_ANALYSIS_TOTAL_CHAR_COUNT &&
    actionCharCount >= MIN_ANALYSIS_ACTION_CHAR_COUNT
  );
}

function parseExperienceForAnalysis(value: unknown): Experience | null {
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

function parseFollowupsForAnalysis(
  value: unknown,
  experienceId: string,
): ExperienceFollowup[] {
  if (typeof value === "undefined" || value === null) {
    return [];
  }

  if (!Array.isArray(value) || value.length > MAX_ANALYSIS_FOLLOWUP_COUNT) {
    return [];
  }

  const serializedValue = JSON.stringify(value);

  if (serializedValue.length > MAX_SERIALIZED_FOLLOWUPS_LENGTH) {
    return [];
  }

  const answerCount = value.reduce((count, item) => {
    const candidate = normalizeExperienceFollowup(item);

    return count + (candidate?.answers.length ?? 0);
  }, 0);

  if (answerCount > MAX_ANALYSIS_FOLLOWUP_ANSWER_COUNT) {
    return [];
  }

  return value
    .map(normalizeExperienceFollowup)
    .filter(
      (followup): followup is ExperienceFollowup =>
        followup !== null &&
        followup.experienceId === experienceId &&
        followup.status !== "dismissed" &&
        hasAnsweredFollowup(followup) &&
        followup.answers.every(
          (answer) => answer.answer.length <= MAX_ANALYSIS_FOLLOWUP_ANSWER_LENGTH,
        ),
    )
    .slice(0, MAX_ANALYSIS_FOLLOWUP_COUNT);
}

function createPrompt(
  experience: Experience,
  followups: ExperienceFollowup[],
): string {
  const followupAnswers = getFollowupAnswerContexts(followups);

  return JSON.stringify(
    {
      instruction:
        "아래 대학생 활동 경험과 사용자가 별도로 답한 보완 답변을 분석해 추천, 자기소개서, 포트폴리오, 면접 준비에 다시 활용하기 좋은 간결한 구조로 정리해주세요. 입력되지 않은 날짜, 성과, 수치, 역할, 협업 여부를 과장하거나 꾸며내지 말고, 사용자가 기록한 내용에서 확인되는 범위만 사용하세요.",
      qualityRules: [
        "test, testtest, asdf, 없음처럼 의미 없는 입력은 분석 근거로 사용하지 않습니다.",
        "원문에 없는 날짜, 성과, 수치, 협업 여부, 리더십을 사실처럼 만들지 않습니다.",
        "현재 진행 중인 활동은 종료일을 임의로 추론하지 않고 원본 기간의 현재 표현을 유지합니다.",
        "STAR 항목 중 원본에서 구분하기 어려운 부분은 빈 문자열로 두고 evidenceGaps에 무엇이 부족한지 적습니다.",
        "STAR의 상황, 과제, 행동, 결과는 서로 같은 문장을 반복하지 말고 역할이 다른 정보로 구분합니다.",
        "같은 내용을 요약, STAR, 주요 성과, 부족 정보에서 반복하지 않습니다.",
        "원본 경험과 보완 답변은 출처가 다릅니다. 보완 답변을 원본 description이나 achievements에 원래 있던 내용처럼 표현하지 않습니다.",
        "이미 보완 답변으로 충분히 확인되는 항목은 evidenceGaps에 다시 질문하지 않습니다.",
        "핵심 역량 태그, 역량별 근거, 원본 근거 목록, 자소서 소재 각도는 생성하지 않습니다.",
        "관련 링크의 설명은 사용자가 적은 참고 정보이며, 링크 내용을 직접 열람하거나 검증했다고 가정하지 않습니다.",
      ],
      outputGuidelines: {
        summary: "2~3문장 한국어 요약",
        achievements: "0~4개. 동사와 결과가 보이는 주요 성과. 근거가 없으면 빈 배열",
        keywords:
          "0~10개. 구체 기술, 활동 방식, 산출물, 준비 상황에 재사용할 키워드. 근거가 없으면 빈 배열",
        star:
          "situation, task, action, result 각각 0~2문장. 확인되지 않는 필드는 빈 문자열",
        evidenceGaps:
          "0~5개. id, category, title, reason, question, answer, updatedAt을 포함합니다. category는 result_metric, role_scope, collaboration_scope, technical_detail, process_detail, decision_reason, learning, other 중 하나입니다. question은 사용자가 카드에서 바로 답할 수 있게 구체적으로 작성합니다. 신규 분석의 answer와 updatedAt은 빈 문자열입니다.",
      },
      experience: {
        title: experience.title,
        period: experience.period,
        role: experience.role,
        description: experience.description,
        achievements: experience.achievements,
        relatedLinks: experience.relatedLinks,
      },
      followupAnswers: followupAnswers.map((item) => ({
        followupId: item.followupId,
        questionId: item.questionId,
        question: item.question,
        answer: item.answer,
      })),
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

function hasStarContent(star: ReturnType<typeof normalizeAnalysisStar>): boolean {
  return Object.values(star).some(Boolean);
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
    const star = normalizeAnalysisStar(parsed.star);
    const achievements = normalizeStringList(parsed.achievements, 4);
    const keywords = normalizeStringList(parsed.keywords, 10);
    const evidenceGaps = normalizeAnalysisEvidenceGaps(
      parsed.evidenceGaps,
      5,
    );

    if (
      !summary ||
      (achievements.length === 0 &&
        keywords.length === 0 &&
        evidenceGaps.length === 0 &&
        !hasStarContent(star))
    ) {
      return null;
    }

    return {
      experienceId: experience.id,
      schemaVersion: ANALYSIS_SCHEMA_VERSION,
      promptVersion: ANALYSIS_PROMPT_VERSION,
      model: ANALYSIS_MODEL,
      summary,
      competencyTags: [],
      achievements,
      keywords,
      star,
      evidence: [],
      evidenceGaps,
      coverLetterAngles: [],
      competencyEvidence: [],
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

    const followups = parseFollowupsForAnalysis(
      (body as { followups?: unknown }).followups,
      experience.id,
    );

    return {
      experience,
      followups,
      stream: (body as Record<string, unknown>).stream === true,
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

  const rateLimitResponse = consumeAiApiRateLimit(auth.userId, "analyze");

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestSizeResponse = rejectTooLargeAiApiRequest(request, "analyze");

  if (requestSizeResponse) {
    return requestSizeResponse;
  }

  const body = await readRequestBody(request);

  if (!body) {
    return createErrorResponse(
      "BAD_REQUEST",
      "분석할 경험 데이터가 올바르지 않습니다.",
      400,
    );
  }

  const parsedBody = body;
  const followups = parsedBody.followups ?? [];

  if (!hasSufficientAnalysisInput(parsedBody.experience, followups)) {
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

  const openAiApiKey = apiKey.trim();

  const aiMetric = createAiRequestMetricLogger({
    feature: "experience_analysis",
    responseType: parsedBody.stream ? "sse_stream" : "structured_json",
    inputCharacterCount: countAiInputCharacters([
      parsedBody.experience.title,
      parsedBody.experience.period,
      parsedBody.experience.role,
      parsedBody.experience.description,
      parsedBody.experience.achievements,
      parsedBody.experience.relatedLinks.map((link) => link.description),
      followups.map((followup) => [
        followup.questions.map((question) => question.question),
        followup.answers,
      ]),
    ]),
    experienceCount: 1,
    model: ANALYSIS_MODEL,
    retry: false,
  });
  const createTrackedErrorResult = (
    code: ApiErrorCode,
    message: string,
    status: number,
  ): AnalyzeRouteResult => {
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

  async function executeAnalysisRequest(
    sendStatus?: (message: string) => void,
  ): Promise<AnalyzeRouteResult> {
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
      sendStatus?.("경험 입력과 보완 답변을 확인했어요.");
      sendStatus?.("AI가 요약, STAR, 주요 성과를 구조화하고 있어요.");

      const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        signal: openAiAbortController.signal,
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ANALYSIS_MODEL,
          input: [
            {
              role: "system",
              content:
                "당신은 CampusLog의 AI 경험 분석 도우미입니다. 대학생 활동 경험을 과장 없이 간결하게 정리하고, 사용자가 바로 답할 수 있는 부족 정보 질문을 한국어로 제공합니다.",
            },
            {
              role: "user",
              content: createPrompt(parsedBody.experience, followups),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "campuslog_experience_analysis_v2",
              strict: true,
              schema: analysisResponseSchema,
            },
          },
          max_output_tokens: 1600,
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

        return createTrackedErrorResult(
          "OPENAI_API_ERROR",
          "AI 분석 요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
          502,
        );
      }

      sendStatus?.("AI 응답 형식을 검증하고 있어요.");
      const openAiPayload = (await openAiResponse.json()) as unknown;
      const outputText = extractOutputText(openAiPayload);

      if (!outputText) {
        return createTrackedErrorResult(
          "OPENAI_API_ERROR",
          "AI 분석 응답을 해석하지 못했습니다. 다시 시도해주세요.",
          502,
        );
      }

      sendStatus?.("부족 정보와 활용 키워드를 정리하고 있어요.");
      const analysis = parseAnalysisResult(outputText, parsedBody.experience);

      if (!analysis) {
        return createTrackedErrorResult(
          "OPENAI_API_ERROR",
          "입력된 경험에서 분석에 필요한 단서를 충분히 찾지 못했습니다. 활동에서 맡은 일, 직접 한 행동, 결과나 배운 점을 조금 더 구체적으로 기록한 뒤 다시 요청해주세요.",
          502,
        );
      }

      aiMetric.complete({ status: "success" });
      return {
        response: {
          ok: true,
          analysis,
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
              message: "AI 분석 요청을 취소했습니다.",
            },
          },
          status: 499,
        };
      }

      if (didOpenAiRequestTimeOut) {
        return createTrackedErrorResult(
          "OPENAI_API_ERROR",
          "AI 분석 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
          504,
        );
      }

      return createTrackedErrorResult(
        "UNKNOWN_ERROR",
        "알 수 없는 오류로 AI 분석을 완료하지 못했습니다.",
        500,
      );
    } finally {
      clearTimeout(openAiTimeoutId);
      request.signal.removeEventListener("abort", handleClientAbort);
    }
  }

  if (parsedBody.stream) {
    return createStructuredAiSseResponse<AnalyzeResponse>(async (sender) => {
      const result = await executeAnalysisRequest(sender.sendStatus);

      if (result.response.ok) {
        sender.sendCompleted(result.response);
      } else {
        sender.sendError(result.response);
      }
    });
  }

  const result = await executeAnalysisRequest();

  return NextResponse.json<AnalyzeResponse>(result.response, {
    status: result.status ?? 200,
  });
}
