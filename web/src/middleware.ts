import { type NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import {
  AUTH_ERROR_MESSAGES,
  createLoginPath,
  isAllowedReturnPath,
  normalizeReturnTo,
} from "@/lib/auth/contract";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

const protectedPagePrefixes = [
  "/dashboard",
  "/activities",
  "/experiences",
  "/recommend",
];

const protectedApiPaths = [
  "/api/analyze",
  "/api/recommend",
  "/api/synthesize-activity",
];

const authPagePaths = ["/login", "/signup"];

function isProtectedPage(pathname: string) {
  return protectedPagePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isProtectedApi(pathname: string) {
  return protectedApiPaths.some((path) => pathname === path);
}

function createReturnTo(request: NextRequest) {
  return normalizeReturnTo(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function redirectWithCookies(
  request: NextRequest,
  path: string,
  response: NextResponse,
) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));
  copyResponseCookies(response, redirectResponse);
  return redirectResponse;
}

function createAuthApiError(status: number) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: status === 503 ? "CONFIGURATION_MISSING" : "SESSION_REQUIRED",
        message:
          status === 503
            ? AUTH_ERROR_MESSAGES.CONFIGURATION_MISSING
            : AUTH_ERROR_MESSAGES.SESSION_REQUIRED,
      },
    },
    { status },
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const shouldProtectPage = isProtectedPage(pathname);
  const shouldProtectApi = isProtectedApi(pathname);
  const isAuthPage = authPagePaths.includes(pathname);

  if (!shouldProtectPage && !shouldProtectApi && !isAuthPage) {
    return NextResponse.next();
  }

  const config = getSupabasePublicConfig();

  if (!config) {
    if (shouldProtectApi) {
      return createAuthApiError(503);
    }

    if (shouldProtectPage) {
      return NextResponse.redirect(
        new URL(
          createLoginPath(createReturnTo(request), "CONFIGURATION_MISSING"),
          request.url,
        ),
      );
    }

    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (shouldProtectApi && !user) {
    return createAuthApiError(401);
  }

  if (shouldProtectPage && !user) {
    return redirectWithCookies(
      request,
      createLoginPath(createReturnTo(request), "SESSION_REQUIRED"),
      response,
    );
  }

  if (isAuthPage && user) {
    const rawReturnTo = request.nextUrl.searchParams.get("returnTo");
    const returnTo = normalizeReturnTo(rawReturnTo);
    const targetPath = isAllowedReturnPath(returnTo)
      ? returnTo
      : "/dashboard";

    return redirectWithCookies(request, targetPath, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|app-icon.svg|cover-book.png|black-leather-book.webp|fonts/.*).*)",
  ],
};
