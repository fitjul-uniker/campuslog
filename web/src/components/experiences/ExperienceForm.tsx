"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type { Experience, ExperienceFormInput } from "@/lib/types";

type ExperienceFormMode = "create" | "edit";

type ExperienceFormProps = {
  mode: ExperienceFormMode;
  initialValue?: Experience;
  cancelHref: string;
  onSubmit: (input: ExperienceFormInput) => void;
};

type PeriodFields = {
  startMonth: string;
  endMonth: string;
  isOngoing: boolean;
};

const EMPTY_FORM: ExperienceFormInput = {
  title: "",
  period: "",
  role: "",
  description: "",
  achievements: "",
  relatedLinksText: "",
};

const EMPTY_PERIOD_FIELDS: PeriodFields = {
  startMonth: "",
  endMonth: "",
  isOngoing: false,
};

function normalizeMonthValue(value: string): string {
  const match = value.trim().match(/^(\d{4})[.-](\d{1,2})$/);

  if (!match) {
    return "";
  }

  return `${match[1]}-${match[2].padStart(2, "0")}`;
}

function parsePeriodFields(period: string): PeriodFields {
  const isOngoing = /현재|present|ongoing/i.test(period);
  const monthValues = period.match(/\d{4}[.-]\d{1,2}/g) ?? [];
  const [firstMonthValue, secondMonthValue] = monthValues;

  if (!firstMonthValue) {
    return {
      ...EMPTY_PERIOD_FIELDS,
      isOngoing,
    };
  }

  const startMonth = normalizeMonthValue(firstMonthValue);
  const endMonth = isOngoing
    ? ""
    : normalizeMonthValue(secondMonthValue ?? firstMonthValue);

  return {
    startMonth,
    endMonth,
    isOngoing,
  };
}

function formatMonthForStorage(month: string): string {
  return month.replace("-", ".");
}

function createPeriodValue(periodFields: PeriodFields): string {
  const { startMonth, endMonth, isOngoing } = periodFields;

  if (!startMonth) {
    return "";
  }

  if (isOngoing) {
    return `${formatMonthForStorage(startMonth)} ~ 현재`;
  }

  if (!endMonth) {
    return "";
  }

  if (startMonth === endMonth) {
    return formatMonthForStorage(startMonth);
  }

  return `${formatMonthForStorage(startMonth)} - ${formatMonthForStorage(
    endMonth,
  )}`;
}

function getPeriodErrorMessage(periodFields: PeriodFields): string {
  const { startMonth, endMonth, isOngoing } = periodFields;

  if (!startMonth) {
    return "활동기간의 시작월을 선택해주세요.";
  }

  if (isOngoing) {
    return "";
  }

  if (!endMonth) {
    return "종료월을 선택하거나 현재 진행 중을 체크해주세요.";
  }

  if (startMonth > endMonth) {
    return "종료월은 시작월보다 빠를 수 없습니다.";
  }

  return "";
}

function createFormValue(initialValue?: Experience): ExperienceFormInput {
  if (!initialValue) {
    return EMPTY_FORM;
  }

  return {
    title: initialValue.title,
    period: initialValue.period,
    role: initialValue.role,
    description: initialValue.description,
    achievements: initialValue.achievements,
    relatedLinksText: initialValue.relatedLinks.join("\n"),
  };
}

function hasRequiredFields(formValue: ExperienceFormInput): boolean {
  return Boolean(
    formValue.title.trim() &&
      formValue.period.trim() &&
      formValue.role.trim() &&
      formValue.description.trim(),
  );
}

