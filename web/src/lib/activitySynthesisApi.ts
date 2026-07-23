import { ACTIVITY_SYNTHESIS_LIMITS } from "@/lib/activitySynthesisLimits";
import { isRequestAbortError } from "@/lib/requestCancel";
import type {
  ActivitySynthesisApiResult,
  ApiErrorCode,
  DailyLog,
  SynthesizeActivityRequest,
  SynthesizeActivityResponse,
  TrackedActivity,
} from "@/lib/types";

const ACTIVITY_SYNTHESIS_REQUEST_TIMEOUT_MS = 60_000;
const MAX_ID_LENGTH = 160;

function isStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item.length <= maxItemLength,
    )
  );
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    value === "BAD_REQUEST" ||
    value === "CONFIGURATION_MISSING" ||
    value === "SESSION_REQUIRED" ||
    value === "INSUFFICIENT_INPUT" ||
    value === "PAYLOAD_TOO_LARGE" ||
    value === "RATE_LIMITED" ||
    value === "REQUEST_CANCELLED" ||
    value === "OPENAI_API_ERROR" ||
    value === "MISSING_API_KEY" ||
    value === "UNKNOWN_ERROR"
  );
}

function isActivitySynthesisApiResult(
  value: unknown,
  validDailyLogIds: ReadonlySet<string>,
): value is ActivitySynthesisApiResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.description === "string" &&
    candidate.description.trim().length > 0 &&
    isStringArray(candidate.achievements, 6, 1_000) &&
    isStringArray(
      candidate.usedLogIds,
      ACTIVITY_SYNTHESIS_LIMITS.maxDailyLogCount,
      MAX_ID_LENGTH,
    ) &&
    candidate.usedLogIds.length > 0 &&
    isStringArray(candidate.evidenceGaps, 6, 1_000)
  ) {
    const uniqueUsedLogIds = new Set(candidate.usedLogIds);

    return (
      uniqueUsedLogIds.size === candidate.usedLogIds.length &&
      candidate.usedLogIds.every((id) => validDailyLogIds.has(id))
    );
  }

  return false;
}

function isSynthesizeActivityResponse(
  value: unknown,
  validDailyLogIds: ReadonlySet<string>,
): value is SynthesizeActivityResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (candidate.ok === true) {
    return isActivitySynthesisApiResult(
      candidate.synthesis,
      validDailyLogIds,
    );
  }

  if (candidate.ok === false) {
    const error = candidate.error;

    return (
      Boolean(error) &&
      typeof error === "object" &&
      isApiErrorCode((error as Record<string, unknown>).code) &&
      typeof (error as Record<string, unknown>).message === "string"
    );
  }

  return false;
}

export async function requestActivitySynthesis(
  activity: TrackedActivity,
  dailyLogs: DailyLog[],
  options: { signal?: AbortSignal } = {},
): Promise<SynthesizeActivityResponse> {
  const requestBody: SynthesizeActivityRequest = {
    activity,
    dailyLogs,
  };
  const validDailyLogIds = new Set(dailyLogs.map((log) => log.id));
  const abortController = new AbortController();
  let didRequestTimeOut = false;
  const timeoutId = setTimeout(() => {
    didRequestTimeOut = true;
    abortController.abort();
  }, ACTIVITY_SYNTHESIS_REQUEST_TIMEOUT_MS);
  const abortExternalRequest = () => {
    abortController.abort();
  };

  options.signal?.addEventListener("abort", abortExternalRequest, {
    once: true,
  });

  try {
    const response = await fetch("/api/synthesize-activity", {
      method: "POST",
      signal: abortController.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const payload = (await response.json()) as unknown;

    if (isSynthesizeActivityResponse(payload, validDailyLogIds)) {
      return payload;
    }
  } catch (error) {
    if (options.signal?.aborted || isRequestAbortError(error)) {
      return {
        ok: false,
        error: {
          code: "REQUEST_CANCELLED",
          message: "AI 완료 경험 생성 요청을 취소했습니다.",
        },
      };
    }

    if (didRequestTimeOut) {
      return {
        ok: false,
        error: {
          code: "UNKNOWN_ERROR",
          message:
            "AI 완료 경험 생성 시간이 초과되었습니다. 다시 시도해주세요.",
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "UNKNOWN_ERROR",
        message:
          "AI 완료 경험 생성 요청 중 문제가 발생했습니다. 다시 시도해주세요.",
      },
    };
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortExternalRequest);
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message:
        "AI 완료 경험 생성 응답을 해석하지 못했습니다. 다시 시도해주세요.",
    },
  };
}
