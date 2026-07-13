"use client";

import Link from "next/link";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";

import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { ProfileStepperFields } from "@/components/auth/ProfileStepperFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AUTH_DEFAULT_RETURN_TO,
  AUTH_ERROR_MESSAGES,
  AUTH_MIN_PASSWORD_LENGTH,
  type AuthFeedback,
  type AuthFormState,
  getAuthErrorFeedback,
  getAuthNoticeFeedback,
  initialAuthFormState,
  isValidEmail,
  isValidPassword,
} from "@/lib/auth/contract";
import {
  signUpWithGoogleAction,
  signUpWithPasswordAction,
} from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type SignupStage = "method" | "credentials" | "profile";

type SignupFormProps = {
  returnTo: string;
  authError?: string;
  authNotice?: string;
  headingLevel: "h1" | "h2" | "h3";
  isSupabaseConfigured: boolean;
  switchHref?: string;
};

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

function GoogleSignupButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="button button-secondary auth-google-button auth-method-button"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? (
        <Loader2 className="button-icon auth-spinner" aria-hidden="true" />
      ) : (
        <GoogleIcon />
      )}
      <span>{pending ? "Google 연결 중" : "Google로 회원가입"}</span>
      {!pending ? <ArrowRight className="auth-method-arrow" aria-hidden="true" /> : null}
    </button>
  );
}

