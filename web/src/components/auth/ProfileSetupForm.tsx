"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";

import { ProfileStepperFields } from "@/components/auth/ProfileStepperFields";
import {
  type AuthErrorCode,
  createLoginPath,
  initialAuthFormState,
} from "@/lib/auth/contract";
import { completeSignupProfileAction } from "@/lib/auth/profile-actions";

type ProfileSetupFormProps = {
  returnTo: string;
  initialFullName: string;
  initialNickname: string;
};

export function ProfileSetupForm({
  returnTo,
  initialFullName,
  initialNickname,
}: ProfileSetupFormProps) {
  const [state, formAction, isPending] = useActionState(
    completeSignupProfileAction,
    initialAuthFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackId = "onboarding-feedback";
  const serverErrorCode: AuthErrorCode | undefined =
    state.status === "error" ? state.code : undefined;

  return (
    <section className="auth-panel auth-signup-panel" aria-labelledby="onboarding-title">
      <div className="auth-panel-header">
        <h1 id="onboarding-title" tabIndex={-1}>
          회원가입
        </h1>
      </div>

      {state.status === "error" ? (
        <>
          <div id={feedbackId} className="auth-feedback is-error" role="alert">
            {state.message}
          </div>
          {state.code === "SESSION_REQUIRED" ? (
            <Link
              className="button button-secondary auth-submit"
              href={createLoginPath(returnTo, "SESSION_REQUIRED")}
            >
              다시 로그인
            </Link>
          ) : null}
        </>
      ) : null}

      <form action={formAction} className="auth-form" ref={formRef}>
        <input name="returnTo" type="hidden" value={returnTo} />
        <ProfileStepperFields
          completeButtonText="프로필 저장"
          feedbackId={state.status === "error" ? feedbackId : undefined}
          initialFullName={state.fullName ?? initialFullName}
          initialNickname={state.nickname ?? initialNickname}
          isPending={isPending}
          onComplete={() => formRef.current?.requestSubmit()}
          pendingButtonText="저장 중"
          serverErrorCode={serverErrorCode}
        />
      </form>
    </section>
  );
}
