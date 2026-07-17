"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Edit3,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { FormEvent } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

import { ActivityCreateScreen } from "@/components/activities/ActivityCreateScreen";
import { ActivityCalendar } from "@/components/activities/ActivityCalendar";
import {
  ACTIVITY_STATUS_LABELS,
  formatDateKey,
  getLocalDateKey,
  isActivityRecordableOnDate,
} from "@/components/activities/activityViewUtils";
import { FloatingPanel } from "@/components/ui/floating-panel";
import { ExpandableScreen } from "@/components/ui/expandable-screen";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
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

function createActivityDeleteConfirmMessage(
  activity: TrackedActivity,
  logCount: number,
): string {
  const deleteTargets = [
    `활동 "${activity.title}"`,
    logCount > 0 ? `연결된 날짜별 기록 ${logCount}개` : "",
    activity.synthesisStatus === "draft_ready" ||
    activity.synthesisStatus === "processing" ||
    activity.synthesisStatus === "failed"
      ? "AI 정리 결과"
      : "",
    activity.generatedExperienceId
      ? "이 활동에서 저장한 나의 활동과 연결된 AI 분석/추천/초안/보완 답변"
      : "",
  ].filter(Boolean);

  return `${deleteTargets.join(", ")}을 함께 삭제할까요? 삭제한 데이터는 복구할 수 없습니다.`;
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
  const [recordsActionError, setRecordsActionError] = useState("");
  const [recordsActionMessage, setRecordsActionMessage] = useState("");
  const [activityActionError, setActivityActionError] = useState("");
  const [activityActionMessage, setActivityActionMessage] = useState("");
  const [isRecordPanelOpen, setIsRecordPanelOpen] = useState(false);
  const [recordPanelAnchor, setRecordPanelAnchor] =
    useState<HTMLElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivityCreateOpen, setIsActivityCreateOpen] = useState(false);
  const [isActivityCreateSaving, setIsActivityCreateSaving] = useState(false);
  const [activityCreateAnchor, setActivityCreateAnchor] =
    useState<HTMLElement | null>(null);
  const generatedPanelId = useId().replaceAll(":", "");
  const recordPanelId = `daily-log-panel-${generatedPanelId}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstActivityRadioRef = useRef<HTMLInputElement>(null);
  const recordTriggerRef = useRef<HTMLButtonElement>(null);
  const recordReturnFocusRef = useRef<HTMLElement | null>(null);
  const activityCreateReturnFocusRef = useRef<HTMLElement | null>(null);
  const activityCreateTitleRef = useRef<HTMLInputElement>(null);
  const overviewActivityCreateTriggerRef = useRef<HTMLButtonElement>(null);
  const emptyActivityCreateTriggerRef = useRef<HTMLButtonElement>(null);
  const requestedPanelHandledRef = useRef(false);

  const loadDashboardData = useCallback(async () => {
    setLoadError("");

    try {
      const repository = getCampusLogRepository();
      const [storedActivities, storedLogs] = await Promise.all([
        repository.trackedActivities.list(),
        repository.dailyLogs.list(),
      ]);
      const sortedActivities = sortActivities(storedActivities);
      setActivities(sortedActivities);
      setLogs(sortLogs(storedLogs));

      const recordableTodayActivities = sortedActivities.filter((activity) =>
        isActivityRecordableOnDate(activity, today, today),
      );
      const requestedActivityId = getRequestedActivityId();
      setSelectedActivityId((current) => {
        if (
          recordableTodayActivities.some(
            (activity) => activity.id === requestedActivityId,
          )
        ) {
          return requestedActivityId;
        }

        return recordableTodayActivities.some((activity) => activity.id === current)
          ? current
          : (recordableTodayActivities[0]?.id ?? "");
      });
    } catch {
      setActivities([]);
      setLogs([]);
      setLoadError(
        "저장된 기록을 불러오지 못했습니다. 계정 데이터는 지우지 않았으니 다시 시도해 주세요.",
      );
    }
  }, [today]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeActivities = useMemo(
    () =>
      activities?.filter((activity) =>
        isActivityRecordableOnDate(activity, today, today),
      ) ?? [],
    [activities, today],
  );
  const recordableActivities = useMemo(
    () =>
      activities?.filter((activity) =>
        isActivityRecordableOnDate(activity, selectedDate, today),
      ) ?? [],
    [activities, selectedDate, today],
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

  useEffect(() => {
    if (activities === null || requestedPanelHandledRef.current) {
      return;
    }

    const requestedActivityId = getRequestedActivityId();

    if (
      !requestedActivityId ||
      !recordableActivities.some(
        (activity) => activity.id === requestedActivityId,
      )
    ) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const trigger = recordTriggerRef.current;

      if (!trigger) {
        return;
      }

      recordReturnFocusRef.current = trigger;
      requestedPanelHandledRef.current = true;
      setRecordPanelAnchor(trigger);
      setIsRecordPanelOpen(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activities, recordableActivities]);

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

  function openRecordPanel(anchor = recordTriggerRef.current) {
    if (!anchor) {
      return;
    }

    recordReturnFocusRef.current = anchor;
    setRecordPanelAnchor(anchor);
    setFormError("");
    setStatusMessage("");
    setIsRecordPanelOpen(true);
  }

  function openActivityCreateScreen(anchor: HTMLElement) {
    activityCreateReturnFocusRef.current = anchor;
    setActivityCreateAnchor(anchor);
    setIsActivityCreateOpen(true);
  }

  function closeActivityCreateScreen() {
    if (!isActivityCreateSaving) {
      setIsActivityCreateOpen(false);
    }
  }

  function closeRecordPanel() {
    setIsRecordPanelOpen(false);
    setFormError("");
  }

  function cancelRecordPanel() {
    setIsRecordPanelOpen(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setFormError("");
    setStatusMessage("");

    const normalizedContent = content.trim();
    const activity = activitiesById[selectedActivityId];

    if (!activity || !isActivityRecordableOnDate(activity, selectedDate, today)) {
      setFormError("기록을 연결할 진행 중 활동을 선택해 주세요.");
      firstActivityRadioRef.current?.focus();
      return;
    }

    if (!normalizedContent) {
      setFormError("오늘 실제로 한 일을 한 문장 이상 적어 주세요.");
      textareaRef.current?.focus();
      return;
    }

    const repository = getCampusLogRepository();
    setIsSaving(true);

    try {
      const savedLog = editingLog
        ? await repository.dailyLogs.update(editingLog.id, {
            activityId: selectedActivityId,
            date: selectedDate,
            content: normalizedContent,
          })
        : await repository.dailyLogs.create({
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

      setLogs((currentLogs) =>
        sortLogs([
          ...currentLogs.filter((log) => log.id !== savedLog.id),
          savedLog,
        ]),
      );
      setStatusMessage(
        editingLog ? "기록을 수정했습니다." : "오늘 한 일을 기록했습니다.",
      );
      setIsRecordPanelOpen(false);
      resetForm();
    } catch {
      setFormError(
        editingLog
          ? "기록을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요."
          : "기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(log: DailyLog, anchor: HTMLButtonElement) {
    const activity = activitiesById[log.activityId];

    if (!activity || !isActivityRecordableOnDate(activity, log.date, today)) {
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
    recordReturnFocusRef.current = anchor;
    setRecordPanelAnchor(anchor);
    setIsRecordPanelOpen(true);
  }

  async function handleDelete(log: DailyLog) {
    const activity = activitiesById[log.activityId];

    if (
      !activity ||
      !isActivityRecordableOnDate(activity, log.date, today) ||
      !window.confirm("이 기록을 삭제할까요? 삭제한 내용은 복구할 수 없습니다.")
    ) {
      return;
    }

    const repository = getCampusLogRepository();
    let didDelete = false;

    try {
      didDelete = await repository.dailyLogs.delete(log.id);
    } catch {
      didDelete = false;
    }

    if (!didDelete) {
      setRecordsActionMessage("");
      setRecordsActionError(
        "기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    setLogs((currentLogs) =>
      currentLogs.filter((storedLog) => storedLog.id !== log.id),
    );
    setRecordsActionMessage("기록을 삭제했습니다.");
    setRecordsActionError("");

    if (editingLog?.id === log.id) {
      setIsRecordPanelOpen(false);
      resetForm();
    }
  }

  async function handleDeleteActivity(activity: TrackedActivity) {
    const activityLogCount = logs.filter(
      (log) => log.activityId === activity.id,
    ).length;

    if (
      !window.confirm(createActivityDeleteConfirmMessage(activity, activityLogCount))
    ) {
      return;
    }

    const repository = getCampusLogRepository();
    let didDelete = false;

    try {
      didDelete = await repository.trackedActivities.delete(activity.id);
    } catch {
      didDelete = false;
    }

    if (!didDelete) {
      setActivityActionMessage("");
      setActivityActionError(
        "활동을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    setActivities((currentActivities) =>
      currentActivities
        ? sortActivities(
            currentActivities.filter(
              (storedActivity) => storedActivity.id !== activity.id,
            ),
          )
        : currentActivities,
    );
    setLogs((currentLogs) =>
      currentLogs.filter((log) => log.activityId !== activity.id),
    );
    setSelectedActivityId((current) =>
      current === activity.id
        ? (recordableActivities.find(
            (recordableActivity) => recordableActivity.id !== activity.id,
          )?.id ?? "")
        : current,
    );
    setActivityActionError("");
    setActivityActionMessage("활동을 삭제했습니다.");
  }

  function handleSelectDate(date: string) {
    setIsRecordPanelOpen(false);
    setRecordPanelAnchor(null);
    setSelectedDate(date);
    setStatusMessage("");
    setRecordsActionMessage("");
    setRecordsActionError("");
    setEditingLog(null);
    setContent("");
    setFormError("");
    const nextRecordableActivities =
      activities?.filter((activity) =>
        isActivityRecordableOnDate(activity, date, today),
      ) ?? [];
    setSelectedActivityId((current) =>
      nextRecordableActivities.some((activity) => activity.id === current)
        ? current
        : (nextRecordableActivities[0]?.id ?? ""),
    );
  }

  const hasActivitySelectionError = formError.includes("활동을 선택");
  const hasContentError = formError.includes("한 문장 이상");
  const quickRecordMode =
    recordableActivities.length > 0
      ? "ready"
      : activeActivities.length > 0
        ? "date-unavailable"
        : "needs-activity";

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
            하루하루 해낸 일을 기록하세요. 쌓인 기록은 하나의 경험이
            됩니다.
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
            <h2 id="activity-overview-title">현재 진행 중인 활동</h2>
          </div>
          <div className="activity-overview-actions">
            <span className="activity-overview-count">
              {activeActivities.length}개
            </span>
            <button
              ref={overviewActivityCreateTriggerRef}
              type="button"
              className="activity-primary-button"
              onClick={(event) => openActivityCreateScreen(event.currentTarget)}
              aria-haspopup="dialog"
              aria-expanded={
                isActivityCreateOpen &&
                activityCreateAnchor === overviewActivityCreateTriggerRef.current
              }
            >
              <Plus aria-hidden="true" />
              활동 추가
            </button>
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
                <button
                  type="button"
                  className="activity-summary-delete-button"
                  onClick={() => handleDeleteActivity(activity)}
                  aria-label={`${activity.title} 활동 삭제`}
                >
                  <Trash2 aria-hidden="true" />
                  삭제
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="activity-overview-empty">
            <p>진행 중인 활동이 아직 없습니다.</p>
          </div>
        )}

        {activityActionError ? (
          <p className="activity-form-error activity-overview-feedback" role="alert">
            {activityActionError}
          </p>
        ) : null}
        {activityActionMessage ? (
          <p
            className="activity-form-success activity-overview-feedback"
            role="status"
          >
            {activityActionMessage}
          </p>
        ) : null}

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
                  <button
                    type="button"
                    className="activity-summary-delete-button"
                    onClick={() => handleDeleteActivity(activity)}
                    aria-label={`${activity.title} 활동 삭제`}
                  >
                    <Trash2 aria-hidden="true" />
                    삭제
                  </button>
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
                  <button
                    type="button"
                    className="activity-planned-delete-button"
                    onClick={() => handleDeleteActivity(activity)}
                    aria-label={`${activity.title} 예정 활동 삭제`}
                  >
                    <Trash2 aria-hidden="true" />
                    삭제
                  </button>
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

        <section
          className="activity-quick-record activity-quick-record-launcher"
          aria-labelledby="quick-record-title"
        >
          <header>
            <div>
              <p className="activity-section-kicker">{formatDateKey(selectedDate, { month: "long", day: "numeric", weekday: "short" })}</p>
              <h2 id="quick-record-title">오늘 한 일 기록하기</h2>
            </div>
          </header>

          <MotionConfig reducedMotion="user">
            <AnimatePresence mode="wait" initial={false}>
          {quickRecordMode === "ready" ? (
            <motion.div
              key="record-ready"
              className="activity-record-launcher-copy"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
                <motion.button
                  ref={recordTriggerRef}
                  type="button"
                  className="activity-record-trigger"
                  onClick={(event) => openRecordPanel(event.currentTarget)}
                  aria-haspopup="dialog"
                  aria-expanded={isRecordPanelOpen}
                  aria-controls={recordPanelId}
                  whileTap={{ scale: 0.985 }}
                >
                  <span className="activity-record-trigger-icon" aria-hidden="true">
                    <Plus />
                  </span>
                  <span className="activity-record-trigger-copy">
                    <span className="activity-record-trigger-label">
                      {editingLog
                        ? "수정 이어가기"
                        : content.trim()
                          ? "작성 이어가기"
                          : "기록 남기기"}
                    </span>
                    <span className="activity-record-trigger-meta">
                      {editingLog
                        ? "선택한 기록을 수정 중"
                        : `${recordableActivities.length}개 활동에 연결 가능`}
                    </span>
                  </span>
                  <ArrowRight
                    className="activity-record-trigger-arrow"
                    aria-hidden="true"
                  />
                </motion.button>

              {statusMessage ? (
                <p
                  className="activity-form-success activity-record-feedback"
                  role="status"
                >
                  {statusMessage}
                </p>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key={quickRecordMode}
              className="activity-record-empty"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <CalendarDays aria-hidden="true" />
              <p>
                {quickRecordMode === "date-unavailable"
                  ? "이 날짜에 기록할 수 있는 진행 활동이 없습니다. 활동 시작일 이후 날짜를 선택해 주세요."
                  : "오늘 한 일을 연결하려면 먼저 진행 활동을 등록해 주세요."}
              </p>
              {quickRecordMode === "needs-activity" ? (
                <button
                  ref={emptyActivityCreateTriggerRef}
                  type="button"
                  className="activity-record-empty-action"
                  onClick={(event) =>
                    openActivityCreateScreen(event.currentTarget)
                  }
                  aria-haspopup="dialog"
                  aria-expanded={
                    isActivityCreateOpen &&
                    activityCreateAnchor === emptyActivityCreateTriggerRef.current
                  }
                >
                  <Plus aria-hidden="true" />
                  진행 활동 추가
                </button>
              ) : selectedDate !== today ? (
                <button
                  type="button"
                  className="activity-record-empty-action"
                  onClick={() => handleSelectDate(today)}
                >
                  오늘로 돌아가기
                </button>
              ) : null}
            </motion.div>
          )}
            </AnimatePresence>
          </MotionConfig>

          <FloatingPanel
            open={isRecordPanelOpen}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                closeRecordPanel();
              }
            }}
            anchorElement={recordPanelAnchor}
            returnFocusRef={recordReturnFocusRef}
            fallbackFocusRef={recordTriggerRef}
            initialFocusRef={textareaRef}
            id={recordPanelId}
            title={editingLog ? "기록 수정하기" : "오늘 한 일 남기기"}
            closeLabel="오늘 한 일 기록 패널 닫기"
            dismissible={!isSaving}
            description={formatDateKey(selectedDate, {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
            className="activity-floating-record-panel"
          >
            <form
              onSubmit={handleSubmit}
              className="activity-record-form activity-floating-record-form"
              noValidate
              aria-busy={isSaving}
            >
              <div className="activity-floating-record-fields">
                <fieldset
                  aria-invalid={hasActivitySelectionError || undefined}
                  aria-describedby={
                    hasActivitySelectionError
                      ? `${recordPanelId}-error`
                      : undefined
                  }
                >
                  <legend>무슨 활동에서 한 일인가요?</legend>
                  <div className="activity-tag-options">
                    {recordableActivities.map((activity, index) => (
                      <label key={activity.id}>
                        <input
                          ref={index === 0 ? firstActivityRadioRef : undefined}
                          type="radio"
                          name="activityId"
                          value={activity.id}
                          checked={selectedActivityId === activity.id}
                          onChange={() => setSelectedActivityId(activity.id)}
                          disabled={isSaving}
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
                    rows={6}
                    maxLength={2000}
                    placeholder="예: 사용자 인터뷰 3건을 진행하고 반복해서 나온 불편을 정리했다."
                    aria-invalid={hasContentError || undefined}
                    aria-describedby={
                      hasContentError
                        ? `${recordPanelId}-help ${recordPanelId}-error`
                        : `${recordPanelId}-help`
                    }
                    disabled={isSaving}
                  />
                </label>
                <div
                  className="activity-field-help"
                  id={`${recordPanelId}-help`}
                >
                  <span>
                    한 일을 자세히 적을수록 AI가 더 정확하게 분석할 수 있어요.
                  </span>
                  <span>{content.length}/2000</span>
                </div>

                {formError ? (
                  <p
                    className="activity-form-error"
                    id={`${recordPanelId}-error`}
                    role="alert"
                  >
                    {formError}
                  </p>
                ) : null}
              </div>

              <div className="activity-floating-record-footer">
                <button
                  type="button"
                  className="activity-secondary-button"
                  onClick={cancelRecordPanel}
                  disabled={isSaving}
                >
                  작성 취소
                </button>
                <button
                  type="submit"
                  className="activity-primary-button"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="activity-button-spinner" aria-hidden="true" />
                  ) : editingLog ? (
                    <Save aria-hidden="true" />
                  ) : (
                    <Plus aria-hidden="true" />
                  )}
                  {isSaving
                    ? "저장 중"
                    : editingLog
                      ? "수정 내용 저장"
                      : "기록 저장"}
                </button>
              </div>
            </form>
          </FloatingPanel>
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

        {recordsActionError ? (
          <p className="activity-form-error activity-records-feedback" role="alert">
            {recordsActionError}
          </p>
        ) : null}
        {recordsActionMessage ? (
          <p
            className="activity-form-success activity-records-feedback"
            role="status"
          >
            {recordsActionMessage}
          </p>
        ) : null}

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
                        onClick={(event) =>
                          startEditing(log, event.currentTarget)
                        }
                        aria-label={`${activity.title} 기록 수정`}
                        aria-haspopup="dialog"
                        aria-controls={recordPanelId}
                        aria-expanded={
                          isRecordPanelOpen && editingLog?.id === log.id
                        }
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

      <ExpandableScreen
        open={isActivityCreateOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeActivityCreateScreen();
          }
        }}
        anchorElement={activityCreateAnchor}
        returnFocusRef={activityCreateReturnFocusRef}
        initialFocusRef={activityCreateTitleRef}
        title="새 활동 추가"
        description="활동 제목과 내용을 입력하고 시작일과 예상 종료일을 정합니다."
        closeLabel="활동 추가 화면 닫기"
        dismissible={!isActivityCreateSaving}
      >
        <ActivityCreateScreen
          onCancel={closeActivityCreateScreen}
          onSavingChange={setIsActivityCreateSaving}
          titleInputRef={activityCreateTitleRef}
        />
      </ExpandableScreen>
    </div>
  );
}