export function ExperienceForm({
  mode,
  initialValue,
  cancelHref,
  onSubmit,
}: ExperienceFormProps) {
  const [formValue, setFormValue] = useState<ExperienceFormInput>(() =>
    createFormValue(initialValue),
  );
  const [periodFields, setPeriodFields] = useState<PeriodFields>(() =>
    parsePeriodFields(initialValue?.period ?? ""),
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setFormValue(createFormValue(initialValue));
    setPeriodFields(parsePeriodFields(initialValue?.period ?? ""));
  }, [initialValue]);

  function updateField(field: keyof ExperienceFormInput, value: string) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  const periodErrorMessage = getPeriodErrorMessage(periodFields);
  const hasPeriodError = Boolean(errorMessage && periodErrorMessage);

  function updatePeriodField(field: "startMonth" | "endMonth", value: string) {
    const nextPeriodFields = {
      ...periodFields,
      [field]: value,
    };

    setPeriodFields(nextPeriodFields);
    setFormValue((currentValue) => ({
      ...currentValue,
      period: createPeriodValue(nextPeriodFields),
    }));
  }

  function updatePeriodOngoing(isOngoing: boolean) {
    const nextPeriodFields = {
      ...periodFields,
      endMonth: isOngoing ? "" : periodFields.endMonth,
      isOngoing,
    };

    setPeriodFields(nextPeriodFields);
    setFormValue((currentValue) => ({
      ...currentValue,
      period: createPeriodValue(nextPeriodFields),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextPeriodErrorMessage = getPeriodErrorMessage(periodFields);

    if (nextPeriodErrorMessage) {
      setErrorMessage(nextPeriodErrorMessage);
      return;
    }

    const normalizedFormValue = {
      ...formValue,
      period: createPeriodValue(periodFields),
    };

    if (!hasRequiredFields(normalizedFormValue)) {
      setErrorMessage("제목, 기간, 역할, 내용은 반드시 입력해야 합니다.");
      return;
    }

    setErrorMessage("");
    onSubmit(normalizedFormValue);
  }

  return (
    <form className="experience-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="experience-title">제목</label>
        <input
          id="experience-title"
          name="title"
          type="text"
          value={formValue.title}
          onChange={(event) => updateField("title", event.target.value)}
          aria-invalid={Boolean(errorMessage && !formValue.title.trim())}
          required
        />
      </div>

      <fieldset className="period-fieldset">
        <legend>활동기간</legend>
        <div className="field-grid">
          <div className="form-field">
            <label htmlFor="experience-period-start">시작월</label>
            <input
              id="experience-period-start"
              name="periodStart"
              type="month"
              value={periodFields.startMonth}
              onChange={(event) =>
                updatePeriodField("startMonth", event.target.value)
              }
              aria-invalid={hasPeriodError}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="experience-period-end">종료월</label>
            <input
              id="experience-period-end"
              name="periodEnd"
              type="month"
              value={periodFields.endMonth}
              min={periodFields.startMonth || undefined}
              disabled={periodFields.isOngoing}
              onChange={(event) =>
                updatePeriodField("endMonth", event.target.value)
              }
              aria-invalid={hasPeriodError && !periodFields.isOngoing}
              required={!periodFields.isOngoing}
            />
          </div>
        </div>
        <label
          className="checkbox-field"
          htmlFor="experience-period-ongoing"
        >
          <input
            id="experience-period-ongoing"
            name="periodOngoing"
            type="checkbox"
            checked={periodFields.isOngoing}
            onChange={(event) => updatePeriodOngoing(event.target.checked)}
          />
          <span>현재 진행 중</span>
        </label>
        <p className="period-help">예: 2026.03 - 2026.07 또는 2025.01 ~ 현재</p>
      </fieldset>

      <div className="form-field">
        <label htmlFor="experience-role">역할</label>
        <input
          id="experience-role"
          name="role"
          type="text"
          value={formValue.role}
          onChange={(event) => updateField("role", event.target.value)}
          aria-invalid={Boolean(errorMessage && !formValue.role.trim())}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="experience-description">내용</label>
        <textarea
          id="experience-description"
          name="description"
          rows={8}
          value={formValue.description}
          onChange={(event) => updateField("description", event.target.value)}
          aria-invalid={Boolean(errorMessage && !formValue.description.trim())}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="experience-achievements">성과</label>
        <textarea
          id="experience-achievements"
          name="achievements"
          rows={5}
          value={formValue.achievements}
          onChange={(event) => updateField("achievements", event.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="experience-links">관련 링크</label>
        <textarea
          id="experience-links"
          name="relatedLinksText"
          rows={4}
          value={formValue.relatedLinksText}
          onChange={(event) => updateField("relatedLinksText", event.target.value)}
        />
      </div>

      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="panel-actions">
        <button className="button button-primary" type="submit">
          <Save className="button-icon" aria-hidden="true" />
          {mode === "create" ? "저장" : "수정 완료"}
        </button>
        <Link href={cancelHref} className="button button-secondary">
          취소
        </Link>
      </div>
    </form>
  );
}
