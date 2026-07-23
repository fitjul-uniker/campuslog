import { normalizeAnswerDraftResult } from "@/lib/answerDraftResult";
import type {
  ActiveAnswerDraftType,
  AnswerDraftsResponse,
  Experience,
  ExperienceAnalysis,
  RecommendationMatch,
  RecommendationResult,
} from "@/lib/types";

type RequestAnswerDraftsInput = {
  draftType: ActiveAnswerDraftType;
  recommendation: RecommendationResult;
  match: RecommendationMatch;
  experience: Experience;
  analysis: ExperienceAnalysis | null;
};

type RequestAnswerDraftsStreamInput = RequestAnswerDraftsInput & {
  onStatus?: (message: string) => void;
  onDelta?: (text: string) => void;
  onReplace?: (text: string) => void;
};

type AnswerDraftStreamError = {
  code?: unknown;
  message?: unknown;
};

type AnswerDraftStreamEvent =
  | {
      type: "status";
      message: string;
    }
  | {
      type: "delta";
      text: string;
    }
  | {
      type: "replace";
      text: string;
    }
  | {
      type: "completed";
      answerDrafts: unknown;
    }
  | {
      type: "error";
      error: AnswerDraftStreamError;
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

function createAnswerDraftsErrorResponse(
  message: string,
): AnswerDraftsResponse {
  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message,
    },
  };
}

function parseAnswerDraftStreamEvent(
  value: unknown,
): AnswerDraftStreamEvent | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    candidate.type === "status" &&
    typeof candidate.message === "string"
  ) {
    return {
      type: "status",
      message: candidate.message,
    };
  }

  if (candidate.type === "delta" && typeof candidate.text === "string") {
    return {
      type: "delta",
      text: candidate.text,
    };
  }

  if (candidate.type === "replace" && typeof candidate.text === "string") {
    return {
      type: "replace",
      text: candidate.text,
    };
  }

  if (candidate.type === "completed") {
    return {
      type: "completed",
      answerDrafts: candidate.answerDrafts,
    };
  }

  if (candidate.type === "error") {
    const error = candidate.error;

    if (error && typeof error === "object") {
      return {
        type: "error",
        error: error as AnswerDraftStreamError,
      };
    }
  }

  return null;
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

export async function requestAnswerDraftsStream({
  draftType,
  recommendation,
  match,
  experience,
  analysis,
  onStatus,
  onDelta,
  onReplace,
}: RequestAnswerDraftsStreamInput): Promise<AnswerDraftsResponse> {
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
        stream: true,
      }),
    });
    const contentType = response.headers.get("Content-Type") ?? "";

    if (!response.body || !contentType.includes("application/x-ndjson")) {
      const payload = (await response.json()) as unknown;

      if (isAnswerDraftsResponse(payload)) {
        return payload;
      }

      return createAnswerDraftsErrorResponse(
        "답변 초안 생성 응답을 해석하지 못했습니다. 다시 시도해주세요.",
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResponse: AnswerDraftsResponse | null = null;

    const handleLine = (line: string) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || finalResponse) {
        return;
      }

      try {
        const event = parseAnswerDraftStreamEvent(JSON.parse(trimmedLine));

        if (!event) {
          finalResponse = createAnswerDraftsErrorResponse(
            "답변 초안 생성 스트림을 해석하지 못했습니다. 다시 시도해주세요.",
          );
          return;
        }

        if (event.type === "status") {
          onStatus?.(event.message);
          return;
        }

        if (event.type === "delta") {
          onDelta?.(event.text);
          return;
        }

        if (event.type === "replace") {
          onReplace?.(event.text);
          return;
        }

        if (event.type === "error") {
          finalResponse = {
            ok: false,
            error: {
              code:
                event.error.code === "OPENAI_API_ERROR"
                  ? "OPENAI_API_ERROR"
                  : "UNKNOWN_ERROR",
              message:
                typeof event.error.message === "string"
                  ? event.error.message
                  : "답변 초안 생성 중 문제가 발생했습니다. 다시 시도해주세요.",
            },
          };
          return;
        }

        const answerDrafts = normalizeAnswerDraftResult(event.answerDrafts);

        if (!answerDrafts) {
          finalResponse = createAnswerDraftsErrorResponse(
            "답변 초안 생성 결과가 올바른 형식이 아닙니다. 다시 시도해주세요.",
          );
          return;
        }

        finalResponse = {
          ok: true,
          answerDrafts,
        };
      } catch {
        finalResponse = createAnswerDraftsErrorResponse(
          "답변 초안 생성 스트림을 해석하지 못했습니다. 다시 시도해주세요.",
        );
      }
    };

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let lineBreakIndex = buffer.indexOf("\n");

      while (lineBreakIndex >= 0) {
        handleLine(buffer.slice(0, lineBreakIndex));
        buffer = buffer.slice(lineBreakIndex + 1);

        if (finalResponse) {
          await reader.cancel();
          return finalResponse;
        }

        lineBreakIndex = buffer.indexOf("\n");
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      handleLine(buffer);
    }

    return (
      finalResponse ??
      createAnswerDraftsErrorResponse(
        "답변 초안 생성 스트림이 완료되지 않았습니다. 다시 시도해주세요.",
      )
    );
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
}
