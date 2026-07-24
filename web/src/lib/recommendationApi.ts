import type {
  Experience,
  ExperienceAnalysis,
  RecommendationImageInput,
  RecommendationPurpose,
  RecommendResponse,
} from "@/lib/types";
import { normalizeRecommendationApiResult } from "@/lib/recommendationResult";
import { isRequestAbortError } from "@/lib/requestCancel";
import {
  isStructuredAiSseResponse,
  readStructuredAiSseResponse,
} from "@/lib/structuredAiStream";

type RequestRecommendationInput = {
  purpose: RecommendationPurpose;
  prompt: string;
  images: RecommendationImageInput[];
  experiences: Experience[];
  analyses: ExperienceAnalysis[];
  signal?: AbortSignal;
  stream?: boolean;
  onStatus?: (message: string) => void;
};

function isRecommendResponse(value: unknown): value is RecommendResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return (
      normalizeRecommendationApiResult(candidate.recommendation) !== null &&
      typeof candidate.resolvedPrompt === "string" &&
      candidate.resolvedPrompt.trim().length > 0
    );
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
  images,
  experiences,
  analyses,
  signal,
  stream,
  onStatus,
}: RequestRecommendationInput): Promise<RecommendResponse> {
  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        purpose,
        prompt,
        images,
        experiences,
        analyses,
        ...(stream ? { stream: true } : {}),
      }),
    });

    if (isStructuredAiSseResponse(response)) {
      const streamPayload = await readStructuredAiSseResponse({
        response,
        isResponse: isRecommendResponse,
        onStatus,
        fallbackResponse: {
          ok: false,
          error: {
            code: "UNKNOWN_ERROR",
            message:
              "AI 기반 활동 추천 스트림을 해석하지 못했습니다. 다시 시도해주세요.",
          },
        },
      });

      if (streamPayload.ok) {
        const recommendation = normalizeRecommendationApiResult(
          streamPayload.recommendation,
        );

        if (recommendation) {
          return {
            ok: true,
            recommendation,
            resolvedPrompt: streamPayload.resolvedPrompt,
          };
        }
      }

      return streamPayload;
    }

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
            resolvedPrompt: payload.resolvedPrompt,
          };
        }
      }

      return payload;
    }
  } catch (error) {
    if (isRequestAbortError(error)) {
      return {
        ok: false,
        error: {
          code: "REQUEST_CANCELLED",
          message: "AI 추천 요청을 취소했습니다.",
        },
      };
    }

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
