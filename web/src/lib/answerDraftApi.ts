import { normalizeAnswerDraftResult } from "@/lib/answerDraftResult";
import type {
  AnswerDraftsResponse,
  AnswerDraftType,
  Experience,
  ExperienceAnalysis,
  RecommendationMatch,
  RecommendationResult,
} from "@/lib/types";

type RequestAnswerDraftsInput = {
  draftType: AnswerDraftType;
  recommendation: RecommendationResult;
  match: RecommendationMatch;
  experience: Experience;
  analysis: ExperienceAnalysis | null;
};

function isAnswerDraftsResponse(
  value: unknown,
): value is AnswerDraftsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return normalizeAnswerDraftResult(candidate.answerDrafts) !== null;
  }

  if (candidate.ok === false) {
    const error = candidate.error;

    return (
      Boolean(error) &&
      typeof error === "object" &&
      typeof (error as Record<string, unknown>).code === "string" &&
      typeof (error as Record<string, unknown>).message === "string"
    );
  }

  return false;
}

export async function requestAnswerDrafts({
  draftType,
  recommendation,
  match,
  experience,
  analysis,
}: RequestAnswerDraftsInput): Promise<AnswerDraftsResponse> {
  try {
    const response = await fetch("/api/answer-drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        draftType,
        recommendation,
        match,
        experience,
        analysis,
      }),
    });

    const payload = (await response.json()) as unknown;

    if (isAnswerDraftsResponse(payload)) {
      if (payload.ok) {
        const answerDrafts = normalizeAnswerDraftResult(payload.answerDrafts);

        if (answerDrafts) {
          return {
            ok: true,
            answerDrafts,
          };
        }
      }

      return payload;
    }
  } catch {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_ERROR",
        message:
          "답변 초안 생성 요청 중 문제가 발생했습니다. 다시 시도해주세요.",
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message:
        "답변 초안 생성 응답을 해석하지 못했습니다. 다시 시도해주세요.",
    },
  };
}
