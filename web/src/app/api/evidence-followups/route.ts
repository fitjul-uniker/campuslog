import { NextResponse } from "next/server";

import {
  normalizeExperienceAnalysis,
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
import {
  ANSWER_DRAFT_TYPES,
  normalizeAnswerDraft,
} from "@/lib/answerDraftResult";
import {
  EXPERIENCE_FOLLOWUP_PROMPT_VERSION,
  EXPERIENCE_FOLLOWUP_SCHEMA_VERSION,
  EXPERIENCE_FOLLOWUP_TARGET_EVIDENCE_TYPES,
  isExperienceFollowupSource,
  isExperienceFollowupTargetEvidenceType,
} from "@/lib/experienceFollowupResult";
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
  EvidenceFollowupsRequest,
  EvidenceFollowupsResponse,
  Experience,
  ExperienceAnalysis,
  ExperienceFollowup,
  ExperienceFollowupQuestion,
  RecommendationMatch,
  RecommendationResult,
  RelatedLink,
} from "@/lib/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const EVIDENCE_FOLLOWUP_MODEL = "gpt-4.1-mini";
const OPENAI_REQUEST_TIMEOUT_MS =
  AI_API_REQUEST_LIMITS.evidenceFollowups.openAiTimeoutMs;
const MAX_ID_LENGTH = 160;
const MAX_EXPERIENCE_TITLE_LENGTH = 200;
const MAX_EXPERIENCE_PERIOD_LENGTH = 120;
const MAX_EXPERIENCE_ROLE_LENGTH = 200;
const MAX_EXPERIENCE_DESCRIPTION_LENGTH = 8_000;
const MAX_EXPERIENCE_ACHIEVEMENTS_LENGTH = 4_000;
const MAX_TIMESTAMP_LENGTH = 100;
const MAX_SERIALIZED_ANALYSIS_LENGTH = 24_000;
const MAX_SERIALIZED_RECOMMENDATION_LENGTH = 36_000;
const MAX_SIGNAL_LENGTH = 1_000;

const followupResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "reason", "targetEvidenceType", "caution"],
        properties: {
          question: {
            type: "string",
            description:
              "사용자가 실제로 기억하거나 기록에서 확인할 수 있는 구체적인 질문",
          },
          reason: {
            type: "string",
            description: "이 질문이 왜 필요한지에 대한 짧은 설명",
          },
          targetEvidenceType: {
            type: "string",
            enum: EXPERIENCE_FOLLOWUP_TARGET_EVIDENCE_TYPES,
          },
          caution: {
            type: "string",
            description:
              "답변할 때 허위 성과, 개인정보, 확인되지 않은 수치를 피하라는 주의점",
          },
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

function createId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseExperienceForFollowups(value: unknown): Experience | null {
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

function parseAnalysisForFollowups(value: unknown): ExperienceAnalysis | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const analysis = normalizeExperienceAnalysis(value);

  if (!analysis) {
    return null;
  }

  return JSON.stringify(analysis).length <= MAX_SERIALIZED_ANALYSIS_LENGTH
    ? analysis
    : null;
}

function parseRecommendationForFollowups(
  value: unknown,
): RecommendationResult | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const recommendation = normalizeRecommendationResult(value);

  if (!recommendation) {
    return null;
  }

  return JSON.stringify(recommendation).length <=
    MAX_SERIALIZED_RECOMMENDATION_LENGTH
    ? recommendation
    : null;
}

function parseMatchForFollowups(value: unknown): RecommendationMatch | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  return normalizeRecommendationMatch(value);
}

function parseAnswerDraftForFollowups(value: unknown): AnswerDraft | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  return normalizeAnswerDraft(value);
}

function truncateSignal(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();

  return trimmed.length <= MAX_SIGNAL_LENGTH
    ? trimmed
    : `${trimmed.slice(0, MAX_SIGNAL_LENGTH - 1)}…`;
}

