import type { ApiErrorResponse } from "@/lib/types";

type StructuredAiSseEventName = "status" | "completed" | "error";

type StructuredAiSseSender<TResponse> = {
  sendStatus: (message: string) => void;
  sendCompleted: (response: TResponse) => void;
  sendError: (response: ApiErrorResponse) => void;
};

type ReadStructuredAiSseResponseInput<TResponse> = {
  response: Response;
  isResponse: (value: unknown) => value is TResponse;
  onStatus?: (message: string) => void;
  fallbackResponse: TResponse;
};

const structuredAiSseEncoder = new TextEncoder();

function encodeStructuredAiSseEvent(
  eventName: StructuredAiSseEventName,
  payload: unknown,
): Uint8Array {
  return structuredAiSseEncoder.encode(
    `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`,
  );
}

function createUnknownStreamErrorResponse(): ApiErrorResponse {
  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "AI 요청 스트림을 완료하지 못했습니다. 다시 시도해주세요.",
    },
  };
}

export function createStructuredAiSseResponse<TResponse>(
  run: (sender: StructuredAiSseSender<TResponse>) => Promise<void>,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let didSendTerminalEvent = false;
      let didCloseStream = false;

      const sendEvent = (eventName: StructuredAiSseEventName, payload: unknown) => {
        if (didCloseStream) {
          return;
        }

        try {
          controller.enqueue(encodeStructuredAiSseEvent(eventName, payload));
        } catch {
          didCloseStream = true;
        }
      };

      const sender: StructuredAiSseSender<TResponse> = {
        sendStatus(message) {
          if (!didSendTerminalEvent) {
            sendEvent("status", { message });
          }
        },
        sendCompleted(response) {
          if (!didSendTerminalEvent) {
            didSendTerminalEvent = true;
            sendEvent("completed", response);
          }
        },
        sendError(response) {
          if (!didSendTerminalEvent) {
            didSendTerminalEvent = true;
            sendEvent("error", response);
          }
        },
      };

      try {
        await run(sender);
      } catch {
        sender.sendError(createUnknownStreamErrorResponse());
      } finally {
        if (!didCloseStream) {
          try {
            controller.close();
          } catch {
            didCloseStream = true;
          }
        }
      }
    },
    cancel() {
      return undefined;
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

export function isStructuredAiSseResponse(response: Response): boolean {
  return (response.headers.get("Content-Type") ?? "").includes(
    "text/event-stream",
  );
}

function consumeSseMessages(
  buffer: string,
  onMessage: (eventName: string, data: string) => void,
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  parts.forEach((part) => {
    const lines = part.split("\n");
    const eventName =
      lines
        .find((line) => line.startsWith("event:"))
        ?.slice(6)
        .trim() ?? "message";
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();

    if (data) {
      onMessage(eventName, data);
    }
  });

  return rest;
}

export async function readStructuredAiSseResponse<TResponse>({
  response,
  isResponse,
  onStatus,
  fallbackResponse,
}: ReadStructuredAiSseResponseInput<TResponse>): Promise<TResponse> {
  const reader = response.body?.getReader();

  if (!reader) {
    return fallbackResponse;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: TResponse | null = null;

  const handleMessage = (eventName: string, data: string) => {
    if (finalResponse) {
      return;
    }

    try {
      const payload = JSON.parse(data) as unknown;

      if (eventName === "status") {
        if (
          payload &&
          typeof payload === "object" &&
          typeof (payload as Record<string, unknown>).message === "string"
        ) {
          onStatus?.((payload as { message: string }).message);
        }

        return;
      }

      if (
        (eventName === "completed" || eventName === "error") &&
        isResponse(payload)
      ) {
        finalResponse = payload;
      }
    } catch {
      finalResponse = fallbackResponse;
    }
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    buffer = consumeSseMessages(buffer, handleMessage);

    if (finalResponse) {
      await reader.cancel();
      return finalResponse;
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    consumeSseMessages(`${buffer}\n\n`, handleMessage);
  }

  return finalResponse ?? fallbackResponse;
}
