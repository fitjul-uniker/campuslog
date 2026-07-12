"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Edit3,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActivityCalendar } from "@/components/activities/ActivityCalendar";
import {
  ACTIVITY_STATUS_LABELS,
  formatDateKey,
  getLocalDateKey,
} from "@/components/activities/activityViewUtils";
import {
  createDailyLog,
  deleteDailyLog,
  getDailyLogs,
  getTrackedActivities,
  updateDailyLog,
} from "@/lib/storage";
import type { DailyLog, TrackedActivity } from "@/lib/types";

type EditingLog = {
  id: string;
  activityId: string;
  content: string;
};

function sortActivities(activities: TrackedActivity[]): TrackedActivity[] {
  return [...activities].sort((a, b) => {
    if (a.status !== b.status) {
      const priority = { active: 0, planned: 1, completed: 2 } as const;
      return priority[a.status] - priority[b.status];
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function sortLogs(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function getCompletionActionLabel(activity: TrackedActivity): string {
  switch (activity.synthesisStatus) {
    case "processing":
      return "AI 정리 상태 확인";
    case "draft_ready":
      return "AI 초안 검토하기";
    case "failed":
      return "AI 정리 다시 시도";
    default:
      return "완료 경험 마무리하기";
  }
}

function getRequestedActivityId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    new URLSearchParams(window.location.search).get("activityId")?.trim() ?? ""
  );
}

export function TodayDashboard() {
  const today = getLocalDateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activities, setActivities] = useState<TrackedActivity[] | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [content, setContent] = useState("");
  const [editingLog, setEditingLog] = useState<EditingLog | null>(null);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadDashboardData = useCallback(() => {
    setLoadError("");

    try {
      const storedActivities = sortActivities(getTrackedActivities());
      setActivities(storedActivities);
      setLogs(sortLogs(getDailyLogs()));

      const activeActivities = storedActivities.filter(
        (activity) => activity.status === "active",
      );
      const requestedActivityId = getRequestedActivityId();
      setSelectedActivityId((current) => {
        if (
          activeActivities.some(
            (activity) =>
              activity.id === requestedActivityId &&
              activity.startDate <= today,
          )
        ) {
          return requestedActivityId;
        }

        return activeActivities.some((activity) => activity.id === current)
          ? current
          : (activeActivities[0]?.id ?? "");
      });
    } catch {
      setActivities([]);
      setLogs([]);
      setLoadError(
        "저장된 기록을 불러오지 못했습니다. 브라우저의 데이터는 지우지 않았으니 다시 시도해 주세요.",
      );
    }
  }, [today]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeActivities = useMemo(
    () => activities?.filter((activity) => activity.status === "active") ?? [],
    [activities],
  );
  const recordableActivities = useMemo(
    () =>
      activeActivities.filter(
        (activity) => activity.startDate <= selectedDate,
      ),
    [activeActivities, selectedDate],
  );
  const plannedActivities = useMemo(
    () => activities?.filter((activity) => activity.status === "planned") ?? [],
    [activities],
  );
  const activitiesRequiringCompletion = useMemo(
    () =>
      activities?.filter(
        (activity) =>
          activity.status === "completed" &&
          !activity.generatedExperienceId,
      ) ?? [],
    [activities],
  );
  const activitiesById = useMemo(
    () =>
      (activities ?? []).reduce<Record<string, TrackedActivity>>(
        (indexedActivities, activity) => {
          indexedActivities[activity.id] = activity;
          return indexedActivities;
        },
        {},
      ),
    [activities],
  );
  const selectedLogs = useMemo(
    () => logs.filter((log) => log.date === selectedDate),
    [logs, selectedDate],
  );

  function resetForm() {
    setEditingLog(null);
    setContent("");
    setFormError("");
    setSelectedActivityId((current) =>
      recordableActivities.some((activity) => activity.id === current)
        ? current
        : (recordableActivities[0]?.id ?? ""),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setStatusMessage("");

    const normalizedContent = content.trim();
    const activity = activitiesById[selectedActivityId];

    if (!activity || activity.status !== "active") {
      setFormError("기록을 연결할 진행 중 활동을 선택해 주세요.");
      return;
    }

    if (!normalizedContent) {
      setFormError("오늘 실제로 한 일을 한 문장 이상 적어 주세요.");
      textareaRef.current?.focus();
      return;
    }

    const savedLog = editingLog
      ? updateDailyLog(editingLog.id, {
          activityId: selectedActivityId,
          date: selectedDate,
          content: normalizedContent,
        })
      : createDailyLog({
          activityId: selectedActivityId,
          date: selectedDate,
          content: normalizedContent,
        });

    if (!savedLog) {
      setFormError(
        editingLog
          ? "기록을 수정하지 못했습니다. 활동 상태와 날짜를 확인해 주세요."
          : "기록을 저장하지 못했습니다. 활동 상태와 날짜를 확인해 주세요.",
      );
      return;
    }

    setLogs(sortLogs(getDailyLogs()));
    setStatusMessage(editingLog ? "기록을 수정했습니다." : "오늘 한 일을 기록했습니다.");
    resetForm();
  }

  function startEditing(log: DailyLog) {
    const activity = activitiesById[log.activityId];

    if (!activity || activity.status !== "active") {
      return;
    }

    setEditingLog({
      id: log.id,
      activityId: log.activityId,
      content: log.content,
    });
    setSelectedActivityId(log.activityId);
    setContent(log.content);
    setFormError("");
    setStatusMessage("");
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleDelete(log: DailyLog) {
    const activity = activitiesById[log.activityId];

    if (
      !activity ||
      activity.status !== "active" ||
      !window.confirm("이 기록을 삭제할까요? 삭제한 내용은 복구할 수 없습니다.")
    ) {
      return;
    }

    if (!deleteDailyLog(log.id)) {
      setStatusMessage("");
      setFormError("기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setLogs(sortLogs(getDailyLogs()));
    setStatusMessage("기록을 삭제했습니다.");
    setFormError("");

    if (editingLog?.id === log.id) {
      resetForm();
    }
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setStatusMessage("");
    setEditingLog(null);
    setContent("");
    setFormError("");
    const nextRecordableActivities = activeActivities.filter(
      (activity) => activity.startDate <= date,
    );
    setSelectedActivityId((current) =>
      nextRecordableActivities.some((activity) => activity.id === current)
        ? current
        : (nextRecordableActivities[0]?.id ?? ""),
    );
  }

  if (activities === null) {
    return (
      <div className="activity-today-page activity-page-loading" aria-busy="true">
        <span className="sr-only">오늘의 기록을 불러오는 중입니다.</span>
        <div />
        <div />
        <div />
      </div>
    );
  }

  return (
    <div className="activity-today-page">
      <header className="activity-today-header">
        <div>
          <p className="activity-section-kicker">{formatDateKey(today, { month: "long", day: "numeric", weekday: "long" })}</p>
          <h1>오늘의 기록</h1>
          <p>
            예정이 아닌, 실제로 해낸 일을 남겨보세요. 쌓인 기록은 활동을
            마칠 때 하나의 경험으로 정리됩니다.
          </p>
        </div>
      </header>

      {loadError ? (
        <div className="activity-inline-alert" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={loadDashboardData}>
            다시 불러오기
          </button>
        </div>
      ) : null}

      <section className="activity-overview" aria-labelledby="activity-overview-title">
        <div className="activity-overview-heading">
          <div>
            <h2 id="activity-overview-title">진행 중인 활동</h2>
          </div>
          <div className="activity-overview-actions">
            <span className="activity-overview-count">
              {activeActivities.length}개
            </span>
            <Link href="/activities/new" className="activity-primary-button">
              <Plus aria-hidden="true" />
              활동 추가
            </Link>
          </div>
        </div>

        {activeActivities.length > 0 ? (
          <ul className="activity-summary-list activity-active-list">
            {activeActivities.map((activity) => (
              <li key={activity.id}>
                <Link href={`/activities/${activity.id}`}>
                  <strong className="activity-summary-title">
                    {activity.title}
                  </strong>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="activity-overview-empty">
            <p>진행 중인 활동이 아직 없습니다.</p>
          </div>
        )}

        {activitiesRequiringCompletion.length > 0 ? (
          <div className="activity-finishing-section">
            <div className="activity-finishing-heading">
              <div>
                <p className="activity-section-kicker">마무리 필요</p>
                <h3>완료 경험으로 정리할 활동</h3>
              </div>
              <span>{activitiesRequiringCompletion.length}개</span>
            </div>
            <ul className="activity-summary-list activity-finishing-list">
              {activitiesRequiringCompletion.map((activity) => (
                <li key={activity.id}>
                  <Link href={`/activities/${activity.id}`}>
                    <span className="activity-summary-icon">
                      <Sparkles aria-hidden="true" />
                    </span>
                    <span className="activity-summary-copy">
                      <strong>{activity.title}</strong>
                      <span>{getCompletionActionLabel(activity)}</span>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {plannedActivities.length > 0 ? (
          <details className="activity-planned-list">
            <summary>시작 예정 활동 {plannedActivities.length}개</summary>
            <ul>
              {plannedActivities.map((activity) => (
                <li key={activity.id}>
                  <Link href={`/activities/${activity.id}`}>
                    <span>{activity.title}</span>
                    <span>{formatDateKey(activity.startDate)} 시작</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <div className="activity-dashboard-grid">
        <ActivityCalendar
          key={selectedDate.slice(0, 7)}
          logs={logs}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />

        <section className="activity-quick-record" aria-labelledby="quick-record-title">
          <header>
            <div>
              <p className="activity-section-kicker">{formatDateKey(selectedDate, { month: "long", day: "numeric", weekday: "short" })}</p>
              <h2 id="quick-record-title">
                {editingLog ? "기록 수정하기" : "오늘 한 일 기록하기"}
              </h2>
            </div>
            {editingLog ? (
              <button
                type="button"
                className="activity-icon-button"
                onClick={resetForm}
                aria-label="기록 수정 취소"
              >
                <X aria-hidden="true" />
              </button>
            ) : null}
          </header>

          {recordableActivities.length > 0 ? (
            <form onSubmit={handleSubmit} className="activity-record-form">
              <fieldset>
                <legend>무슨 활동에서 한 일인가요?</legend>
                <div className="activity-tag-options">
                  {recordableActivities.map((activity) => (
                    <label key={activity.id}>
                      <input
                        type="radio"
                        name="activityId"
                        value={activity.id}
                        checked={selectedActivityId === activity.id}
                        onChange={() => setSelectedActivityId(activity.id)}
                      />
                      <span>{activity.title}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="activity-textarea-field">
                <span>실제로 한 일</span>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="예: 사용자 인터뷰 3건을 진행하고 반복해서 나온 불편을 정리했다."
                  aria-describedby="daily-log-help daily-log-error"
                />
              </label>
              <div className="activity-field-help" id="daily-log-help">
                <span>완료한 행동과 확인된 결과를 구체적으로 남기면 AI가 더 정확히 정리할 수 있어요.</span>
                <span>{content.length}/2000</span>
              </div>

              {formError ? (
                <p className="activity-form-error" id="daily-log-error" role="alert">
                  {formError}
                </p>
              ) : null}
              {statusMessage ? (
                <p className="activity-form-success" role="status">
                  {statusMessage}
                </p>
              ) : null}

              <button type="submit" className="activity-primary-button">
                {editingLog ? <Save aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {editingLog ? "수정 내용 저장" : "기록 저장"}
              </button>
            </form>
          ) : (
            <div className="activity-record-empty">
              <CalendarDays aria-hidden="true" />
              <p>
                {activeActivities.length > 0
                  ? "이 날짜에 기록할 수 있는 진행 활동이 없습니다. 활동 시작일 이후 날짜를 선택해 주세요."
                  : "오늘 한 일을 연결하려면 먼저 진행 활동을 등록해 주세요."}
              </p>
              <Link href="/activities/new">활동 추가</Link>
            </div>
          )}
        </section>
      </div>

      <section className="activity-day-records" aria-labelledby="day-records-title">
        <header>
          <div>
            <p className="activity-section-kicker">날짜별 기록</p>
            <h2 id="day-records-title">
              {formatDateKey(selectedDate, { month: "long", day: "numeric" })}에 한 일
            </h2>
          </div>
          <span>{selectedLogs.length}개</span>
        </header>

        {selectedLogs.length > 0 ? (
          <ol className="activity-log-list">
            {selectedLogs.map((log) => {
              const activity = activitiesById[log.activityId];
              const canEdit = activity?.status === "active";

              return (
                <li key={log.id} data-editing={editingLog?.id === log.id || undefined}>
                  <div className="activity-log-marker" aria-hidden="true" />
                  <div className="activity-log-content">
                    <div className="activity-log-meta">
                      <Link href={`/activities/${log.activityId}`}>
                        {activity?.title ?? "연결된 활동"}
                      </Link>
                      <span>{activity ? ACTIVITY_STATUS_LABELS[activity.status] : "상태 없음"}</span>
                    </div>
                    <p>{log.content}</p>
                  </div>
                  {canEdit ? (
                    <div className="activity-log-actions">
                      <button
                        type="button"
                        onClick={() => startEditing(log)}
                        aria-label={`${activity.title} 기록 수정`}
                      >
                        <Edit3 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(log)}
                        aria-label={`${activity.title} 기록 삭제`}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="activity-day-empty">
            <p>이 날짜에 남긴 기록이 없습니다.</p>
            {selectedDate !== today ? (
              <button type="button" onClick={() => handleSelectDate(today)}>
                오늘로 돌아가기
              </button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