function uniqueSignals(values: string[]): string[] {
  const seen = new Set<string>();

  return values
    .map(truncateSignal)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLocaleLowerCase("ko-KR");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

function matchBelongsToRecommendation(
  recommendation: RecommendationResult,
  match: RecommendationMatch,
): boolean {
  return recommendation.matches.some(
    (item) =>
      item.experienceId === match.experienceId && item.rank === match.rank,
  );
}

function getSourceSignals(body: EvidenceFollowupsRequest): string[] {
  switch (body.source) {
    case "analysis_gap":
      return uniqueSignals(
        body.analysis?.evidenceGaps.map(
          (gap) => `${gap.topic}: ${gap.reason} / 기존 질문: ${gap.question}`,
        ) ?? [],
      );
    case "recommendation_missing_evidence":
      return uniqueSignals(body.match?.missingEvidence ?? []);
    case "recommendation_overclaim_risk":
      return uniqueSignals(body.match?.overclaimRisks ?? []);
    case "answer_draft_missing_evidence":
      return uniqueSignals(body.answerDraft?.missingEvidenceNotes ?? []);
    case "answer_draft_caution":
      return uniqueSignals(body.answerDraft?.cautions ?? []);
    case "manual":
      return [
        "사용자가 이 경험을 더 정확하게 분석하기 위해 직접 보완 질문 생성을 요청했습니다.",
      ];
  }
}

function isCompatibleBody(body: EvidenceFollowupsRequest): boolean {
  if (body.analysis && body.analysis.experienceId !== body.experience.id) {
    return false;
  }

  if (body.match && body.match.experienceId !== body.experience.id) {
    return false;
  }

  if (
    body.recommendation &&
    body.match &&
    !matchBelongsToRecommendation(body.recommendation, body.match)
  ) {
    return false;
  }

  if (
    (body.source === "recommendation_missing_evidence" ||
      body.source === "recommendation_overclaim_risk") &&
    (!body.recommendation || !body.match)
  ) {
    return false;
  }

  if (
    (body.source === "answer_draft_missing_evidence" ||
      body.source === "answer_draft_caution") &&
    !body.answerDraft
  ) {
    return false;
  }

  return getSourceSignals(body).length > 0;
}

function createPrompt(body: EvidenceFollowupsRequest): string {
  return JSON.stringify(
    {
      instruction:
        "CampusLog 사용자가 부족한 근거를 실제 기록으로 보완할 수 있도록 안전한 질문을 제안해주세요.",
      schemaMetadata: {
        schemaVersion: EXPERIENCE_FOLLOWUP_SCHEMA_VERSION,
        promptVersion: EXPERIENCE_FOLLOWUP_PROMPT_VERSION,
        model: EVIDENCE_FOLLOWUP_MODEL,
      },
      source: body.source,
      sourceSignals: getSourceSignals(body),
      safetyRules: [
        "질문은 사용자가 실제로 기억하거나 기존 기록, 산출물, 회고에서 확인할 수 있는 것만 묻습니다.",
        "성과 수치를 만들어내라고 요구하지 않습니다. 실제 측정한 지표, 비교 기준, 전후 변화가 있는지 확인하는 방식으로 묻습니다.",
        "개인정보, 주민등록번호, 연락처, 주소, 건강, 정치/종교 등 민감 정보 입력을 요구하지 않습니다.",
        "없는 역할, 협업 규모, 기술명, 수상명, 결과를 추가하도록 유도하지 않습니다.",
        "답변이 없거나 기억나지 않으면 비워둘 수 있음을 caution에 자연스럽게 포함합니다.",
        "한 질문에는 한 가지 근거만 묻고, 장황한 복합 질문을 피합니다.",
      ],
      targetEvidenceTypes:
        "result_metric, role_scope, collaboration_scope, technical_detail, process_detail, decision_reason, learning, other 중 가장 가까운 값을 사용",
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
            summary: body.analysis.summary,
            evidenceGaps: body.analysis.evidenceGaps,
            evidence: body.analysis.evidence.slice(0, 8),
            coverLetterAngles: body.analysis.coverLetterAngles.slice(0, 4),
          }
        : null,
      recommendation: body.recommendation
        ? {
            id: body.recommendation.id,
            prompt: body.recommendation.prompt,
            extractedRequirements: body.recommendation.extractedRequirements,
          }
        : null,
      match: body.match,
      answerDraft: body.answerDraft
        ? {
            type: body.answerDraft.type,
            title: body.answerDraft.title,
            missingEvidenceNotes: body.answerDraft.missingEvidenceNotes,
            cautions: body.answerDraft.cautions,
          }
        : null,
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

function parseFollowupQuestions(rawOutput: string): ExperienceFollowupQuestion[] {
  try {
    const parsed = JSON.parse(stripJsonFence(rawOutput)) as Record<
      string,
      unknown
    >;

    if (!Array.isArray(parsed.questions)) {
      return [];
    }

    return parsed.questions
      .map((item, index) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as Record<string, unknown>;
        const question =
          typeof candidate.question === "string"
            ? candidate.question.trim()
            : "";
        const reason =
          typeof candidate.reason === "string" ? candidate.reason.trim() : "";
        const caution =
          typeof candidate.caution === "string"
            ? candidate.caution.trim()
            : "";
        const targetEvidenceType = candidate.targetEvidenceType;

        if (
          !question ||
          !reason ||
          !isExperienceFollowupTargetEvidenceType(targetEvidenceType)
        ) {
          return null;
        }

        return {
          id: `question-${index + 1}`,
          question,
          reason,
          targetEvidenceType,
          caution:
            caution ||
            "실제로 확인되는 내용만 답하고, 기억나지 않으면 비워두세요.",
        } satisfies ExperienceFollowupQuestion;
      })
      .filter(
        (question): question is ExperienceFollowupQuestion =>
          question !== null,
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

async function readRequestBody(
  request: Request,
): Promise<EvidenceFollowupsRequest | null> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return null;
    }

    const candidate = body as Record<string, unknown>;
    const source = candidate.source;
    const experience = parseExperienceForFollowups(candidate.experience);
    const analysis = parseAnalysisForFollowups(candidate.analysis);
    const recommendation = parseRecommendationForFollowups(
      candidate.recommendation,
    );
    const match = parseMatchForFollowups(candidate.match);
    const answerDraft = parseAnswerDraftForFollowups(candidate.answerDraft);

    if (!experience || !isExperienceFollowupSource(source)) {
      return null;
    }

    const requestBody: EvidenceFollowupsRequest = {
      experience,
      source,
      analysis,
      recommendation,
      match,
      answerDraft,
    };

    return isCompatibleBody(requestBody) ? requestBody : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedAiApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const rateLimitResponse = consumeAiApiRateLimit(
    auth.userId,
    "evidenceFollowups",
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestSizeResponse = rejectTooLargeAiApiRequest(
    request,
    "evidenceFollowups",
  );

  if (requestSizeResponse) {
    return requestSizeResponse;
  }

  const body = await readRequestBody(request);

  if (!body) {
    return createErrorResponse(
      "BAD_REQUEST",
      "보완 질문 생성에 필요한 입력 데이터가 올바르지 않습니다.",
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

  const aiMetric = createAiRequestMetricLogger({
    feature: "evidence_followup",
    responseType: "structured_json",
    inputCharacterCount: countAiInputCharacters([
      body.source,
      body.experience.title,
      body.experience.period,
      body.experience.role,
      body.experience.description,
      body.experience.achievements,
      body.analysis
        ? [
            body.analysis.summary,
            body.analysis.achievements,
            body.analysis.keywords,
            body.analysis.evidenceGaps.map((gap) => [
              gap.title,
              gap.reason,
              gap.answer,
            ]),
          ]
        : [],
      body.recommendation
        ? [
            body.recommendation.purpose,
            body.recommendation.prompt,
            body.recommendation.extractedRequirements,
          ]
        : [],
      body.match
        ? [
            body.match.matchReason,
            body.match.matchedEvidence,
            body.match.missingEvidence,
            body.match.overclaimRisks,
          ]
        : [],
      body.answerDraft
        ? [
            body.answerDraft.type,
            body.answerDraft.content,
            body.answerDraft.missingEvidenceNotes,
            body.answerDraft.cautions,
          ]
        : [],
    ]),
    experienceCount: 1,
    model: EVIDENCE_FOLLOWUP_MODEL,
    retry: false,
  });
  const createTrackedErrorResponse = (
    ...args: Parameters<typeof createErrorResponse>
  ) => {
    aiMetric.complete({ status: "error" });
    return createErrorResponse(...args);
  };

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
    const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: openAiAbortController.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EVIDENCE_FOLLOWUP_MODEL,
        input: [
          {
            role: "system",
            content:
              "당신은 CampusLog의 기록 보완 질문 도우미입니다. 사용자가 실제로 확인할 수 있는 사실만 묻고, 허위 성과·수치·역할·협업 규모·기술명·개인정보를 유도하지 않습니다.",
          },
          {
            role: "user",
            content: createPrompt(body),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "campuslog_evidence_followups_v1",
            strict: true,
            schema: followupResponseSchema,
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

        console.warn("CampusLog evidence followup OpenAI request failed", {
          status: openAiResponse.status,
          code: errorPayload.error?.code,
          type: errorPayload.error?.type,
        });
      } catch {
        console.warn("CampusLog evidence followup OpenAI request failed", {
          status: openAiResponse.status,
        });
      }

      return createTrackedErrorResponse(
        "OPENAI_API_ERROR",
        "보완 질문 생성을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    const openAiPayload = (await openAiResponse.json()) as unknown;
    const outputText = extractOutputText(openAiPayload);

    if (!outputText) {
      return createTrackedErrorResponse(
        "OPENAI_API_ERROR",
        "보완 질문 생성 응답을 해석하지 못했습니다. 다시 시도해주세요.",
        502,
      );
    }

    const questions = parseFollowupQuestions(outputText);

    if (questions.length === 0) {
      return createTrackedErrorResponse(
        "OPENAI_API_ERROR",
        "안전하게 저장할 보완 질문을 만들지 못했습니다. 원본 기록을 조금 더 구체화한 뒤 다시 시도해주세요.",
        502,
      );
    }

    const timestamp = new Date().toISOString();
    const followup: ExperienceFollowup = {
      id: createId("followup"),
      schemaVersion: EXPERIENCE_FOLLOWUP_SCHEMA_VERSION,
      experienceId: body.experience.id,
      source: body.source,
      sourceRecommendationId: body.recommendation?.id,
      sourceAnswerDraftType: body.answerDraft
        ? ANSWER_DRAFT_TYPES.includes(body.answerDraft.type)
          ? body.answerDraft.type
          : undefined
        : undefined,
      questions,
      answers: [],
      status: "open",
      generatedAt: timestamp,
      updatedAt: timestamp,
    };

    aiMetric.complete({ status: "success" });
    return NextResponse.json<EvidenceFollowupsResponse>({
      ok: true,
      followup,
    });
  } catch {
    if (request.signal.aborted && !didOpenAiRequestTimeOut) {
      aiMetric.complete({ status: "cancelled" });
      return createErrorResponse(
        "REQUEST_CANCELLED",
        "보완 질문 생성을 취소했습니다.",
        499,
      );
    }

    if (didOpenAiRequestTimeOut) {
      return createTrackedErrorResponse(
        "OPENAI_API_ERROR",
        "보완 질문 생성 요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
        504,
      );
    }

    return createTrackedErrorResponse(
      "UNKNOWN_ERROR",
      "알 수 없는 오류로 보완 질문 생성을 완료하지 못했습니다.",
      500,
    );
  } finally {
    clearTimeout(openAiTimeoutId);
    request.signal.removeEventListener("abort", handleClientAbort);
  }
}
