"use client";

import Link from "next/link";
import {
  ArrowRight,
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

import { ActivityCreateScreen } from "@/components/activities/ActivityCreateScreen";
import { ActivityCreateForm } from "@/components/activities/ActivityCreateForm";
import { ActivityCalendar } from "@/components/activities/ActivityCalendar";
import {
  formatDateKey,
  getLocalDateKey,
  isActivityRecordableOnDate,
} from "@/components/activities/activityViewUtils";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import { FloatingPanel } from "@/components/ui/floating-panel";
import { ExpandableScreen } from "@/components/ui/expandable-screen";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCampusLogRepository } from "@/lib/repositories/campuslogRepository";
import type { DailyLog, TrackedActivity } from "@/lib/types";

type EditingLog = {
  id: string;
  activityId: string;
  content: string;
};

type ActivityComboboxOption = {
  label: string;
  value: string;
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
  const [isActivityRequiredNoticeOpen, setIsActivityRequiredNoticeOpen] =
    useState(false);
  const [recordPanelAnchor, setRecordPanelAnchor] =
    useState<HTMLElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivityCreateOpen, setIsActivityCreateOpen] = useState(false);
  const [isActivityCreateSaving, setIsActivityCreateSaving] = useState(false);
  const [activityCreateAnchor, setActivityCreateAnchor] =
    useState<HTMLElement | null>(null);
  const [editingCompletionActivityId, setEditingCompletionActivityId] =
    useState("");
  const [isCompletionActivitySaving, setIsCompletionActivitySaving] =
    useState(false);
  const generatedPanelId = useId().replaceAll(":", "");
  const recordPanelId = `daily-log-panel-${generatedPanelId}`;
  const activityRequiredPanelId = `activity-required-panel-${generatedPanelId}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activityComboboxRef = useRef<HTMLInputElement>(null);
  const recordTriggerRef = useRef<HTMLButtonElement>(null);
  const activityRequiredActionRef = useRef<HTMLButtonElement>(null);
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
          : "";
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
  const activityComboboxOptions = useMemo<ActivityComboboxOption[]>(
    () =>
      recordableActivities.map((activity) => ({
        label: activity.title,
        value: activity.id,
      })),
    [recordableActivities],
  );
  const selectedActivityOption =
    activityComboboxOptions.find(
      (activity) => activity.value === selectedActivityId,
    ) ?? null;
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
  const editingCompletionActivity = editingCompletionActivityId
    ? (activitiesById[editingCompletionActivityId] ?? null)
    : null;
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
    setSelectedActivityId("");
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

  function openActivityRequiredNotice(anchor: HTMLButtonElement) {
    recordReturnFocusRef.current = anchor;
    setRecordPanelAnchor(anchor);
    setIsActivityRequiredNoticeOpen(true);
  }

  function closeActivityRequiredNotice() {
    setIsActivityRequiredNoticeOpen(false);
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
      activityComboboxRef.current?.focus();
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
      setRecordsActionMessage("");
      setRecordsActionError("");
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
    setRecordsActionMessage("");
    setRecordsActionError("");
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
    setStatusMessage("");
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
      current === activity.id ? "" : current,
    );
    setActivityActionError("");
    setActivityActionMessage("활동을 삭제했습니다.");
    if (editingCompletionActivityId === activity.id) {
      setEditingCompletionActivityId("");
    }
  }

  function handleCompletionActivitySaved(updatedActivity: TrackedActivity) {
    setActivities((currentActivities) =>
      currentActivities
        ? sortActivities(
            currentActivities.map((activity) =>
              activity.id === updatedActivity.id ? updatedActivity : activity,
            ),
          )
        : currentActivities,
    );
    setEditingCompletionActivityId("");
    setActivityActionError("");
    setActivityActionMessage("활동 정보를 수정했습니다.");
  }

  function handleSelectDate(date: string) {
    setIsRecordPanelOpen(false);
    setIsActivityRequiredNoticeOpen(false);
    setRecordPanelAnchor(null);
    setSelectedDate(date);
    setStatusMessage("");
    setRecordsActionMessage("");
    setRecordsActionError("");
    setEditingLog(null);
    setContent("");
    setFormError("");
    setSelectedActivityId("");
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
    <div className="activity-today-page primary-page">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="breadcrumb-brand-link">
              CampusLog
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>오늘의 기록</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="activity-today-header primary-page-heading">
        <div>
          <div className="activity-today-title-row">
            <h1>오늘의 기록</h1>
            <p className="activity-section-kicker">
              {formatDateKey(today, {
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>
          <p className="primary-page-description">
            하루하루 해낸 일을 기록하세요. 쌓인 기록은 하나의 경험이
            됩니다.
          </p>
        </div>
      </header>

      {loadError ? (
        <div className="activity-inline-alert" role="alert">
          <p>{loadError}</p>
          <RippleButton type="button" onClick={loadDashboardData}>
            다시 불러오기
            <RippleButtonRipples />
          </RippleButton>
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
            <RippleButton
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
              <RippleButtonRipples />
            </RippleButton>
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
                    className="activity-summary-edit-button"
                    onClick={() => {
                      setActivityActionError("");
                      setActivityActionMessage("");
                      setEditingCompletionActivityId((current) =>
                        current === activity.id ? "" : activity.id,
                      );
                    }}
                    aria-expanded={editingCompletionActivityId === activity.id}
                    aria-label={`${activity.title} 활동 수정`}
                    disabled={isCompletionActivitySaving}
                  >
                    <Edit3 aria-hidden="true" />
                    수정
                  </button>
                  <button
                    type="button"
                    className="activity-summary-delete-button"
                    onClick={() => handleDeleteActivity(activity)}
                    aria-label={`${activity.title} 활동 삭제`}
                    disabled={isCompletionActivitySaving}
                  >
                    <Trash2 aria-hidden="true" />
                    삭제
                  </button>
                </li>
              ))}
            </ul>
            {editingCompletionActivity ? (
              <section
                className="activity-edit-section activity-finishing-edit-section"
                aria-labelledby="activity-finishing-edit-title"
              >
                <div className="activity-edit-heading">
                  <h3 id="activity-finishing-edit-title">
                    완료 경험 정리 전 활동 수정
                  </h3>
                  <p>
                    제목, 내용, 시작일과 종료일을 조정합니다. 이미 쓴
                    날짜별 기록을 벗어나는 기간으로는 바꿀 수 없습니다.
                  </p>
                </div>
                <ActivityCreateForm
                  key={editingCompletionActivity.id}
                  activityId={editingCompletionActivity.id}
                  allowEndDateUndecided={false}
                  endDateLabel="종료일"
                  initialValue={{
                    title: editingCompletionActivity.title,
                    description: editingCompletionActivity.description,
                    startDate: editingCompletionActivity.startDate,
                    expectedEndDate:
                      editingCompletionActivity.completedAt ||
                      editingCompletionActivity.expectedEndDate,
                  }}
                  onCancel={() => setEditingCompletionActivityId("")}
                  onSaved={handleCompletionActivitySaved}
                  onSavingChange={setIsCompletionActivitySaving}
                  submitLabel="수정 저장"
                  variant="expanded"
                />
              </section>
            ) : null}
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
          className="activity-day-records activity-calendar-event-panel"
          aria-labelledby="day-records-title"
        >
          <header className="activity-calendar-event-header">
            <div>
              <p className="activity-section-kicker">
                {formatDateKey(selectedDate, {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
              </p>
              <h2 id="day-records-title">날짜별 기록</h2>
            </div>
            <RippleButton
              ref={recordTriggerRef}
              type="button"
              className="activity-add-record-button"
              onClick={(event) => {
                if (quickRecordMode === "needs-activity") {
                  openActivityRequiredNotice(event.currentTarget);
                  return;
                }

                openRecordPanel(event.currentTarget);
              }}
              disabled={quickRecordMode === "date-unavailable"}
              aria-label={
                quickRecordMode === "needs-activity"
                  ? "기록할 진행 활동 추가"
                  : `${formatDateKey(selectedDate, {
                      month: "long",
                      day: "numeric",
                    })} 기록 추가`
              }
              aria-haspopup="dialog"
              aria-expanded={
                quickRecordMode === "needs-activity"
                  ? isActivityRequiredNoticeOpen
                  : isRecordPanelOpen && !editingLog
              }
              aria-controls={
                quickRecordMode === "needs-activity"
                  ? activityRequiredPanelId
                  : recordPanelId
              }
              title={
                quickRecordMode === "date-unavailable"
                  ? "이 날짜에는 기록할 수 있는 진행 활동이 없습니다."
                  : quickRecordMode === "needs-activity"
                    ? "진행 활동 추가"
                    : "기록 추가"
              }
            >
              <Plus aria-hidden="true" />
              <RippleButtonRipples />
            </RippleButton>
          </header>

          {statusMessage ? (
            <p
              className="activity-form-success activity-records-feedback"
              role="status"
            >
              {statusMessage}
            </p>
          ) : null}
          {recordsActionError ? (
            <p
              className="activity-form-error activity-records-feedback"
              role="alert"
            >
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
            <ol className="activity-event-list">
              {selectedLogs.map((log) => {
                const activity = activitiesById[log.activityId];
                const canEdit = activity?.status === "active";

                return (
                  <li
                    key={log.id}
                    data-editing={editingLog?.id === log.id || undefined}
                  >
                    <div className="activity-event-accent" aria-hidden="true" />
                    <div className="activity-event-content">
                      <div className="activity-event-meta">
                        <Link href={`/activities/${log.activityId}`}>
                          {activity?.title ?? "연결된 활동"}
                        </Link>
                      </div>
                      <p className="activity-event-preview">{log.content}</p>
                    </div>
                    {canEdit ? (
                      <div className="activity-event-actions">
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
            <div className="activity-event-empty">
              <p>
                {quickRecordMode === "date-unavailable"
                  ? "이 날짜에 기록할 수 있는 진행 활동이 없습니다."
                  : quickRecordMode === "needs-activity"
                    ? "날짜별 기록을 시작하려면 먼저 진행 활동을 추가해 주세요."
                    : "이 날짜에 남긴 기록이 없습니다."}
              </p>
              {quickRecordMode === "needs-activity" ? (
                <RippleButton
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
                  <RippleButtonRipples />
                </RippleButton>
              ) : selectedDate !== today ? (
                <RippleButton
                  type="button"
                  className="activity-record-empty-action"
                  onClick={() => handleSelectDate(today)}
                >
                  오늘로 돌아가기
                  <RippleButtonRipples />
                </RippleButton>
              ) : null}
            </div>
          )}

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
            title={editingLog ? "한 일 수정하기" : "한 일 남기기"}
            closeLabel="오늘 한 일 기록 패널 닫기"
            dismissible={!isSaving}
            description={formatDateKey(selectedDate, {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
            className="activity-floating-record-panel"
            positioning="viewport-center"
            preferredWidth={520}
          >
            <form
              onSubmit={handleSubmit}
              className="activity-record-form activity-floating-record-form"
              noValidate
              aria-busy={isSaving}
            >
              <div className="activity-floating-record-fields">
                <Field
                  className="activity-combobox-field"
                  aria-invalid={hasActivitySelectionError || undefined}
                  aria-describedby={
                    hasActivitySelectionError
                      ? `${recordPanelId}-error`
                      : undefined
                  }
                >
                  <label id={`${recordPanelId}-activity-label`}>
                    무슨 활동에서 한 일인가요?
                  </label>
                  <Combobox
                    items={activityComboboxOptions}
                    value={selectedActivityOption}
                    inputValue={selectedActivityOption?.label ?? ""}
                    onInputValueChange={() => undefined}
                    onValueChange={(activity) =>
                      setSelectedActivityId(activity?.value ?? "")
                    }
                  >
                    <ComboboxInput
                      ref={activityComboboxRef}
                      placeholder="활동을 선택하세요"
                      triggerAriaLabel="활동 목록 열기"
                      readOnly
                      aria-labelledby={`${recordPanelId}-activity-label`}
                      aria-invalid={hasActivitySelectionError || undefined}
                      aria-describedby={
                        hasActivitySelectionError
                          ? `${recordPanelId}-error`
                          : undefined
                      }
                      disabled={isSaving}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>일치하는 활동이 없습니다.</ComboboxEmpty>
                      <ComboboxList>
                        {(activity: ActivityComboboxOption) => (
                          <ComboboxItem
                            key={activity.value}
                            value={activity}
                          >
                            {activity.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>

                <label className="activity-textarea-field">
                  <span>어떤 일을 하셨나요?</span>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={5}
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
                <RippleButton
                  type="button"
                  className="activity-secondary-button"
                  onClick={cancelRecordPanel}
                  disabled={isSaving}
                >
                  작성 취소
                  <RippleButtonRipples />
                </RippleButton>
                <RippleButton
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
                  <RippleButtonRipples />
                </RippleButton>
              </div>
            </form>
          </FloatingPanel>

          <FloatingPanel
            open={isActivityRequiredNoticeOpen}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                closeActivityRequiredNotice();
              }
            }}
            anchorElement={recordPanelAnchor}
            returnFocusRef={recordReturnFocusRef}
            initialFocusRef={activityRequiredActionRef}
            id={activityRequiredPanelId}
            title="진행 중인 활동이 필요해요"
            closeLabel="진행 활동 필요 안내 닫기"
            description="날짜별 기록은 진행 중인 활동과 연결해 저장합니다."
            className="activity-required-notice-panel"
            positioning="viewport-center"
          >
            <div className="activity-required-notice">
              <p>
                먼저 진행 중인 활동을 추가해 주세요. 활동을 만든 뒤 선택한
                날짜의 기록을 남길 수 있습니다.
              </p>
              <div className="activity-required-notice-actions">
                <RippleButton
                  type="button"
                  className="activity-secondary-button"
                  onClick={closeActivityRequiredNotice}
                >
                  나중에
                  <RippleButtonRipples />
                </RippleButton>
                <RippleButton
                  ref={activityRequiredActionRef}
                  type="button"
                  className="activity-primary-button"
                  onClick={() => {
                    const trigger = recordTriggerRef.current;

                    closeActivityRequiredNotice();
                    if (trigger) {
                      openActivityCreateScreen(trigger);
                    }
                  }}
                >
                  <Plus aria-hidden="true" />
                  활동 추가
                  <RippleButtonRipples />
                </RippleButton>
              </div>
            </div>
          </FloatingPanel>
        </section>
      </div>

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
