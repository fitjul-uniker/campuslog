"use client";

import Link from "next/link";
import { Plus, Save, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { RelatedLinkFavicon } from "@/components/common/RelatedLinkFavicon";
import { ExperienceAttachmentPicker } from "@/components/experiences/ExperienceAttachmentPicker";
import {
  MAX_RELATED_LINK_DESCRIPTION_LENGTH,
  MAX_RELATED_LINKS,
  MAX_RELATED_LINK_URL_LENGTH,
  normalizeRelatedLinkUrl,
} from "@/lib/relatedLinks";
import type {
  Experience,
  ExperienceFormInput,
  RelatedLink,
} from "@/lib/types";

type ExperienceFormMode = "create" | "edit";

type ExperienceFormProps = {
  mode: ExperienceFormMode;
  initialValue?: Experience;
  cancelHref: string;
  attachmentCount?: number;
  attachmentsEnabled?: boolean;
  onSubmit: (
    input: ExperienceFormInput,
    attachmentFiles: File[],
  ) => void | Promise<void>;
};

type PeriodFields = {
  startMonth: string;
  endMonth: string;
  isOngoing: boolean;
};

type RelatedLinkRow = RelatedLink & {
  clientId: string;
  previewUrl: string;
  legacyUrl: string;
};

type RelatedLinkValidation = {
  links: RelatedLink[];
  errors: Record<string, string>;
  firstErrorId: string;
};

type TextFormField = Exclude<keyof ExperienceFormInput, "relatedLinks">;

const RELATED_LINK_ERROR_MESSAGE = "관련 링크 입력을 확인해주세요.";

const EMPTY_FORM: ExperienceFormInput = {
  title: "",
  period: "",
  role: "",
  description: "",
  achievements: "",
  relatedLinks: [],
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
    relatedLinks: initialValue.relatedLinks.map((link) => ({ ...link })),
  };
}

function createRelatedLinkRows(initialValue?: Experience): RelatedLinkRow[] {
  const relatedLinks = initialValue?.relatedLinks ?? [];

  if (relatedLinks.length === 0) {
    return [
      {
        clientId: "empty-0",
        url: "",
        description: "",
        previewUrl: "",
        legacyUrl: "",
      },
    ];
  }

  return relatedLinks.map((link, index) => ({
    clientId: `existing-${index}`,
    url: link.url,
    description: link.description,
    previewUrl: link.url,
    legacyUrl: normalizeRelatedLinkUrl(link.url) ? "" : link.url,
  }));
}

