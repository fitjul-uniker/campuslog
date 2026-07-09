import type { AnalysisApiResult, AnalyzeResponse, Experience } from "@/lib/types";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAnalysisApiResult(value: unknown): value is AnalysisApiResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.experienceId === "string" &&
    typeof candidate.summary === "string" &&
    isStringArray(candidate.competencyTags) &&
    isStringArray(candidate.achievements) &&
    isStringArray(candidate.keywords)
  );
}

function isAnalyzeResponse(value: unknown): value is AnalyzeResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return isAnalysisApiResult(candidate.analysis);
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

export async function requestExperienceAnalysis(
  experience: Experience,
): Promise<AnalyzeResponse> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ experience }),
    });

    const payload = (await response.json()) as unknown;

    if (isAnalyzeResponse(payload)) {
      return payload;
    }
  } catch {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: "AI 분석 요청 중 문제가 발생했습니다. 다시 시도해주세요.",
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "AI 분석 응답을 해석하지 못했습니다. 다시 시도해주세요.",
    },
  };
}
