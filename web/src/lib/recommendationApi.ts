import type {
  Experience,
  ExperienceAnalysis,
  RecommendationPurpose,
  RecommendResponse,
} from "@/lib/types";
import { normalizeRecommendationApiResult } from "@/lib/recommendationResult";

type RequestRecommendationInput = {
  purpose: RecommendationPurpose;
  prompt: string;
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
};

function isRecommendResponse(value: unknown): value is RecommendResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return normalizeRecommendationApiResult(candidate.recommendation) !== null;
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

export async function requestRecommendation({
  purpose,
  prompt,
  experiences,
  analyses,
}: RequestRecommendationInput): Promise<RecommendResponse> {
  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        purpose,
        prompt,
        experiences,
        analyses,
      }),
    });

    const payload = (await response.json()) as unknown;

    if (isRecommendResponse(payload)) {
      if (payload.ok) {
        const recommendation = normalizeRecommendationApiResult(
          payload.recommendation,
        );

        if (recommendation) {
          return {
            ok: true,
            recommendation,
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
          "AI 기반 활동 추천 요청 중 문제가 발생했습니다. 다시 시도해주세요.",
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message:
        "AI 기반 활동 추천 응답을 해석하지 못했습니다. 다시 시도해주세요.",
    },
  };
}
