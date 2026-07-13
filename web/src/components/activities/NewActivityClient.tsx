"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

import { getLocalDateKey } from "@/components/activities/activityViewUtils";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";

type ActivityFormValue = {
  title: string;
  description: string;
  startDate: string;
  expectedEndDate: string;
};

export function NewActivityClient() {
  const router = useRouter();
  const today = getLocalDateKey();
  const [formValue, setFormValue] = useState<ActivityFormValue>({
    title: "",
    description: "",
    startDate: today,
    expectedEndDate: "",
  });
  const [isEndDateUndecided, setIsEndDateUndecided] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  function updateField<Field extends keyof ActivityFormValue>(
    field: Field,
    value: ActivityFormValue[Field],
  ) {
    setFormValue((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const title = formValue.title.trim();
    const description = formValue.description.trim();

    if (!title) {
      setError("활동 제목을 입력해 주세요.");
      titleRef.current?.focus();
      return;
    }

    if (!description) {
      setError("활동 내용을 입력해 주세요.");
      return;
    }

    if (!formValue.startDate) {
      setError("활동 시작일을 선택해 주세요.");
      return;
    }

    if (!isEndDateUndecided && !formValue.expectedEndDate) {
      setError("예상 종료일을 선택하거나 미정을 선택해 주세요.");
      return;
    }

    if (
      formValue.expectedEndDate &&
      formValue.expectedEndDate < formValue.startDate
    ) {
      setError("예상 종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    setIsSaving(true);
    const repository = getCampusLogRepository();

    try {
      const createdActivity = await repository.trackedActivities.create({
        title,
        description,
        startDate: formValue.startDate,
        expectedEndDate: formValue.expectedEndDate,
      });

      if (!createdActivity) {
        setIsSaving(false);
        setError("활동을 저장하지 못했습니다. 입력 내용을 확인해 주세요.");
        return;
      }

      router.push(`/activities/${createdActivity.id}`);
    } catch {
      setIsSaving(false);
      setError("활동을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="activity-form-page">
      <header className="activity-form-header">
        <Link href="/dashboard" className="activity-back-link">
          <ArrowLeft aria-hidden="true" />
          오늘의 기록
        </Link>
        <div className="activity-form-heading">
          <div>
            <h1>활동 추가</h1>
            <p>
              활동을 간단히 등록하고 실제로 한 일은 날짜별로 쌓아가세요.
            </p>
          </div>
        </div>
      </header>

      <section className="activity-form-surface" aria-labelledby="activity-form-title">
        <div className="activity-form-intro">
          <h2 id="activity-form-title">활동 정보</h2>
          <p>제목과 간단한 내용을 적어주세요.</p>
        </div>

        <form className="activity-create-form" onSubmit={handleSubmit} noValidate>
          <label>
            <span>활동 제목</span>
            <input
              ref={titleRef}
              type="text"
              value={formValue.title}
              onChange={(event) => updateField("title", event.target.value)}
              maxLength={120}
              autoComplete="off"
              placeholder="예: CampusLog MVP 프로젝트"
              required
            />
          </label>

          <label>
            <span>간단한 내용</span>
            <textarea
              value={formValue.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              maxLength={500}
              rows={4}
              placeholder="예: 대학생 활동 기록 서비스를 기획하고 개발합니다."
              required
            />
          </label>

          <div className="activity-date-fields">
            <label>
              <span>시작일</span>
              <input
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
                  setError("");
                }}
                required
              />
              <small>
                미래 날짜면 시작 예정, 오늘 또는 과거 날짜면 진행 중으로 등록됩니다.
              </small>
            </label>

            <div className="activity-date-field">
              <div className="activity-date-field-heading">
                <label htmlFor="activity-expected-end-date">예상 종료일</label>
                <label className="activity-undecided-option">
                  <input
                    type="checkbox"
                    checked={isEndDateUndecided}
                    onChange={(event) => {
                      const isUndecided = event.target.checked;
                      setIsEndDateUndecided(isUndecided);
                      setFormValue((current) => ({
                        ...current,
                        expectedEndDate: isUndecided
                          ? ""
                          : current.expectedEndDate || current.startDate,
                      }));
                      setError("");
                    }}
                  />
                  미정
                </label>
              </div>
              <input
                id="activity-expected-end-date"
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
                disabled={isEndDateUndecided}
              />
              <small>실제 종료일은 활동을 마칠 때 따로 기록합니다.</small>
            </div>
          </div>

          {error ? (
            <p className="activity-form-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="activity-form-actions">
            <Link href="/dashboard" className="activity-secondary-button">
              취소
            </Link>
            <button
              type="submit"
              className="activity-primary-button"
              disabled={isSaving}
            >
              <Save aria-hidden="true" />
              {isSaving ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
