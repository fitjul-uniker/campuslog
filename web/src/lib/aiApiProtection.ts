import { NextResponse } from "next/server";

import { AUTH_ERROR_MESSAGES } from "@/lib/auth/contract";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiErrorCode, ApiErrorResponse } from "@/lib/types";

export const AI_API_REQUEST_LIMITS = {
  analyze: {
    maxRequestBytes: 32_000,
    openAiTimeoutMs: 45_000,
    rateLimit: {
      maxRequests: 20,
      windowMs: 10 * 60 * 1_000,
    },
  },
  recommend: {
    maxRequestBytes: 3_500_000,
    openAiTimeoutMs: 60_000,
    rateLimit: {
      maxRequests: 12,
      windowMs: 10 * 60 * 1_000,
    },
  },
  answerDrafts: {
    maxRequestBytes: 96_000,
    openAiTimeoutMs: 70_000,
    rateLimit: {
      maxRequests: 10,
      windowMs: 10 * 60 * 1_000,
    },
  },
  evidenceFollowups: {
    maxRequestBytes: 96_000,
    openAiTimeoutMs: 50_000,
    rateLimit: {
      maxRequests: 12,
      windowMs: 10 * 60 * 1_000,
    },
  },
  synthesizeActivity: {
    maxRequestBytes: 512_000,
    openAiTimeoutMs: 50_000,
    rateLimit: {
      maxRequests: 8,
      windowMs: 10 * 60 * 1_000,
    },
  },
} as const;

type AiApiRoute = keyof typeof AI_API_REQUEST_LIMITS;

type AiApiAuthResult =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      response: NextResponse<ApiErrorResponse>;
    };

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function createAiApiErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  options: {
    retryAfter?: number;
  } = {},
) {
  const headers = new Headers();
  const retryAfter = options.retryAfter
    ? Math.max(1, Math.ceil(options.retryAfter))
    : undefined;

  if (retryAfter) {
    headers.set("Retry-After", String(retryAfter));
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(retryAfter ? { retryAfter } : {}),
      },
    },
    {
      status,
      headers,
    },
  );
}

export async function requireAuthenticatedAiApiUser(): Promise<AiApiAuthResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false,
      response: createAiApiErrorResponse(
        "CONFIGURATION_MISSING",
        AUTH_ERROR_MESSAGES.CONFIGURATION_MISSING,
        503,
      ),
    };
  }

  let userId: string | null = null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userId = user?.id ?? null;
  } catch {
    return {
      ok: false,
      response: createAiApiErrorResponse(
        "UNKNOWN_ERROR",
        "인증 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
        500,
      ),
    };
  }

  if (!userId) {
    return {
      ok: false,
      response: createAiApiErrorResponse(
        "SESSION_REQUIRED",
        AUTH_ERROR_MESSAGES.SESSION_REQUIRED,
        401,
      ),
    };
  }

  return {
    ok: true,
    userId,
  };
}

export function rejectTooLargeAiApiRequest(
  request: Request,
  route: AiApiRoute,
): NextResponse<ApiErrorResponse> | null {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return null;
  }

  const requestBytes = Number.parseInt(contentLength, 10);
  const maxRequestBytes = AI_API_REQUEST_LIMITS[route].maxRequestBytes;

  if (!Number.isFinite(requestBytes) || requestBytes <= maxRequestBytes) {
    return null;
  }

  return createAiApiErrorResponse(
    "PAYLOAD_TOO_LARGE",
    "AI 요청 입력이 너무 큽니다. 내용을 줄인 뒤 다시 시도해주세요.",
    413,
  );
}

export function consumeAiApiRateLimit(
  userId: string,
  route: AiApiRoute,
): NextResponse<ApiErrorResponse> | null {
  const now = Date.now();
  const rule = AI_API_REQUEST_LIMITS[route].rateLimit;
  const bucketKey = `${route}:${userId}`;
  const bucket = rateLimitBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + rule.windowMs,
    });

    return null;
  }

  if (bucket.count >= rule.maxRequests) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1_000);

    return createAiApiErrorResponse(
      "RATE_LIMITED",
      "AI 요청이 많습니다. 잠시 후 다시 시도해주세요.",
      429,
      { retryAfter },
    );
  }

  bucket.count += 1;
  return null;
}
