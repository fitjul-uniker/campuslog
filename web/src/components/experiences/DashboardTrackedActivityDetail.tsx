"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, NotebookPen, Trash2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  ACTIVITY_DISPLAY_STATE_LABELS,
  formatDateKey,
  getActivityDateRange,
  getTrackedActivityDisplayState,
} from "@/components/activities/activityViewUtils";
import {
  DASHBOARD_EXPERIENCE_DETAIL_ID,
} from "@/components/experiences/DashboardExperienceDetail";
import type { DailyLog, TrackedActivity } from "@/lib/types";

type DashboardTrackedActivityDetailProps = {
  activity: TrackedActivity;
  logs: DailyLog[];
  onClose: () => void;
  onDelete: (activity: TrackedActivity, logCount: number) => void;
};

export function DashboardTrackedActivityDetail({
  activity,
  logs,
  onClose,
  onDelete,
}: DashboardTrackedActivityDetailProps) {
  const shouldReduceMotion = useReducedMotion();
  const titleId = `${DASHBOARD_EXPERIENCE_DETAIL_ID}-title`;
  const recordedDayCount = new Set(logs.map((log) => log.date)).size;
  const latestLog = logs[0] ?? null;
  const displayState = getTrackedActivityDisplayState(activity);
  const isCompletionDue = displayState === "completion_due";

  return (
    <motion.section
      layout
      id={DASHBOARD_EXPERIENCE_DETAIL_ID}
      className="dashboard-experience-detail dashboard-tracked-activity-detail"
      aria-labelledby={titleId}
      role="complementary"
      data-activity-status={displayState}
      initial={
        shouldReduceMotion ? false : { opacity: 0, x: 24, scale: 0.985 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={
        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.99 }
      }
      transition={{
        duration: shouldReduceMotion ? 0.12 : 0.26,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="dashboard-detail-header">
        <div>
          <div className="dashboard-detail-status">
            <span className="dashboard-detail-progress-badge">
              {ACTIVITY_DISPLAY_STATE_LABELS[displayState]}
            </span>
          </div>
          <h2 id={titleId}>{activity.title}</h2>
        </div>
        <button
          className="dashboard-detail-close"
          type="button"
          onClick={onClose}
          aria-label="활동 상세 닫기"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <dl className="dashboard-detail-meta">
        <div>
          <dt>활동 기간</dt>
          <dd>{getActivityDateRange(activity)}</dd>
        </div>
        <div>
          <dt>내용</dt>
          <dd>{activity.description}</dd>
        </div>
      </dl>

      <div className="dashboard-detail-content">
        <section>
          <h3>현재 상태</h3>
          {isCompletionDue ? (
            <p>
              예상 종료일이 지났습니다. 실제 종료 여부를 확인하거나 활동
              기간을 수정해 주세요.
            </p>
          ) : (
            <p>
              이 활동은 현재 진행 중입니다. 오늘 한 일을 기록하며 활동 내용을
              계속 쌓을 수 있습니다.
            </p>
          )}
        </section>

        <section>
          <h3>기록 현황</h3>
          <div className="dashboard-tracked-log-stats">
            <span>
              <CalendarDays aria-hidden="true" />
              기록된 날 <strong>{recordedDayCount}일</strong>
            </span>
            <span>
              <NotebookPen aria-hidden="true" />
              누적 기록 <strong>{logs.length}개</strong>
            </span>
          </div>
        </section>

        <section>
          <h3>최근 기록</h3>
          {latestLog ? (
            <div className="dashboard-tracked-latest-log">
              <time dateTime={latestLog.date}>
                {formatDateKey(latestLog.date)}
              </time>
              <p>{latestLog.content}</p>
            </div>
          ) : (
            <p className="is-muted">
              아직 쌓인 기록이 없습니다. 오늘 한 일을 첫 기록으로 남겨 보세요.
            </p>
          )}
        </section>
      </div>

      <div className="dashboard-detail-actions">
        <button
          type="button"
          className="dashboard-detail-action"
          onClick={() => onDelete(activity, logs.length)}
        >
          활동 삭제
          <Trash2 aria-hidden="true" />
        </button>
        <Link
          href={`/activities/${activity.id}`}
          className="dashboard-detail-action dashboard-detail-action-primary"
        >
          {isCompletionDue ? "활동 종료 확인하기" : "진행 중 활동 보기"}
          <ArrowRight aria-hidden="true" />
        </Link>
        {!isCompletionDue ? (
          <Link
            href={`/dashboard?activityId=${encodeURIComponent(activity.id)}#quick-record-title`}
            className="dashboard-detail-action"
          >
            오늘 한 일 기록하기
          </Link>
        ) : null}
      </div>
    </motion.section>
  );
}
