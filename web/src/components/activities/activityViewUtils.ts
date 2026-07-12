import type { ActivityStatus, TrackedActivity } from "@/lib/types";

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  planned: "시작 예정",
  active: "진행 중",
  completed: "종료",
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateKey: string): Date | null {
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

export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  const date = parseLocalDate(dateKey);

  if (!date) {
    return "날짜 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", options).format(date);
}

function normalizeCompletedDateKey(completedAt: string): string {
  if (parseLocalDate(completedAt)) {
    return completedAt;
  }

  const completedTimestamp = new Date(completedAt);

  return Number.isNaN(completedTimestamp.getTime())
    ? completedAt.slice(0, 10)
    : getLocalDateKey(completedTimestamp);
}

export function getActivityDateRange(activity: TrackedActivity): string {
  const start = formatDateKey(activity.startDate);

  if (activity.completedAt) {
    const completedDate = normalizeCompletedDateKey(activity.completedAt);
    return `${start} – ${formatDateKey(completedDate)}`;
  }

  if (activity.expectedEndDate) {
    return `${start} – ${formatDateKey(activity.expectedEndDate)} 예정`;
  }

  return `${start}부터`;
}

export function createExperiencePeriod(
  startDate: string,
  completedAt: string,
): string {
  const startMonth = startDate.slice(0, 7).replace("-", ".");
  const completedDate = normalizeCompletedDateKey(completedAt);
  const endMonth = completedDate.slice(0, 7).replace("-", ".");

  if (!startMonth || !endMonth) {
    return "";
  }

  return startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
}
