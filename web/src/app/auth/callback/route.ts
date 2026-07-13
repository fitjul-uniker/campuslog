import { type NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { createLoginPath, normalizeReturnTo } from "@/lib/auth/contract";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnTo = normalizeReturnTo(requestUrl.searchParams.get("returnTo"));

  if (!code) {
    return NextResponse.redirect(
      new URL(createLoginPath(returnTo, "CALLBACK_FAILED"), request.url),
    );
  }

  const config = getSupabasePublicConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL(createLoginPath(returnTo, "CONFIGURATION_MISSING"), request.url),
    );
  }

  const redirectResponse = NextResponse.redirect(new URL(returnTo, request.url));
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(createLoginPath(returnTo, "CALLBACK_FAILED"), request.url),
    );
  }

  return redirectResponse;
}