function validateRelatedLinks(rows: RelatedLinkRow[]): RelatedLinkValidation {
  const links: RelatedLink[] = [];
  const errors: Record<string, string> = {};
  const seenUrls = new Set<string>();
  let firstErrorId = "";

  rows.forEach((row) => {
    const url = row.url.trim();
    const description = row.description.trim();

    if (!url && !description) {
      return;
    }

    if (!url) {
      errors[row.clientId] = "설명에 해당하는 URL을 입력해주세요.";
      firstErrorId ||= row.clientId;
      return;
    }

    const normalizedUrl = normalizeRelatedLinkUrl(url);

    if (!normalizedUrl) {
      if (row.legacyUrl && url === row.legacyUrl.trim()) {
        links.push({
          url,
          description,
        });
        return;
      }

      errors[row.clientId] = "http 또는 https로 연결되는 올바른 URL을 입력해주세요.";
      firstErrorId ||= row.clientId;
      return;
    }

    if (seenUrls.has(normalizedUrl)) {
      errors[row.clientId] = "이미 추가한 링크입니다.";
      firstErrorId ||= row.clientId;
      return;
    }

    seenUrls.add(normalizedUrl);
    links.push({
      url: normalizedUrl,
      description,
    });
  });

  return {
    links,
    errors,
    firstErrorId,
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
  attachmentCount = 0,
  attachmentsEnabled = true,
  onSubmit,
}: ExperienceFormProps) {
  const [formValue, setFormValue] = useState<ExperienceFormInput>(() =>
    createFormValue(initialValue),
  );
  const [periodFields, setPeriodFields] = useState<PeriodFields>(() =>
    parsePeriodFields(initialValue?.period ?? ""),
  );
  const [relatedLinkRows, setRelatedLinkRows] = useState<RelatedLinkRow[]>(() =>
    createRelatedLinkRows(initialValue),
  );
  const [relatedLinkErrors, setRelatedLinkErrors] = useState<
    Record<string, string>
  >({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const nextRelatedLinkId = useRef(initialValue?.relatedLinks.length ?? 0);
  const relatedLinkInputRefs = useRef(new Map<string, HTMLInputElement>());
  const addRelatedLinkButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setFormValue(createFormValue(initialValue));
    setPeriodFields(parsePeriodFields(initialValue?.period ?? ""));
    setRelatedLinkRows(createRelatedLinkRows(initialValue));
    setRelatedLinkErrors({});
    setErrorMessage("");
    setIsSubmitting(false);
    setAttachmentFiles([]);
    nextRelatedLinkId.current = initialValue?.relatedLinks.length ?? 0;
  }, [initialValue]);

  function updateField(field: TextFormField, value: string) {
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

  function updateRelatedLink(
    clientId: string,
    field: "url" | "description",
    value: string,
  ) {
    setRelatedLinkRows((currentRows) =>
      currentRows.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              [field]: value,
              ...(field === "url"
                ? { previewUrl: "", legacyUrl: "" }
                : {}),
            }
          : row,
      ),
    );
    setRelatedLinkErrors((currentErrors) => {
      if (!currentErrors[clientId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[clientId];
      return nextErrors;
    });

    if (
      relatedLinkErrors[clientId] &&
      Object.keys(relatedLinkErrors).every((errorId) => errorId === clientId)
    ) {
      setErrorMessage((currentMessage) =>
        currentMessage === RELATED_LINK_ERROR_MESSAGE ? "" : currentMessage,
      );
    }
  }

  function updateRelatedLinkPreview(clientId: string) {
    setRelatedLinkRows((currentRows) =>
      currentRows.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              previewUrl: normalizeRelatedLinkUrl(row.url) ?? "",
            }
          : row,
      ),
    );
  }

  function addRelatedLink() {
    if (relatedLinkRows.length >= MAX_RELATED_LINKS) {
      return;
    }

    const clientId = `new-${nextRelatedLinkId.current}`;
    nextRelatedLinkId.current += 1;
    setRelatedLinkRows((currentRows) => [
      ...currentRows,
      {
        clientId,
        url: "",
        description: "",
        previewUrl: "",
        legacyUrl: "",
      },
    ]);
    window.requestAnimationFrame(() => {
      relatedLinkInputRefs.current.get(clientId)?.focus();
    });
  }

  function removeRelatedLink(clientId: string) {
    const removedIndex = relatedLinkRows.findIndex(
      (row) => row.clientId === clientId,
    );
    const nextFocusId =
      relatedLinkRows[removedIndex + 1]?.clientId ??
      relatedLinkRows[removedIndex - 1]?.clientId ??
      "";

    setRelatedLinkRows((currentRows) =>
      currentRows.filter((row) => row.clientId !== clientId),
    );
    setRelatedLinkErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[clientId];
      return nextErrors;
    });

    if (
      relatedLinkErrors[clientId] &&
      Object.keys(relatedLinkErrors).every((errorId) => errorId === clientId)
    ) {
      setErrorMessage((currentMessage) =>
        currentMessage === RELATED_LINK_ERROR_MESSAGE ? "" : currentMessage,
      );
    }

    window.requestAnimationFrame(() => {
      if (nextFocusId) {
        relatedLinkInputRefs.current.get(nextFocusId)?.focus();
      } else {
        addRelatedLinkButtonRef.current?.focus();
      }
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const relatedLinkValidation = validateRelatedLinks(relatedLinkRows);

    if (relatedLinkValidation.firstErrorId) {
      setRelatedLinkErrors(relatedLinkValidation.errors);
      setErrorMessage(RELATED_LINK_ERROR_MESSAGE);
      window.requestAnimationFrame(() => {
        relatedLinkInputRefs.current
          .get(relatedLinkValidation.firstErrorId)
          ?.focus();
      });
      return;
    }

    setRelatedLinkErrors({});
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await onSubmit(
        {
          ...normalizedFormValue,
          relatedLinks: relatedLinkValidation.links,
        },
        attachmentFiles,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          <Checkbox
            id="experience-period-ongoing"
            name="periodOngoing"
            size="sm"
            checked={periodFields.isOngoing}
            onCheckedChange={(checked) =>
              updatePeriodOngoing(checked === true)
            }
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

      <fieldset className="related-links-fieldset">
        <legend>관련 링크</legend>
        <div className="related-links-toolbar">
          <div>
            <p>작업 결과나 참고 자료를 링크와 설명으로 나누어 정리해보세요.</p>
            <span>최대 {MAX_RELATED_LINKS}개까지 추가할 수 있습니다.</span>
          </div>
          <button
            ref={addRelatedLinkButtonRef}
            className="related-link-add"
            type="button"
            onClick={addRelatedLink}
            disabled={relatedLinkRows.length >= MAX_RELATED_LINKS}
          >
            <Plus aria-hidden="true" />
            링크 추가
          </button>
        </div>

        {relatedLinkRows.length > 0 ? (
          <div className="related-link-rows">
            {relatedLinkRows.map((row, index) => {
              const urlInputId = `experience-link-url-${row.clientId}`;
              const descriptionInputId = `experience-link-description-${row.clientId}`;
              const errorId = `experience-link-error-${row.clientId}`;
              const rowError = relatedLinkErrors[row.clientId];

              return (
                <div className="related-link-row" key={row.clientId}>
                  <RelatedLinkFavicon url={row.previewUrl} />
                  <div className="form-field related-link-url-field">
                    <label htmlFor={urlInputId}>URL</label>
                    <input
                      ref={(node) => {
                        if (node) {
                          relatedLinkInputRefs.current.set(row.clientId, node);
                        } else {
                          relatedLinkInputRefs.current.delete(row.clientId);
                        }
                      }}
                      id={urlInputId}
                      name={`relatedLinkUrl-${index}`}
                      type="url"
                      inputMode="url"
                      autoCapitalize="none"
                      autoComplete="url"
                      spellCheck={false}
                      maxLength={MAX_RELATED_LINK_URL_LENGTH}
                      placeholder="https://example.com"
                      value={row.url}
                      onChange={(event) =>
                        updateRelatedLink(row.clientId, "url", event.target.value)
                      }
                      onBlur={() => updateRelatedLinkPreview(row.clientId)}
                      aria-invalid={Boolean(rowError)}
                      aria-describedby={rowError ? errorId : undefined}
                    />
                    {rowError ? (
                      <p className="related-link-field-error" id={errorId}>
                        {rowError}
                      </p>
                    ) : null}
                  </div>
                  <div className="form-field related-link-description-field">
                    <label htmlFor={descriptionInputId}>
                      설명 <span>(선택)</span>
                    </label>
                    <input
                      id={descriptionInputId}
                      name={`relatedLinkDescription-${index}`}
                      type="text"
                      maxLength={MAX_RELATED_LINK_DESCRIPTION_LENGTH}
                      placeholder="예: 프로젝트 GitHub 저장소"
                      value={row.description}
                      onChange={(event) =>
                        updateRelatedLink(
                          row.clientId,
                          "description",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <button
                    className="related-link-remove"
                    type="button"
                    onClick={() => removeRelatedLink(row.clientId)}
                    aria-label={`${index + 1}번째 관련 링크 삭제`}
                    title="링크 삭제"
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="related-links-empty">
            아직 추가한 링크가 없습니다. 링크 추가를 눌러 시작해보세요.
          </p>
        )}
      </fieldset>

      <ExperienceAttachmentPicker
        existingCount={attachmentCount}
        files={attachmentFiles}
        onFilesChange={setAttachmentFiles}
        disabled={!attachmentsEnabled || isSubmitting}
      />

      {errorMessage ? (
        <p className="form-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="panel-actions">
        <RippleButton
          className="button button-primary"
          type="submit"
          disabled={isSubmitting}
        >
          <Save className="button-icon" aria-hidden="true" />
          {isSubmitting ? "저장 중..." : mode === "create" ? "저장" : "수정 완료"}
          <RippleButtonRipples />
        </RippleButton>
        <Link href={cancelHref} className="button button-secondary">
          취소
        </Link>
      </div>
    </form>
  );
}
