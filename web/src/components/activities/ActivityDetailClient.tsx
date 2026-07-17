"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LoaderCircle,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ACTIVITY_STATUS_LABELS,
  createExperiencePeriod,
  formatDateKey,
  getActivityDateRange,
  getLocalDateKey,
} from "@/components/activities/activityViewUtils";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { requestActivitySynthesis } from "@/lib/activitySynthesisApi";
import { ACTIVITY_SYNTHESIS_LIMITS } from "@/lib/activitySynthesisLimits";
import {
  getCampusLogRepository,
} from "@/lib/repositories/campuslogRepository";
import type {
  DailyLog,
  ExperienceSynthesisDraft,
  TrackedActivity,
} from "@/lib/types";

type ActivityDetailClientProps = {
  id: string;
};

function sortTimelineLogs(logs: DailyLog[]): DailyLog[] {
  return [...logs].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function getSynthesisStatusLabel(activity: TrackedActivity): string {
  if (activity.generatedExperienceId || activity.synthesisStatus === "saved") {
    return "나의 활동에 저장됨";
  }

  switch (activity.synthesisStatus) {
    case "processing":
      return "AI가 정리하는 중";
    case "draft_ready":
      return "검토할 초안 있음";
    case "failed":
      return "AI 정리 재시도 필요";
    default:
      return "AI 정리 전";
  }
}

function createActivityDeleteConfirmMessage(
  activity: TrackedActivity,
  logCount: number,
  hasDraft: boolean,
): string {
  const deleteTargets = [
    `활동 "${activity.title}"`,
    logCount > 0 ? `연결된 날짜별 기록 ${logCount}개` : "",
    hasDraft ? "AI 정리 초안" : "",
    activity.generatedExperienceId
      ? "이 활동에서 저장한 나의 활동과 연결된 AI 분석/추천/초안/보완 답변"
      : "",
  ].filter(Boolean);

  return `${deleteTargets.join(", ")}을 함께 삭제할까요? 삭제한 데이터는 복구할 수 없습니다.`;
}

export function ActivityDetailClient({ id }: ActivityDetailClientProps) {
  const router = useRouter();
  const [activity, setActivity] = useState<TrackedActivity | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [draft, setDraft] = useState<ExperienceSynthesisDraft | null>(null);
  const [draftDescription, setDraftDescription] = useState("");
  const [draftAchievements, setDraftAchievements] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [error, setError] = useState("");
  const endActivityButtonRef = useRef<HTMLButtonElement>(null);
  const endConfirmationRef = useRef<HTMLElement>(null);

  const loadActivity = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const repository = getCampusLogRepository();
      const [storedActivity, storedLogs, storedDraft] = await Promise.all([
        repository.trackedActivities.getById(id),
        repository.dailyLogs.listByActivityId(id),
        repository.synthesisDrafts.getByActivityId(id),
      ]);

      setActivity(storedActivity);
      setLogs(sortTimelineLogs(storedLogs));
      setDraft(storedDraft);
      setDraftDescription(storedDraft?.description ?? "");
      setDraftAchievements(storedDraft?.achievements.join("\n") ?? "");
    } catch {
      setActivity(null);
      setLogs([]);
      setDraft(null);
      setError(
        "활동 정보를 불러오지 못했습니다. 계정 데이터는 지우지 않았으니 다시 시도해 주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (!showEndConfirmation) {
      return;
    }

    window.requestAnimationFrame(() => endConfirmationRef.current?.focus());

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setShowEndConfirmation(false);
      window.requestAnimationFrame(() => endActivityButtonRef.current?.focus());
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showEndConfirmation]);

  const usedLogs = useMemo(() => {
    if (!draft) {
      return [];
    }

    const usedLogIdSet = new Set(draft.usedLogIds);
    return logs.filter((log) => usedLogIdSet.has(log.id));
  }, [draft, logs]);

  async function handleActivate() {
    setError("");
    const repository = getCampusLogRepository();
    const updatedActivity = await repository.trackedActivities.setStatus(
      id,
      "active",
    );

    if (!updatedActivity) {
      setError("활동을 시작 상태로 변경하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    setActivity(updatedActivity);
  }

  async function runSynthesis(sourceActivity: TrackedActivity) {
    if (logs.length === 0) {
      setError(
        "AI가 정리할 실제 기록이 없습니다. 활동을 종료하기 전에 한 일을 한 건 이상 남겨 주세요.",
      );
      return;
    }

    const totalContentLength = logs.reduce(
      (total, log) => total + log.content.length,
      0,
    );

    if (
      logs.length > ACTIVITY_SYNTHESIS_LIMITS.maxDailyLogCount ||
      totalContentLength >
        ACTIVITY_SYNTHESIS_LIMITS.maxTotalDailyLogContentLength
    ) {
      setError(
        "기록 분량이 한 번에 정리할 수 있는 범위를 넘었습니다. 활동을 기간별로 나누거나 중복 기록을 정리한 뒤 다시 시도해 주세요.",
      );
      return;
    }

    setError("");
    setIsSynthesizing(true);
    const repository = getCampusLogRepository();
    const processingActivity = await repository.trackedActivities.setSynthesisStatus(
      sourceActivity.id,
      "processing",
    );

    if (!processingActivity) {
      setIsSynthesizing(false);
      setError("AI 정리 상태를 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    setActivity(processingActivity);
    const response = await requestActivitySynthesis(processingActivity, logs);

    if (!response.ok) {
      const failedActivity = await repository.trackedActivities.setSynthesisStatus(
        processingActivity.id,
        "failed",
      );
      setActivity(failedActivity ?? processingActivity);
      setIsSynthesizing(false);
      setError(response.error.message);
      return;
    }

    const nextDraft: ExperienceSynthesisDraft = {
      activityId: processingActivity.id,
      ...response.synthesis,
      generatedAt: new Date().toISOString(),
    };
    const savedDraft = await repository.synthesisDrafts.save(nextDraft);

    if (!savedDraft) {
      const failedActivity = await repository.trackedActivities.setSynthesisStatus(
        processingActivity.id,
        "failed",
      );
      setActivity(failedActivity ?? processingActivity);
      setIsSynthesizing(false);
      setError(
        "AI 초안을 계정에 저장하지 못했습니다. 활동과 일일 기록은 그대로 보존되어 있습니다.",
      );
      return;
    }

    const readyActivity = await repository.trackedActivities.setSynthesisStatus(
      processingActivity.id,
      "draft_ready",
    );
    setActivity(readyActivity ?? processingActivity);
    setDraft(savedDraft);
    setDraftDescription(savedDraft.description);
    setDraftAchievements(savedDraft.achievements.join("\n"));
    setIsSynthesizing(false);
  }

  async function handleConfirmEnd() {
    if (!activity) {
      return;
    }

    if (logs.length === 0) {
      closeEndConfirmation();
      setError(
        "아직 연결된 기록이 없습니다. 오늘의 기록에서 실제로 한 일을 먼저 남겨 주세요.",
      );
      return;
    }

    const repository = getCampusLogRepository();
    const completedAt = activity.expectedEndDate || new Date().toISOString();
    const completedActivity = await repository.trackedActivities.setStatus(
      activity.id,
      "completed",
      completedAt,
    );

    if (!completedActivity) {
      closeEndConfirmation();
      setError("활동 종료 상태를 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    setActivity(completedActivity);
    setShowEndConfirmation(false);
    if (completedActivity.completedAt > getLocalDateKey()) {
      setError(
        "활동 종료일을 유지했습니다. AI 정리는 종료일 이후 다시 시도할 수 있습니다.",
      );
      return;
    }

    await runSynthesis(completedActivity);
  }

  function closeEndConfirmation() {
    setShowEndConfirmation(false);
    window.requestAnimationFrame(() => endActivityButtonRef.current?.focus());
  }

  async function handleRetrySynthesis() {
    if (!activity || isSynthesizing) {
      return;
    }

    await runSynthesis(activity);
  }

  async function handleReopenActivity() {
    if (!activity) {
      return;
    }

    setError("");
    const repository = getCampusLogRepository();
    const reopenedActivity = await repository.trackedActivities.setStatus(
      activity.id,
      "active",
    );

    if (!reopenedActivity) {
      setError("활동을 다시 열지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setActivity(reopenedActivity);
    setDraft(null);
    setDraftDescription("");
    setDraftAchievements("");
  }

  async function handleDeleteActivity() {
    if (
      !activity ||
      !window.confirm(
        createActivityDeleteConfirmMessage(activity, logs.length, Boolean(draft)),
      )
    ) {
      return;
    }

    setError("");
    const repository = getCampusLogRepository();
    let didDelete = false;

    try {
      didDelete = await repository.trackedActivities.delete(activity.id);
    } catch {
      didDelete = false;
    }

    if (!didDelete) {
      setError("활동을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    router.push("/dashboard");
  }

  async function handleSaveExperience() {
    if (!activity || !draft) {
      return;
    }

    if (activity.generatedExperienceId) {
      router.push(`/experiences/${activity.generatedExperienceId}`);
      return;
    }

    const description = draftDescription.trim();
    const achievements = draftAchievements
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!description) {
      setError("나의 활동에 저장할 활동 내용을 입력해 주세요.");
      return;
    }

    const period = createExperiencePeriod(
      activity.startDate,
      activity.completedAt,
    );

    if (!period) {
      setError("활동 기간을 만들 수 없습니다. 종료일을 확인해 주세요.");
      return;
    }

    setError("");
    setIsSavingExperience(true);
    const repository = getCampusLogRepository();

    const editedDraft = await repository.synthesisDrafts.save({
      ...draft,
      description,
      achievements,
    });

    if (!editedDraft) {
      setIsSavingExperience(false);
      setError("수정한 AI 초안을 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    const newExperience = await repository.experiences.createFromActivity(activity.id, {
      title: activity.title,
      role: "활동 참여",
      period,
      description,
      achievements: achievements.join("\n"),
      relatedLinks: [],
    });

    if (!newExperience) {
      setIsSavingExperience(false);
      setError("나의 활동에 저장하지 못했습니다. 초안은 그대로 보존됩니다.");
      return;
    }

    setActivity((await repository.trackedActivities.getById(activity.id)) ?? activity);
    await repository.synthesisDrafts.delete(activity.id);
    router.push(`/experiences/${newExperience.id}`);
  }

  if (isLoading) {
    return (
      <div className="activity-detail-page activity-page-loading" aria-busy="true">
        <span className="sr-only">진행 활동을 불러오는 중입니다.</span>
        <div />
        <div />
        <div />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="activity-detail-page">
        <Link href="/dashboard" className="activity-back-link">
          <ArrowLeft aria-hidden="true" />
          오늘의 기록
        </Link>
        <section className="activity-not-found">
          <AlertCircle aria-hidden="true" />
          <h1>활동을 찾을 수 없습니다</h1>
          <p>{error || "삭제되었거나 올바르지 않은 활동 주소입니다."}</p>
          <RippleButton
            type="button"
            onClick={loadActivity}
            className="activity-secondary-button"
          >
            다시 불러오기
            <RippleButtonRipples />
          </RippleButton>
        </section>
      </div>
    );
  }

  const isCompleted = activity.status === "completed";
  const canActivate = activity.startDate <= getLocalDateKey();
  const canShowRetry =
    isCompleted &&
    !draft &&
    !activity.generatedExperienceId &&
    !isSynthesizing;

  return (
    <div className="activity-detail-page">
      <Link href="/dashboard" className="activity-back-link">
        <ArrowLeft aria-hidden="true" />
        오늘의 기록
      </Link>

      <header className="activity-detail-hero">
        <div className="activity-detail-heading">
          <div className="activity-status-row">
            <span className={`activity-status-badge is-${activity.status}`}>
              {ACTIVITY_STATUS_LABELS[activity.status]}
            </span>
            {isCompleted ? (
              <span className="activity-synthesis-label">
                <Sparkles aria-hidden="true" />
                {getSynthesisStatusLabel(activity)}
              </span>
            ) : null}
          </div>
          <h1>{activity.title}</h1>
          <p>{activity.description}</p>
        </div>

        <div className="activity-detail-primary-actions">
          <button
            type="button"
            onClick={handleDeleteActivity}
            className="activity-secondary-button"
            disabled={isSynthesizing || isSavingExperience}
          >
            <Trash2 aria-hidden="true" />
            활동 삭제
          </button>
          {activity.status === "planned" ? (
              <RippleButton
                type="button"
                onClick={handleActivate}
                className="activity-primary-button"
                disabled={!canActivate}
                title={
                  canActivate
                    ? undefined
                    : `${formatDateKey(activity.startDate)}부터 시작할 수 있습니다.`
                }
              >
                <Play aria-hidden="true" />
                {canActivate
                  ? "활동 시작"
                  : `${formatDateKey(activity.startDate, {
                      month: "long",
                      day: "numeric",
                  })}부터 시작`}
                <RippleButtonRipples />
              </RippleButton>
          ) : null}
          {activity.status === "active" ? (
            <>
              <Link
                href={`/dashboard?activityId=${encodeURIComponent(activity.id)}#quick-record-title`}
                className="activity-secondary-button"
              >
                오늘 한 일 기록하기
              </Link>
              <RippleButton
                ref={endActivityButtonRef}
                type="button"
                onClick={() => {
                  setError("");
                  setShowEndConfirmation(true);
                }}
                className="activity-primary-button"
              >
                <FileCheck2 aria-hidden="true" />
                활동 종료
                <RippleButtonRipples />
              </RippleButton>
            </>
          ) : null}
          {activity.status === "completed" ? (
            <RippleButton
              type="button"
              onClick={handleReopenActivity}
              className="activity-primary-button"
              disabled={isSynthesizing || isSavingExperience}
            >
              <Play aria-hidden="true" />
              활동 다시 시작
              <RippleButtonRipples />
            </RippleButton>
          ) : null}
          {activity.generatedExperienceId ? (
            <Link
              href={`/experiences/${activity.generatedExperienceId}`}
              className="activity-primary-button"
            >
              나의 활동에서 보기
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      <dl className="activity-detail-meta">
        <div>
          <dt>활동 기간</dt>
          <dd>{getActivityDateRange(activity)}</dd>
        </div>
        <div>
          <dt>기록된 날</dt>
          <dd>{new Set(logs.map((log) => log.date)).size}일</dd>
        </div>
        <div>
          <dt>쌓인 기록</dt>
          <dd>{logs.length}개</dd>
        </div>
      </dl>

      {showEndConfirmation ? (
        <section
          ref={endConfirmationRef}
          className="activity-end-confirmation"
          role="region"
          tabIndex={-1}
          aria-labelledby="end-activity-title"
          aria-describedby="end-activity-description"
        >
          <button
            type="button"
            className="activity-icon-button"
            onClick={closeEndConfirmation}
            aria-label="활동 종료 확인 닫기"
          >
            <X aria-hidden="true" />
          </button>
          <div className="activity-confirmation-icon">
            <Sparkles aria-hidden="true" />
          </div>
          <div>
            <h2 id="end-activity-title">이 활동을 종료할까요?</h2>
            <p id="end-activity-description">
              연결된 기록 {logs.length}개를 AI가 검토해 활동 정리 초안을 만듭니다.
              초안은 바로 저장되지 않으며 먼저 직접 확인하고 수정할 수 있습니다.
            </p>
            <div className="activity-confirmation-actions">
              <button
                type="button"
                onClick={closeEndConfirmation}
                className="activity-secondary-button"
              >
                계속 기록하기
              </button>
              <RippleButton
                type="button"
                onClick={handleConfirmEnd}
                className="activity-primary-button"
              >
                종료하고 AI 초안 만들기
                <RippleButtonRipples />
              </RippleButton>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="activity-inline-alert" role="alert">
          <AlertCircle aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}

      {isSynthesizing ? (
        <section className="activity-synthesis-loading" aria-live="polite" aria-busy="true">
          <span>
            <LoaderCircle aria-hidden="true" />
          </span>
          <div>
            <p className="activity-section-kicker">AI 경험 합성</p>
            <h2>날짜별 기록을 하나의 경험으로 정리하고 있어요</h2>
            <p>기록에 없는 사실은 만들지 않고, 실제로 남긴 내용만 검토합니다.</p>
          </div>
        </section>
      ) : null}

      {canShowRetry ? (
        <section className="activity-synthesis-retry">
          <div>
            <Bot aria-hidden="true" />
            <div>
              <h2>AI 경험 초안이 아직 없습니다</h2>
              <p>
                활동과 날짜별 기록은 그대로 보존되어 있습니다. 같은 기록으로 다시
                정리할 수 있어요.
              </p>
            </div>
          </div>
          <div className="activity-synthesis-retry-actions">
            <RippleButton
              type="button"
              onClick={handleRetrySynthesis}
              className="activity-primary-button"
            >
              <RotateCcw aria-hidden="true" />
              AI 정리 다시 시도
              <RippleButtonRipples />
            </RippleButton>
          </div>
        </section>
      ) : null}

      {draft && !activity.generatedExperienceId ? (
        <section className="activity-synthesis-draft" aria-labelledby="synthesis-draft-title">
          <header>
            <div className="activity-draft-heading">
              <span>
                <Sparkles aria-hidden="true" />
              </span>
              <div>
                <p className="activity-section-kicker">AI가 만든 사실 기반 초안</p>
                <h2 id="synthesis-draft-title">
                  활동 정리를 저장하기 전에 확인해 주세요
                </h2>
              </div>
            </div>
            <RippleButton
              type="button"
              onClick={handleRetrySynthesis}
              className="activity-text-button"
              disabled={isSynthesizing || isSavingExperience}
            >
              <RotateCcw aria-hidden="true" />
              다시 생성
              <RippleButtonRipples />
            </RippleButton>
          </header>

          <div className="activity-draft-fixed-meta">
            <div>
              <span>제목</span>
              <strong>{activity.title}</strong>
            </div>
            <div>
              <span>활동 정보</span>
              <strong>{activity.description}</strong>
            </div>
            <div>
              <span>기간</span>
              <strong>{createExperiencePeriod(activity.startDate, activity.completedAt)}</strong>
            </div>
          </div>

          <label className="activity-textarea-field">
            <span>활동 내용</span>
            <textarea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              rows={8}
              maxLength={8000}
            />
          </label>

          <label className="activity-textarea-field">
            <span>주요 성과</span>
            <textarea
              value={draftAchievements}
              onChange={(event) => setDraftAchievements(event.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="근거가 있는 성과를 한 줄에 하나씩 적어 주세요."
            />
            <small>한 줄에 하나씩 입력합니다. 성과가 확인되지 않으면 비워도 됩니다.</small>
          </label>

          {draft.evidenceGaps.length > 0 ? (
            <aside className="activity-evidence-gaps" aria-labelledby="evidence-gaps-title">
              <AlertCircle aria-hidden="true" />
              <div>
                <h3 id="evidence-gaps-title">기록에서 확인하기 어려운 정보</h3>
                <ul>
                  {draft.evidenceGaps.map((gap, index) => (
                    <li key={`${gap}-${index}`}>{gap}</li>
                  ))}
                </ul>
              </div>
            </aside>
          ) : null}

          <div className="activity-draft-provenance">
            <CheckCircle2 aria-hidden="true" />
            <p>
              전체 {logs.length}개 중 {usedLogs.length}개의 기록을 초안 근거로
              사용했습니다. 저장하면 기존 경험 목록에서 별도 AI 분석을 이어갈 수
              있습니다.
            </p>
          </div>

          <div className="activity-draft-actions">
            <RippleButton
              type="button"
              onClick={handleSaveExperience}
              className="activity-primary-button"
              disabled={isSavingExperience || isSynthesizing}
            >
              <Save aria-hidden="true" />
              {isSavingExperience
                ? "활동 정리 저장 중…"
                : "확인하고 나의 활동에 저장"}
              <RippleButtonRipples />
            </RippleButton>
          </div>
        </section>
      ) : null}

      <section className="activity-timeline" aria-labelledby="activity-timeline-title">
        <header>
          <div>
            <p className="activity-section-kicker">날짜별로 쌓인 근거</p>
            <h2 id="activity-timeline-title">활동 타임라인</h2>
          </div>
          <span>{logs.length}개 기록</span>
        </header>

        {logs.length > 0 ? (
          <ol>
            {logs.map((log) => (
              <li key={log.id}>
                <div className="activity-timeline-date">
                  <CalendarClock aria-hidden="true" />
                  <time dateTime={log.date}>
                    {formatDateKey(log.date, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </time>
                </div>
                <p>{log.content}</p>
                {draft?.usedLogIds.includes(log.id) ? (
                  <span className="activity-used-log-label">
                    <CheckCircle2 aria-hidden="true" />
                    AI 초안에 반영
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <div className="activity-timeline-empty">
            <Clock3 aria-hidden="true" />
            <h3>아직 쌓인 기록이 없습니다</h3>
            <p>오늘의 기록에서 이 활동을 선택하고 실제로 한 일을 남겨보세요.</p>
            {activity.status === "active" ? (
              <Link
                href={`/dashboard?activityId=${encodeURIComponent(activity.id)}#quick-record-title`}
                className="activity-secondary-button"
              >
                오늘 한 일 기록하기
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