export function SignupForm({
  returnTo,
  authError,
  authNotice,
  headingLevel,
  isSupabaseConfigured,
  switchHref: switchHrefOverride,
}: SignupFormProps) {
  const Heading = headingLevel;
  const [stage, setStage] = useState<SignupStage>("method");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasClientEmailError, setHasClientEmailError] = useState(false);
  const [hasClientPasswordError, setHasClientPasswordError] = useState(false);
  const [state, formAction, isPending] = useActionState(
    signUpWithPasswordAction,
    initialAuthFormState,
  );
  const signupFormRef = useRef<HTMLFormElement>(null);
  const feedback = getVisibleFeedback(state, authError, authNotice);
  const shouldShowFeedback =
    feedback !== null &&
    !(feedback.code === "CONFIGURATION_MISSING" && !isSupabaseConfigured);
  const feedbackId = "signup-feedback";
  const emailErrorId = "signup-email-error";
  const passwordHelpId = "signup-password-help";
  const passwordErrorId = "signup-password-error";
  const serverErrorCode =
    state.status === "error" ? state.code : undefined;
  const hasEmailError =
    hasClientEmailError || serverErrorCode === "INVALID_EMAIL";
  const hasPasswordError =
    hasClientPasswordError || serverErrorCode === "INVALID_PASSWORD";
  const switchHref =
    switchHrefOverride ??
    (returnTo === AUTH_DEFAULT_RETURN_TO
      ? "/login"
      : `/login?returnTo=${encodeURIComponent(returnTo)}`);

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }

    setPassword("");

    if (state.status === "success") {
      return;
    }

    setStage("credentials");
    const fieldId =
      state.code === "INVALID_EMAIL" ? "signup-email" : "signup-password";
    const frame = requestAnimationFrame(() =>
      document.getElementById(fieldId)?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [state]);

  function openCredentialsStage() {
    setStage("credentials");
    requestAnimationFrame(() =>
      document.getElementById("signup-email")?.focus(),
    );
  }

  function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setHasClientEmailError(true);
      requestAnimationFrame(() =>
        document.getElementById("signup-email")?.focus(),
      );
      return;
    }

    setHasClientEmailError(false);

    if (!isValidPassword(password)) {
      setHasClientPasswordError(true);
      requestAnimationFrame(() =>
        document.getElementById("signup-password")?.focus(),
      );
      return;
    }

    setHasClientPasswordError(false);
    setStage("profile");
  }

  function returnToMethodStage() {
    setHasClientEmailError(false);
    setHasClientPasswordError(false);
    setPassword("");
    setStage("method");
    requestAnimationFrame(() =>
      document.getElementById("signup-email-method")?.focus(),
    );
  }

  function returnToCredentialsStage() {
    setStage("credentials");
    requestAnimationFrame(() =>
      document.getElementById("signup-email")?.focus(),
    );
  }

  function submitSignupProfile() {
    const form = signupFormRef.current;

    if (!form || isPending) {
      return;
    }

    const formData = new FormData(form);
    formData.set("email", email);
    formData.set("password", password);

    startTransition(() => formAction(formData));
  }

  return (
    <section className="auth-panel auth-signup-panel" aria-labelledby="signup-title">
      <div className="auth-panel-header">
        <Heading id="signup-title" tabIndex={-1}>
          회원가입
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

      {state.status === "success" ? (
        <div className="auth-complete-copy">
          <p>메일함에서 인증을 마치면 CampusLog로 이어집니다.</p>
        </div>
      ) : stage === "method" ? (
        <div className="auth-stage">
          <div className="auth-stage-heading">
            <h3>가입 방법을 선택해 주세요</h3>
            <p>이메일 또는 Google 계정으로 시작할 수 있어요.</p>
          </div>

          <div className="auth-method-list">
            <button
              id="signup-email-method"
              className="button button-primary auth-submit auth-method-button"
              disabled={!isSupabaseConfigured}
              onClick={openCredentialsStage}
              type="button"
            >
              <Mail className="button-icon" aria-hidden="true" />
              <span>이메일로 회원가입</span>
              <ArrowRight className="auth-method-arrow" aria-hidden="true" />
            </button>

            <form action={signUpWithGoogleAction} className="auth-form">
              <input name="returnTo" type="hidden" value={returnTo} />
              <GoogleSignupButton disabled={!isSupabaseConfigured} />
            </form>
          </div>
        </div>
      ) : stage === "credentials" ? (
        <div className="auth-stage">
          <button
            className="auth-back-link"
            onClick={returnToMethodStage}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
            가입 방법
          </button>

          <div className="auth-stage-heading">
            <h3>이메일로 시작하기</h3>
            <p>로그인에 사용할 이메일과 비밀번호를 입력해 주세요.</p>
          </div>

          <form
            className="auth-form"
            noValidate
            onSubmit={handleCredentialsSubmit}
          >
            <div className="auth-field">
              <Label htmlFor="signup-email">이메일</Label>
              <Input
                id="signup-email"
                aria-describedby={joinIds(
                  hasEmailError && emailErrorId,
                  shouldShowFeedback && feedbackId,
                )}
                aria-invalid={hasEmailError || undefined}
                autoComplete="email"
                className="auth-control"
                disabled={!isSupabaseConfigured}
                inputMode="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setHasClientEmailError(false);
                }}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
              {hasEmailError ? (
                <p id={emailErrorId} className="auth-field-error">
                  {AUTH_ERROR_MESSAGES.INVALID_EMAIL}
                </p>
              ) : null}
            </div>

            <div className="auth-field">
              <Label htmlFor="signup-password">비밀번호</Label>
              <Input
                id="signup-password"
                aria-describedby={joinIds(
                  passwordHelpId,
                  hasPasswordError && passwordErrorId,
                  shouldShowFeedback && feedbackId,
                )}
                aria-invalid={hasPasswordError || undefined}
                autoComplete="new-password"
                className="auth-control"
                disabled={!isSupabaseConfigured}
                minLength={AUTH_MIN_PASSWORD_LENGTH}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setHasClientPasswordError(false);
                }}
                placeholder={`${AUTH_MIN_PASSWORD_LENGTH}자 이상`}
                required
                type="password"
                value={password}
              />
              <p id={passwordHelpId} className="auth-help">
                비밀번호는 {AUTH_MIN_PASSWORD_LENGTH}자 이상 입력해 주세요.
              </p>
              {hasPasswordError ? (
                <p id={passwordErrorId} className="auth-field-error">
                  {AUTH_ERROR_MESSAGES.INVALID_PASSWORD}
                </p>
              ) : null}
            </div>

            <button
              className="button button-primary auth-submit"
              disabled={!isSupabaseConfigured}
              type="submit"
            >
              <span>계속</span>
              <ArrowRight className="button-icon" aria-hidden="true" />
            </button>
          </form>
        </div>
      ) : (
        <div className="auth-stage">
          <button
            className="auth-back-link"
            disabled={isPending}
            onClick={returnToCredentialsStage}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
            이메일 정보
          </button>

          <form
            className="auth-form"
            onSubmit={(event) => event.preventDefault()}
            ref={signupFormRef}
          >
            <input name="returnTo" type="hidden" value={returnTo} />
            <ProfileStepperFields
              completeButtonText="회원가입 완료"
              feedbackId={shouldShowFeedback ? feedbackId : undefined}
              initialFullName={state.fullName}
              initialNickname={state.nickname}
              isPending={isPending}
              onComplete={submitSignupProfile}
              pendingButtonText="가입 처리 중"
              serverErrorCode={serverErrorCode}
            />
          </form>
        </div>
      )}

      <p className="auth-switch">
        <span>이미 계정이 있다면</span>
        <Link href={switchHref} className="auth-switch-link">
          로그인
        </Link>
      </p>
    </section>
  );
}

function joinIds(...ids: Array<string | undefined | false>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}
