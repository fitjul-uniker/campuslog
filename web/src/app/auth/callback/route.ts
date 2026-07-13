import { type NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import {
  createLoginPath,
  createOnboardingPath,
  createSignupPath,
  normalizeReturnTo,
} from "@/lib/auth/contract";
import { hasCompletedCampusLogProfile } from "@/lib/auth/profile";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnTo = normalizeReturnTo(requestUrl.searchParams.get("returnTo"));
  const requiresOnboarding =
    requestUrl.searchParams.get("onboarding") === "required";
  const createFailurePath = requiresOnboarding
    ? createSignupPath
    : createLoginPath;

  if (!code) {
    return NextResponse.redirect(
      new URL(createFailurePath(returnTo, "CALLBACK_FAILED"), request.url),
    );
  }

  const config = getSupabasePublicConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL(
        createFailurePath(returnTo, "CONFIGURATION_MISSING"),
        request.url,
      ),
    );
  }

  const redirectResponse = NextResponse.redirect(
    new URL(returnTo, request.url),
  );
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(createFailurePath(returnTo, "CALLBACK_FAILED"), request.url),
    );
  }

  const targetPath = hasCompletedCampusLogProfile(data.user.user_metadata)
    ? returnTo
    : createOnboardingPath(returnTo);

  redirectResponse.headers.set(
    "location",
    new URL(targetPath, request.url).toString(),
  );

  return redirectResponse;
}
