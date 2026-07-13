"use client";

import { type KeyboardEvent, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Stepper, { Step } from "@/components/ui/stepper";
import {
  AUTH_ERROR_MESSAGES,
  type AuthErrorCode,
} from "@/lib/auth/contract";
import {
  AUTH_FULL_NAME_MAX_LENGTH,
  AUTH_NICKNAME_MAX_LENGTH,
  isValidFullName,
  isValidNickname,
} from "@/lib/auth/profile";

type ProfileStepperFieldsProps = {
  initialFullName?: string;
  initialNickname?: string;
  serverErrorCode?: AuthErrorCode;
  feedbackId?: string;
  isPending: boolean;
  completeButtonText: string;
  pendingButtonText: string;
  onComplete: () => void;
};

function joinIds(...ids: Array<string | undefined | false>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export function ProfileStepperFields({
  initialFullName = "",
  initialNickname = "",
  serverErrorCode,
  feedbackId,
  isPending,
  completeButtonText,
  pendingButtonText,
  onComplete,
}: ProfileStepperFieldsProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState(initialFullName);
  const [nickname, setNickname] = useState(initialNickname);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const nameHelpId = "signup-name-help";
  const nameErrorId = "signup-name-error";
  const nicknameHelpId = "signup-nickname-help";
  const nicknameErrorId = "signup-nickname-error";
  const hasServerNameError = serverErrorCode === "INVALID_NAME";
  const hasServerNicknameError = serverErrorCode === "INVALID_NICKNAME";

  useEffect(() => {
    if (hasServerNameError) {
      setCurrentStep(1);
    } else if (hasServerNicknameError) {
      setCurrentStep(2);
    }
  }, [hasServerNameError, hasServerNicknameError]);

  function validateProfileStep(step: number) {
    if (step === 1) {
      if (!isValidFullName(fullName)) {
        setNameError(AUTH_ERROR_MESSAGES.INVALID_NAME);
        requestAnimationFrame(() =>
          document.getElementById("signup-full-name")?.focus(),
        );
        return false;
      }

      setNameError(null);
      return true;
    }

    if (!isValidNickname(nickname)) {
      setNicknameError(AUTH_ERROR_MESSAGES.INVALID_NICKNAME);
      requestAnimationFrame(() =>
        document.getElementById("signup-nickname")?.focus(),
      );
      return false;
    }

    setNicknameError(null);
    return true;
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (!validateProfileStep(currentStep)) {
      return;
    }

    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      onComplete();
    }
  }

  return (
    <>
      <input name="fullName" type="hidden" value={fullName} />
      <input name="nickname" type="hidden" value={nickname} />

      <Stepper
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onFinalStepCompleted={onComplete}
        validateStep={validateProfileStep}
        completeButtonText={completeButtonText}
        pendingButtonText={pendingButtonText}
        isPending={isPending}
      >
        <Step label="이름 입력">
          <div className="auth-step-heading">
            <p className="auth-step-count">1 / 2</p>
            <h3>이름을 알려주세요</h3>
            <p>계정 식별과 CampusLog 경험 개인화에만 사용합니다.</p>
          </div>

          <div className="auth-field">
            <Label htmlFor="signup-full-name">이름</Label>
            <Input
              id="signup-full-name"
              aria-describedby={joinIds(
                nameHelpId,
                (nameError || hasServerNameError) && nameErrorId,
                feedbackId,
              )}
              aria-invalid={Boolean(nameError || hasServerNameError) || undefined}
              autoComplete="name"
              autoFocus
              className="auth-control"
              disabled={isPending}
              maxLength={AUTH_FULL_NAME_MAX_LENGTH}
              onChange={(event) => {
                setFullName(event.target.value);
                setNameError(null);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="홍길동"
              required
              type="text"
              value={fullName}
            />
            <p id={nameHelpId} className="auth-help">
              {AUTH_FULL_NAME_MAX_LENGTH}자 이하로 입력해 주세요.
            </p>
            {nameError || hasServerNameError ? (
              <p id={nameErrorId} className="auth-field-error">
                {nameError ?? AUTH_ERROR_MESSAGES.INVALID_NAME}
              </p>
            ) : null}
          </div>
        </Step>

        <Step label="닉네임 입력">
          <div className="auth-step-heading">
            <p className="auth-step-count">2 / 2</p>
            <h3>어떻게 불러드릴까요?</h3>
            <p>CampusLog 안에서 사용할 닉네임을 입력해 주세요.</p>
          </div>

          <div className="auth-field">
            <Label htmlFor="signup-nickname">닉네임</Label>
            <Input
              id="signup-nickname"
              aria-describedby={joinIds(
                nicknameHelpId,
                (nicknameError || hasServerNicknameError) && nicknameErrorId,
                feedbackId,
              )}
              aria-invalid={
                Boolean(nicknameError || hasServerNicknameError) || undefined
              }
              autoComplete="nickname"
              autoFocus
              className="auth-control"
              disabled={isPending}
              maxLength={AUTH_NICKNAME_MAX_LENGTH}
              onChange={(event) => {
                setNickname(event.target.value);
                setNicknameError(null);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="캠퍼스러"
              required
              type="text"
              value={nickname}
            />
            <p id={nicknameHelpId} className="auth-help">
              공개 프로필에는 사용하지 않으며, {AUTH_NICKNAME_MAX_LENGTH}자
              이하로 입력할 수 있어요.
            </p>
            {nicknameError || hasServerNicknameError ? (
              <p id={nicknameErrorId} className="auth-field-error">
                {nicknameError ?? AUTH_ERROR_MESSAGES.INVALID_NICKNAME}
              </p>
            ) : null}
          </div>
        </Step>
      </Stepper>
    </>
  );
}
