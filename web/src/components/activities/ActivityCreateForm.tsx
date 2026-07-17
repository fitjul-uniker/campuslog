"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, RefObject } from "react";
import { useId, useRef, useState } from "react";

import { getLocalDateKey } from "@/components/activities/activityViewUtils";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";

type ActivityFormValue = {
  title: string;
  description: string;
  startDate: string;
  expectedEndDate: string;
};

type ActivityFormError = {
  field: keyof ActivityFormValue | "form";
  message: string;
};

type ActivityCreateFormProps = {
  onCancel?: () => void;
  onSavingChange?: (isSaving: boolean) => void;
  titleInputRef?: RefObject<HTMLInputElement | null>;
  variant?: "page" | "expanded";
};

export function ActivityCreateForm({
  onCancel,
  onSavingChange,
  titleInputRef,
  variant = "page",
}: ActivityCreateFormProps) {
  const router = useRouter();
  const generatedId = useId().replaceAll(":", "");
  const internalTitleRef = useRef<HTMLInputElement>(null);
  const resolvedTitleRef = titleInputRef ?? internalTitleRef;
  const today = getLocalDateKey();
  const [formValue, setFormValue] = useState<ActivityFormValue>({
    title: "",
    description: "",
    startDate: today,
    expectedEndDate: "",
  });
  const [isEndDateUndecided, setIsEndDateUndecided] = useState(true);
  const [error, setError] = useState<ActivityFormError | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const titleId = `activity-title-${generatedId}`;
  const descriptionId = `activity-description-${generatedId}`;
  const startDateId = `activity-start-date-${generatedId}`;
  const expectedEndDateId = `activity-expected-end-date-${generatedId}`;
  const undecidedId = `activity-end-date-undecided-${generatedId}`;
  const errorId = `activity-form-error-${generatedId}`;

  function updateSaving(nextValue: boolean) {
    setIsSaving(nextValue);
    onSavingChange?.(nextValue);
  }

  function updateField<Field extends keyof ActivityFormValue>(
    field: Field,
    value: ActivityFormValue[Field],
  ) {
    setFormValue((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function updateEndDateUndecided(checked: boolean | "indeterminate") {
    const isUndecided = checked === true;
    setIsEndDateUndecided(isUndecided);
    setFormValue((current) => ({
      ...current,
      expectedEndDate: isUndecided
        ? ""
        : current.expectedEndDate || current.startDate,
    }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setError(null);

    const title = formValue.title.trim();
    const description = formValue.description.trim();

    if (!title) {
      setError({ field: "title", message: "활동 제목을 입력해 주세요." });
      resolvedTitleRef.current?.focus();
      return;
    }

    if (!description) {
      setError({
        field: "description",
        message: "활동 내용을 입력해 주세요.",
      });
      document.getElementById(descriptionId)?.focus();
      return;
    }

    if (!formValue.startDate) {
      setError({
        field: "startDate",
        message: "활동 시작일을 선택해 주세요.",
      });
      document.getElementById(startDateId)?.focus();
      return;
    }

    if (!isEndDateUndecided && !formValue.expectedEndDate) {
      setError({
        field: "expectedEndDate",
        message: "예상 종료일을 선택하거나 미정을 선택해 주세요.",
      });
      document.getElementById(expectedEndDateId)?.focus();
      return;
    }

    if (
      formValue.expectedEndDate &&
      formValue.expectedEndDate < formValue.startDate
    ) {
      setError({
        field: "expectedEndDate",
        message: "예상 종료일은 시작일보다 빠를 수 없습니다.",
      });
      document.getElementById(expectedEndDateId)?.focus();
      return;
    }

    updateSaving(true);
    const repository = getCampusLogRepository();

    try {
      const createdActivity = await repository.trackedActivities.create({
        title,
        description,
        startDate: formValue.startDate,
        expectedEndDate: formValue.expectedEndDate,
      });

      if (!createdActivity) {
        updateSaving(false);
        setError({
          field: "form",
          message: "활동을 저장하지 못했습니다. 입력 내용을 확인해 주세요.",
        });
        return;
      }

      router.push(`/activities/${createdActivity.id}`);
    } catch {
      updateSaving(false);
      setError({
        field: "form",
        message: "활동을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  return (
    <form
      className="activity-create-form"
      data-variant={variant}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSaving}
    >
      <label htmlFor={titleId}>
        <span>활동 제목</span>
        <input
          ref={resolvedTitleRef}
          id={titleId}
          type="text"
          value={formValue.title}
          onChange={(event) => updateField("title", event.target.value)}
          maxLength={120}
          autoComplete="off"
          placeholder="예: CampusLog MVP 프로젝트"
          disabled={isSaving}
          aria-invalid={error?.field === "title" || undefined}
          aria-describedby={error?.field === "title" ? errorId : undefined}
          required
        />
      </label>

      <label htmlFor={descriptionId}>
        <span>간단한 내용</span>
        <textarea
          id={descriptionId}
          value={formValue.description}
          onChange={(event) => updateField("description", event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="예: 대학생 활동 기록 서비스를 기획하고 개발합니다."
          disabled={isSaving}
          aria-invalid={error?.field === "description" || undefined}
          aria-describedby={
            error?.field === "description" ? errorId : undefined
          }
          required
        />
      </label>

      <div className="activity-date-fields">
        <label htmlFor={startDateId}>
          <span>시작일</span>
          <input
            id={startDateId}
            type="date"
            value={formValue.startDate}
            onChange={(event) => {
              const startDate = event.target.value;
              setFormValue((current) => ({
                ...current,
                startDate,
                expectedEndDate:
                  current.expectedEndDate && current.expectedEndDate < startDate
                    ? startDate
                    : current.expectedEndDate,
              }));
              setError(null);
            }}
            disabled={isSaving}
            aria-invalid={error?.field === "startDate" || undefined}
            aria-describedby={
              error?.field === "startDate" ? errorId : undefined
            }
            required
          />
        </label>

        <div className="activity-date-field">
          <div className="activity-date-field-heading">
            <label htmlFor={expectedEndDateId}>예상 종료일</label>
            <label
              className="activity-undecided-option"
              htmlFor={undecidedId}
            >
              <Checkbox
                id={undecidedId}
                checked={isEndDateUndecided}
                onCheckedChange={updateEndDateUndecided}
                size="sm"
                disabled={isSaving}
              />
              <span>미정</span>
            </label>
          </div>
          <input
            id={expectedEndDateId}
            type="date"
            min={formValue.startDate}
            value={formValue.expectedEndDate}
            onChange={(event) => {
              const expectedEndDate = event.target.value;
              updateField("expectedEndDate", expectedEndDate);

              if (!expectedEndDate) {
                setIsEndDateUndecided(true);
              }
            }}
            disabled={isEndDateUndecided || isSaving}
            aria-invalid={error?.field === "expectedEndDate" || undefined}
            aria-describedby={
              error?.field === "expectedEndDate" ? errorId : undefined
            }
          />
        </div>
      </div>

      {error ? (
        <p id={errorId} className="activity-form-error" role="alert">
          {error.message}
        </p>
      ) : null}

      <div className="activity-form-actions">
        {onCancel ? (
          <RippleButton
            type="button"
            className="activity-secondary-button"
            onClick={onCancel}
            disabled={isSaving}
          >
            취소
            <RippleButtonRipples />
          </RippleButton>
        ) : (
          <Link href="/dashboard" className="activity-secondary-button">
            취소
          </Link>
        )}
        <RippleButton
          type="submit"
          className="activity-primary-button"
          disabled={isSaving}
        >
          <Save aria-hidden="true" />
          {isSaving
            ? "저장 중…"
            : variant === "expanded"
              ? "저장"
              : "활동 저장"}
          <RippleButtonRipples />
        </RippleButton>
      </div>
    </form>
  );
}
