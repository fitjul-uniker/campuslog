"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2 } from "lucide-react";

import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { SignupForm } from "@/components/auth/SignupForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AuthFeedback,
  type AuthErrorCode,
  type AuthFormState,
  AUTH_MIN_PASSWORD_LENGTH,
  AUTH_DEFAULT_RETURN_TO,
  getAuthErrorFeedback,
  getAuthNoticeFeedback,
  initialAuthFormState,
} from "@/lib/auth/contract";
import {
  signInWithGoogleAction,
  signInWithPasswordAction,
} from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type AuthFormMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
  returnTo: string;
  authError?: string;
  authNotice?: string;
  headingLevel?: "h1" | "h2" | "h3";
  isSupabaseConfigured: boolean;
  switchHref?: string;
};

const emailFieldErrorCodes: AuthErrorCode[] = [
  "INVALID_INPUT",
  "INVALID_EMAIL",
  "INVALID_CREDENTIALS",
];

const passwordFieldErrorCodes: AuthErrorCode[] = [
  "INVALID_INPUT",
  "INVALID_PASSWORD",
  "INVALID_CREDENTIALS",
];

function getVisibleFeedback(
  state: AuthFormState,
  authError?: string,
  authNotice?: string,
): AuthFeedback | null {
  if (state.status !== "idle") {
    return state;
  }

  return getAuthErrorFeedback(authError) ?? getAuthNoticeFeedback(authNotice);
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="button button-primary auth-submit"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? (
        <Loader2 className="button-icon auth-spinner" aria-hidden="true" />
      ) : (
        <ArrowRight className="button-icon" aria-hidden="true" />
      )}
      <span>{pending ? "로그인 중" : "로그인"}</span>
    </button>
  );
}

function GoogleSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="button button-secondary auth-google-button"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? (
        <Loader2 className="button-icon auth-spinner" aria-hidden="true" />
      ) : (
        <GoogleIcon />
      )}
      <span>{pending ? "Google 연결 중" : "Google로 계속하기"}</span>
    </button>
  );
}

function LoginForm({
  returnTo,
  authError,
  authNotice,
  headingLevel = "h1",
  isSupabaseConfigured,
  switchHref: switchHrefOverride,
}: Omit<AuthFormProps, "mode">) {
  const Heading = headingLevel;
  const [state, formAction] = useActionState(
    signInWithPasswordAction,
    initialAuthFormState,
  );
  const feedback = getVisibleFeedback(state, authError, authNotice);
  const shouldShowFeedback =
    feedback !== null &&
    !(feedback.code === "CONFIGURATION_MISSING" && !isSupabaseConfigured);
  const switchHref =
    switchHrefOverride ??
    (returnTo === AUTH_DEFAULT_RETURN_TO
      ? "/signup"
      : `/signup?returnTo=${encodeURIComponent(returnTo)}`);
  const feedbackId = "login-feedback";
  const fieldErrorCode =
    feedback?.status === "error" ? feedback.code : undefined;
  const hasEmailError =
    fieldErrorCode !== undefined && emailFieldErrorCodes.includes(fieldErrorCode);
  const hasPasswordError =
    fieldErrorCode !== undefined &&
    passwordFieldErrorCodes.includes(fieldErrorCode);

  return (
    <section className="auth-panel" aria-labelledby="login-title">
      <div className="auth-panel-header">
        <Heading id="login-title" tabIndex={-1}>
          로그인
        </Heading>
      </div>

      {!isSupabaseConfigured ? (
        <div className="auth-feedback is-error" role="alert">
          Supabase 환경 변수를 설정한 뒤 인증을 사용할 수 있습니다.
        </div>
      ) : null}

      {shouldShowFeedback ? (
        <div
          id={feedbackId}
          className={cn(
            "auth-feedback",
            feedback.status === "error" ? "is-error" : "is-success",
          )}
          role={feedback.status === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      ) : null}

      <form action={formAction} className="auth-form">
        <input name="returnTo" type="hidden" value={returnTo} />

        <div className="auth-field">
          <Label htmlFor="login-email">이메일</Label>
          <Input
            id="login-email"
            aria-describedby={shouldShowFeedback ? feedbackId : undefined}
            aria-invalid={hasEmailError || undefined}
            autoComplete="email"
            className="auth-control"
            defaultValue={state.email ?? ""}
            disabled={!isSupabaseConfigured}
            inputMode="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div className="auth-field">
          <Label htmlFor="login-password">비밀번호</Label>
          <Input
            id="login-password"
            aria-describedby={shouldShowFeedback ? feedbackId : undefined}
            aria-invalid={hasPasswordError || undefined}
            autoComplete="current-password"
            className="auth-control"
            disabled={!isSupabaseConfigured}
            minLength={AUTH_MIN_PASSWORD_LENGTH}
            name="password"
            placeholder={`${AUTH_MIN_PASSWORD_LENGTH}자 이상`}
            required
            type="password"
          />
        </div>

        <SubmitButton disabled={!isSupabaseConfigured} />
      </form>

      <div className="auth-divider" aria-hidden="true">
        <span>또는</span>
      </div>

      <form action={signInWithGoogleAction} className="auth-form">
        <input name="returnTo" type="hidden" value={returnTo} />
        <GoogleSubmitButton disabled={!isSupabaseConfigured} />
      </form>

      <p className="auth-switch">
        <span>아직 계정이 없다면</span>
        <Link href={switchHref} className="auth-switch-link">
          회원가입
        </Link>
      </p>
    </section>
  );
}

export function AuthForm({
  mode,
  returnTo,
  authError,
  authNotice,
  headingLevel = "h1",
  isSupabaseConfigured,
  switchHref,
}: AuthFormProps) {
  if (mode === "signup") {
    return (
      <SignupForm
        authError={authError}
        authNotice={authNotice}
        headingLevel={headingLevel}
        isSupabaseConfigured={isSupabaseConfigured}
        returnTo={returnTo}
        switchHref={switchHref}
      />
    );
  }

  return (
    <LoginForm
      authError={authError}
      authNotice={authNotice}
      headingLevel={headingLevel}
      isSupabaseConfigured={isSupabaseConfigured}
      returnTo={returnTo}
      switchHref={switchHref}
    />
  );
}
