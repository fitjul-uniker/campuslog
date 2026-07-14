import { normalizeExperienceFollowup } from "@/lib/experienceFollowupResult";
import type {
  AnswerDraft,
  EvidenceFollowupsResponse,
  Experience,
  ExperienceAnalysis,
  ExperienceFollowupSource,
  RecommendationMatch,
  RecommendationResult,
} from "@/lib/types";

type RequestEvidenceFollowupsInput = {
  experience: Experience;
  source: ExperienceFollowupSource;
  analysis?: ExperienceAnalysis | null;
  recommendation?: RecommendationResult | null;
  match?: RecommendationMatch | null;
  answerDraft?: AnswerDraft | null;
};

function isEvidenceFollowupsResponse(
  value: unknown,
): value is EvidenceFollowupsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return normalizeExperienceFollowup(candidate.followup) !== null;
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

export async function requestEvidenceFollowupQuestions({
  experience,
  source,
  analysis = null,
  recommendation = null,
  match = null,
  answerDraft = null,
}: RequestEvidenceFollowupsInput): Promise<EvidenceFollowupsResponse> {
  try {
    const response = await fetch("/api/evidence-followups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        experience,
        source,
        analysis,
        recommendation,
        match,
        answerDraft,
      }),
    });

    const payload = (await response.json()) as unknown;

    if (isEvidenceFollowupsResponse(payload)) {
      if (payload.ok) {
        const followup = normalizeExperienceFollowup(payload.followup);

        if (followup) {
          return {
            ok: true,
            followup,
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
          "보완 질문 생성 요청 중 문제가 발생했습니다. 다시 시도해주세요.",
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message:
        "보완 질문 생성 응답을 해석하지 못했습니다. 다시 시도해주세요.",
    },
  };
}
