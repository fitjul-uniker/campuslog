import type { TrackedActivity } from "@/lib/types";

export const ACTIVITY_PLANNING_WINDOW_MONTHS = 12;

function parseDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);

  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }

  return date;
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeCompletedDateKey(completedAt: string): string {
  if (parseDateKey(completedAt)) {
    return completedAt;
  }

  const completedTimestamp = new Date(completedAt);

  return Number.isNaN(completedTimestamp.getTime())
    ? completedAt.slice(0, 10)
    : formatDateKey(completedTimestamp);
}

export function getActivityPlanningHorizonDateKey(todayKey: string): string {
  const today = parseDateKey(todayKey);

  if (!today) {
    return todayKey;
  }

  const targetYear = today.getFullYear() + 1;
  const targetMonth = today.getMonth();
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  return formatDateKey(
    new Date(
      targetYear,
      targetMonth,
      Math.min(today.getDate(), lastDayOfTargetMonth),
    ),
  );
}

export function isActivityRecordableOnDate(
  activity: TrackedActivity,
  dateKey: string,
  todayKey: string,
): boolean {
  if (
    !parseDateKey(dateKey) ||
    dateKey < activity.startDate ||
    dateKey > getActivityPlanningHorizonDateKey(todayKey)
  ) {
    return false;
  }

  if (activity.status === "completed") {
    if (dateKey >= todayKey) {
      return false;
    }

    const completedDate = activity.completedAt
      ? normalizeCompletedDateKey(activity.completedAt)
      : activity.expectedEndDate;

    return Boolean(completedDate) && dateKey <= completedDate;
  }

  if (activity.status === "planned" && dateKey <= todayKey) {
    return false;
  }

  return !activity.expectedEndDate || dateKey <= activity.expectedEndDate;
}
