import type {
  AnalysisApiResult,
  AnalyzeResponse,
  Experience,
  ExperienceFollowup,
} from "@/lib/types";
import {
  ANALYSIS_SCHEMA_VERSION,
  normalizeAnalysisEvidence,
  normalizeAnalysisEvidenceGaps,
  normalizeAnalysisStar,
  normalizeCompetencyEvidence,
  normalizeCoverLetterAngles,
  normalizeStringList,
} from "@/lib/analysisResult";

function parseAnalysisApiResult(value: unknown): AnalysisApiResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const experienceId =
    typeof candidate.experienceId === "string"
      ? candidate.experienceId.trim()
      : "";
  const summary =
    typeof candidate.summary === "string" ? candidate.summary.trim() : "";
  const promptVersion =
    typeof candidate.promptVersion === "string"
      ? candidate.promptVersion.trim()
      : "";
  const model =
    typeof candidate.model === "string" ? candidate.model.trim() : "";

  if (
    !experienceId ||
    !summary ||
    candidate.schemaVersion !== ANALYSIS_SCHEMA_VERSION ||
    !promptVersion ||
    !model
  ) {
    return null;
  }

  return {
    experienceId,
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    promptVersion,
    model,
    summary,
    competencyTags: normalizeStringList(candidate.competencyTags, 12),
    achievements: normalizeStringList(candidate.achievements, 12),
    keywords: normalizeStringList(candidate.keywords, 20),
    star: normalizeAnalysisStar(candidate.star),
    evidence: normalizeAnalysisEvidence(candidate.evidence, 12),
    evidenceGaps: normalizeAnalysisEvidenceGaps(candidate.evidenceGaps, 8),
    coverLetterAngles: normalizeCoverLetterAngles(
      candidate.coverLetterAngles,
      6,
    ),
    competencyEvidence: normalizeCompetencyEvidence(
      candidate.competencyEvidence,
      8,
    ),
  };
}

function isAnalyzeResponse(value: unknown): value is AnalyzeResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return parseAnalysisApiResult(candidate.analysis) !== null;
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
  followups: ExperienceFollowup[] = [],
): Promise<AnalyzeResponse> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ experience, followups }),
    });

    const payload = (await response.json()) as unknown;

    if (isAnalyzeResponse(payload)) {
      if (payload.ok) {
        const analysis = parseAnalysisApiResult(payload.analysis);

        if (analysis) {
          return {
            ok: true,
            analysis,
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
