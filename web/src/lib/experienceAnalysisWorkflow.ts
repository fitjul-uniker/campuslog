import { requestExperienceAnalysis } from "@/lib/analysisApi";
import {
  CampusLogRepositoryError,
  getCampusLogRepository,
  isRepositorySessionError,
} from "@/lib/repositories/campuslogRepository";
import type {
  ApiErrorCode,
  Experience,
  ExperienceAnalysis,
} from "@/lib/types";

type AnalyzeCurrentExperienceOptions = {
  signal?: AbortSignal;
  stream?: boolean;
  onStatus?: (message: string) => void;
};

export type AnalyzeCurrentExperienceResult =
  | {
      ok: true;
      analysis: ExperienceAnalysis;
      experience: Experience;
    }
  | {
      ok: false;
      error: {
        code: ApiErrorCode;
        message: string;
      };
    };

function createWorkflowError(
  code: ApiErrorCode,
  message: string,
): AnalyzeCurrentExperienceResult {
  return {
    ok: false,
    error: { code, message },
  };
}

export async function analyzeCurrentExperience(
  experienceId: string,
  options: AnalyzeCurrentExperienceOptions = {},
): Promise<AnalyzeCurrentExperienceResult> {
  const repository = getCampusLogRepository();

  try {
    // Always analyze the latest persisted row. This avoids sending stale or
    // partially loaded data when another tab or device edited the account.
    const [experience, followups] = await Promise.all([
      repository.experiences.getById(experienceId),
      repository.experienceFollowups.listByExperienceId(experienceId),
    ]);

    if (!experience) {
      return createWorkflowError(
        "BAD_REQUEST",
        "분석할 경험을 찾을 수 없습니다. 활동 목록을 새로고침해 주세요.",
      );
    }

    const response = await requestExperienceAnalysis(
      experience,
      followups,
      options,
    );

    if (!response.ok) {
      return response;
    }

    // The repository uses an atomic upsert, so simultaneous analyses for the
    // same account and experience converge on one saved result.
    let savedAnalysis: ExperienceAnalysis | null;
    try {
      savedAnalysis = await repository.analyses.save(
        response.analysis,
        experience,
      );
    } catch (error) {
      if (isRepositorySessionError(error)) {
        throw error;
      }

      if (
        error instanceof CampusLogRepositoryError &&
        error.code === "CONCURRENT_UPDATE"
      ) {
        return createWorkflowError("BAD_REQUEST", error.message);
      }

      return createWorkflowError(
        "UNKNOWN_ERROR",
        "AI 생성은 완료되었지만 분석 결과 저장에 실패했습니다. 경험을 새로고침한 뒤 다시 시도해 주세요.",
      );
    }

    if (!savedAnalysis) {
      return createWorkflowError(
        "UNKNOWN_ERROR",
        "분석 결과를 저장하지 못했습니다. 활동 목록을 새로고침해 주세요.",
      );
    }

    const updatedExperience = await repository.experiences.getById(experienceId);

    if (!updatedExperience) {
      return createWorkflowError(
        "BAD_REQUEST",
        "분석한 경험이 삭제되었습니다. 활동 목록을 새로고침해 주세요.",
      );
    }

    return {
      ok: true,
      analysis: savedAnalysis,
      experience: updatedExperience,
    };
  } catch (error) {
    if (isRepositorySessionError(error)) {
      return createWorkflowError(
        "SESSION_REQUIRED",
        "로그인 세션이 만료되었습니다. 다시 로그인한 뒤 분석해 주세요.",
      );
    }

    return createWorkflowError(
      "UNKNOWN_ERROR",
      error instanceof Error
        ? error.message
        : "AI 분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }
}
