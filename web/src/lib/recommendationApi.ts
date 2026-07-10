import type {
  Experience,
  ExperienceAnalysis,
  RecommendationApiResult,
  RecommendationPurpose,
  RecommendResponse,
} from "@/lib/types";

type RequestRecommendationInput = {
  purpose: RecommendationPurpose;
  prompt: string;
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecommendationApiResult(
  value: unknown,
): value is RecommendationApiResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.recommendedExperienceId === "string" &&
    typeof candidate.recommendedExperienceTitle === "string" &&
    typeof candidate.reason === "string" &&
    isStringArray(candidate.relatedTags) &&
    typeof candidate.highlightedAchievement === "string" &&
    typeof candidate.usageDirection === "string" &&
    typeof candidate.draftSentence === "string"
  );
}

function isRecommendResponse(value: unknown): value is RecommendResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return isRecommendationApiResult(candidate.recommendation);
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
      return payload;
    }
  } catch {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: "AI 추천 요청 중 문제가 발생했습니다. 다시 시도해주세요.",
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "AI 추천 응답을 해석하지 못했습니다. 다시 시도해주세요.",
    },
  };
}
