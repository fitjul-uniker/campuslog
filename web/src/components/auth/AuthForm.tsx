"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Chrome, Loader2, Lock, Mail } from "lucide-react";

import {
  type AuthFeedback,
  type AuthFormState,
  AUTH_MIN_PASSWORD_LENGTH,
  getAuthErrorFeedback,
  getAuthNoticeFeedback,
  initialAuthFormState,
} from "@/lib/auth/contract";
import {
  signInWithGoogleAction,
  signInWithPasswordAction,
  signUpWithPasswordAction,
} from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type AuthFormMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthFormMode;
  returnTo: string;
  authError?: string;
  authNotice?: string;
  isSupabaseConfigured: boolean;
};

const authCopy = {
  login: {
    eyebrow: "Welcome back",
    title: "로그인",
    description: "기록해둔 활동과 AI 추천을 이어서 확인합니다.",
    submitLabel: "로그인",
    pendingLabel: "로그인 중",
    switchText: "아직 계정이 없다면",
    switchHref: "/signup",
    switchLabel: "회원가입",
    passwordAutoComplete: "current-password",
  },
  signup: {
    eyebrow: "Start CampusLog",
    title: "회원가입",
    description: "계정 기반 기록 저장을 시작합니다.",
    submitLabel: "회원가입",
    pendingLabel: "가입 처리 중",
    switchText: "이미 계정이 있다면",
    switchHref: "/login",
    switchLabel: "로그인",
    passwordAutoComplete: "new-password",
  },
} as const;

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

function SubmitButton({
  disabled,
  label,
  pendingLabel,
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button className="button button-primary auth-submit" disabled={isDisabled}>
      {pending ? (
        <Loader2 className="button-icon auth-spinner" aria-hidden="true" />
      ) : (
        <ArrowRight className="button-icon" aria-hidden="true" />
      )}
      <span>{pending ? pendingLabel : label}</span>
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
        <Chrome className="button-icon" aria-hidden="true" />
      )}
      <span>{pending ? "Google 연결 중" : "Google로 계속하기"}</span>
    </button>
  );
}

export function AuthForm({
  mode,
  returnTo,
  authError,
  authNotice,
  isSupabaseConfigured,
}: AuthFormProps) {
  const copy = authCopy[mode];
  const action =
    mode === "login" ? signInWithPasswordAction : signUpWithPasswordAction;
  const [state, formAction] = useActionState(action, initialAuthFormState);
  const feedback = getVisibleFeedback(state, authError, authNotice);
  const shouldShowFeedback =
    feedback !== null &&
    !(feedback.code === "CONFIGURATION_MISSING" && !isSupabaseConfigured);
  const switchHref =
    returnTo === "/dashboard"
      ? copy.switchHref
      : `${copy.switchHref}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <section className="auth-panel" aria-labelledby={`${mode}-title`}>
      <div className="auth-panel-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id={`${mode}-title`}>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="auth-feedback is-error" role="alert">
          Supabase 환경 변수를 설정한 뒤 인증을 사용할 수 있습니다.
        </div>
      ) : null}

      {shouldShowFeedback ? (
        <div
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

        <label className="form-field auth-field">
          <span>이메일</span>
          <span className="auth-input-wrap">
            <Mail aria-hidden="true" />
            <input
              autoComplete="email"
              defaultValue={state.email ?? ""}
              disabled={!isSupabaseConfigured}
              inputMode="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </span>
        </label>

        <label className="form-field auth-field">
          <span>비밀번호</span>
          <span className="auth-input-wrap">
            <Lock aria-hidden="true" />
            <input
              autoComplete={copy.passwordAutoComplete}
              disabled={!isSupabaseConfigured}
              minLength={AUTH_MIN_PASSWORD_LENGTH}
              name="password"
              placeholder={`${AUTH_MIN_PASSWORD_LENGTH}자 이상`}
              required
              type="password"
            />
          </span>
        </label>

        <p className="auth-help">
          인증 오류는 계정 존재 여부를 노출하지 않는 공통 문구로 안내합니다.
        </p>

        <SubmitButton
          disabled={!isSupabaseConfigured}
          label={copy.submitLabel}
          pendingLabel={copy.pendingLabel}
        />
      </form>

      <div className="auth-divider" aria-hidden="true">
        <span>또는</span>
      </div>

      <form action={signInWithGoogleAction} className="auth-form">
        <input name="returnTo" type="hidden" value={returnTo} />
        <GoogleSubmitButton disabled={!isSupabaseConfigured} />
      </form>

      <p className="auth-switch">
        {copy.switchText}{" "}
        <Link href={switchHref} className="auth-switch-link">
          {copy.switchLabel}
        </Link>
      </p>
    </section>
  );
}
