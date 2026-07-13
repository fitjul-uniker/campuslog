"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_DEFAULT_RETURN_TO,
  type AuthErrorCode,
  type AuthFormState,
  createAuthErrorState,
  createAuthSuccessState,
  createSignupPath,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  normalizePassword,
  normalizeReturnTo,
} from "@/lib/auth/contract";
import {
  createCampusLogProfile,
  isValidFullName,
  isValidNickname,
  normalizeProfileText,
} from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthIntent = "login" | "signup" | "oauth" | "callback";

type SupabaseAuthErrorShape = {
  status?: number;
};

function mapSupabaseAuthError(
  error: SupabaseAuthErrorShape | null | undefined,
  intent: AuthIntent,
): AuthErrorCode {
  if (error?.status === 429) {
    return "RATE_LIMITED";
  }

  if (typeof error?.status === "number" && error.status >= 500) {
    return "NETWORK_ERROR";
  }

  if (intent === "login") {
    return "INVALID_CREDENTIALS";
  }

  if (intent === "signup") {
    return "SIGNUP_FAILED";
  }

  if (intent === "oauth") {
    return "OAUTH_FAILED";
  }

  if (intent === "callback") {
    return "CALLBACK_FAILED";
  }

  return "UNKNOWN_ERROR";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return "http://localhost:3000";
  }

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}

function readAuthForm(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const returnTo = normalizeReturnTo(formData.get("returnTo"));

  return { email, password, returnTo };
}

function validateAuthForm(email: string, password: string): AuthFormState | null {
  if (!isValidEmail(email)) {
    return createAuthErrorState("INVALID_EMAIL", email);
  }

  if (!isValidPassword(password)) {
    return createAuthErrorState("INVALID_PASSWORD", email);
  }

  return null;
}

function createAuthCallbackUrl(
  origin: string,
  returnTo: string,
  requiresOnboarding = false,
) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("returnTo", normalizeReturnTo(returnTo));

  if (requiresOnboarding) {
    callbackUrl.searchParams.set("onboarding", "required");
  }

  return callbackUrl.toString();
}

function createLoginRedirectPath(
  returnTo: string,
  errorCode?: AuthErrorCode,
  noticeCode?: string,
) {
  const loginUrl = new URL("https://campuslog.local/login");
  const normalizedReturnTo = normalizeReturnTo(returnTo);

  if (normalizedReturnTo !== AUTH_DEFAULT_RETURN_TO) {
    loginUrl.searchParams.set("returnTo", normalizedReturnTo);
  }

  if (errorCode) {
    loginUrl.searchParams.set("authError", errorCode);
  }

  if (noticeCode) {
    loginUrl.searchParams.set("authNotice", noticeCode);
  }

  return `${loginUrl.pathname}${loginUrl.search}`;
}

export async function signInWithPasswordAction(
  previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  void previousState;

  const { email, password, returnTo } = readAuthForm(formData);
  const validationError = validateAuthForm(email, password);

  if (validationError) {
    return validationError;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createAuthErrorState("CONFIGURATION_MISSING", email);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return createAuthErrorState(mapSupabaseAuthError(error, "login"), email);
  }

  redirect(returnTo);
}

export async function signUpWithPasswordAction(
  previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  void previousState;

  const { email, password, returnTo } = readAuthForm(formData);
  const fullName = normalizeProfileText(formData.get("fullName"));
  const nickname = normalizeProfileText(formData.get("nickname"));
  const formValues = { email, fullName, nickname };
  const validationError = validateAuthForm(email, password);

  if (validationError) {
    return {
      ...validationError,
      fullName,
      nickname,
    };
  }

  if (!isValidFullName(fullName)) {
    return createAuthErrorState("INVALID_NAME", formValues);
  }

  if (!isValidNickname(nickname)) {
    return createAuthErrorState("INVALID_NICKNAME", formValues);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createAuthErrorState("CONFIGURATION_MISSING", formValues);
  }

  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        campuslog_profile: createCampusLogProfile(fullName, nickname),
      },
      emailRedirectTo: createAuthCallbackUrl(origin, returnTo, true),
    },
  });

  if (error) {
    return createAuthErrorState(
      mapSupabaseAuthError(error, "signup"),
      formValues,
    );
  }

  if (data.session) {
    redirect(returnTo);
  }

  return createAuthSuccessState("EMAIL_CONFIRMATION_REQUIRED", formValues);
}

export async function signInWithGoogleAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(createLoginRedirectPath(returnTo, "CONFIGURATION_MISSING"));
  }

  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: createAuthCallbackUrl(origin, returnTo),
    },
  });

  if (error || !data.url) {
    redirect(createLoginRedirectPath(returnTo, mapSupabaseAuthError(error, "oauth")));
  }

  redirect(data.url);
}

export async function signUpWithGoogleAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(createSignupPath(returnTo, "CONFIGURATION_MISSING"));
  }

  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: createAuthCallbackUrl(origin, returnTo, true),
    },
  });

  if (error || !data.url) {
    redirect(
      createSignupPath(returnTo, mapSupabaseAuthError(error, "oauth")),
    );
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/?authMode=login#auth");
}
