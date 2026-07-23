export type AiRequestFeature =
  | "experience_analysis"
  | "experience_recommendation"
  | "answer_draft"
  | "evidence_followup"
  | "activity_synthesis";

export type AiRequestResponseType =
  | "structured_json"
  | "ndjson_stream"
  | "sse_stream";

export type AiRequestStatus = "success" | "error" | "cancelled";

type AiRequestMetricInput = {
  feature: AiRequestFeature;
  responseType: AiRequestResponseType;
  inputCharacterCount: number;
  experienceCount: number;
  model: string;
  targetCharacterCount?: number;
  retry: boolean;
};

type AiRequestMetricCompleteInput = {
  status: AiRequestStatus;
};

export type AiRequestMetricLogger = {
  markFirstToken: () => void;
  markRetry: () => void;
  complete: (input: AiRequestMetricCompleteInput) => void;
};

function getNowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function countAiInputCharacters(values: unknown[]): number {
  return values.reduce<number>((count, value) => {
    if (typeof value === "string") {
      return count + Array.from(value).length;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return count + String(value).length;
    }

    if (Array.isArray(value)) {
      return count + countAiInputCharacters(value);
    }

    if (value && typeof value === "object") {
      return count + countAiInputCharacters(Object.values(value));
    }

    return count;
  }, 0);
}

export function createAiRequestMetricLogger(
  input: AiRequestMetricInput,
): AiRequestMetricLogger {
  const startedAt = getNowMs();
  let firstTokenAt: number | null = null;
  let didRetry = input.retry;
  let didComplete = false;

  return {
    markFirstToken() {
      firstTokenAt ??= getNowMs();
    },
    markRetry() {
      didRetry = true;
    },
    complete({ status }) {
      if (didComplete) {
        return;
      }

      didComplete = true;

      const completedAt = getNowMs();
      const totalDurationMs = Math.max(0, Math.round(completedAt - startedAt));
      const timeToFirstTokenMs =
        firstTokenAt === null
          ? null
          : Math.max(0, Math.round(firstTokenAt - startedAt));

      console.info("CampusLog AI request metric", {
        feature: input.feature,
        responseType: input.responseType,
        inputCharacterCount: input.inputCharacterCount,
        experienceCount: input.experienceCount,
        targetCharacterCount: input.targetCharacterCount ?? null,
        model: input.model,
        timeToFirstTokenMs,
        totalDurationMs,
        status,
        cancelled: status === "cancelled",
        retry: didRetry,
      });
    },
  };
}
