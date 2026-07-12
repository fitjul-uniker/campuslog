"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useMemo, useState } from "react";

import { getLocalDateKey, parseLocalDate } from "@/components/activities/activityViewUtils";
import type { DailyLog } from "@/lib/types";

type ActivityCalendarProps = {
  logs: DailyLog[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

type CalendarCell = {
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function createMonthAnchor(dateKey: string): Date {
  const selectedDate = parseLocalDate(dateKey) ?? new Date();
  return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
}

function formatDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function createCalendarCells(monthAnchor: Date): CalendarCell[] {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const dayOffset = index - firstWeekday + 1;

    if (dayOffset < 1) {
      const day = previousMonthDays + dayOffset;
      const previousDate = new Date(year, month - 1, day);
      return {
        dateKey: formatDateKey(
          previousDate.getFullYear(),
          previousDate.getMonth(),
          previousDate.getDate(),
        ),
        day,
        isCurrentMonth: false,
      };
    }

    if (dayOffset > daysInMonth) {
      const day = dayOffset - daysInMonth;
      const nextDate = new Date(year, month + 1, day);
      return {
        dateKey: formatDateKey(
          nextDate.getFullYear(),
          nextDate.getMonth(),
          nextDate.getDate(),
        ),
        day,
        isCurrentMonth: false,
      };
    }

    return {
      dateKey: formatDateKey(year, month, dayOffset),
      day: dayOffset,
      isCurrentMonth: true,
    };
  });
}

export function ActivityCalendar({
  logs,
  selectedDate,
  onSelectDate,
}: ActivityCalendarProps) {
  const [monthAnchor, setMonthAnchor] = useState(() =>
    createMonthAnchor(selectedDate),
  );
  const today = getLocalDateKey();

  const countsByDate = useMemo(
    () =>
      logs.reduce<Record<string, number>>((counts, log) => {
        counts[log.date] = (counts[log.date] ?? 0) + 1;
        return counts;
      }, {}),
    [logs],
  );
  const cells = useMemo(() => createCalendarCells(monthAnchor), [monthAnchor]);
  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(monthAnchor);
  const nextMonth = new Date(
    monthAnchor.getFullYear(),
    monthAnchor.getMonth() + 1,
    1,
  );
  const nextMonthStart = formatDateKey(
    nextMonth.getFullYear(),
    nextMonth.getMonth(),
    1,
  );

  function moveMonth(offset: number) {
    setMonthAnchor(
      new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + offset, 1),
    );
  }

  function handleDateKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    dateKey: string,
  ) {
    const dayOffsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const offset = dayOffsets[event.key];

    if (!offset) {
      return;
    }

    const currentDate = parseLocalDate(dateKey);

    if (!currentDate) {
      return;
    }

    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + offset,
    );
    const targetDateKey = formatDateKey(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );

    if (targetDateKey > today) {
      return;
    }

    event.preventDefault();
    setMonthAnchor(
      new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
    );
    onSelectDate(targetDateKey);
    window.setTimeout(() => {
      document
        .querySelector<HTMLButtonElement>(
          `[data-calendar-date="${targetDateKey}"]`,
        )
        ?.focus();
    }, 0);
  }

  return (
    <section className="activity-calendar" aria-labelledby="activity-calendar-title">
      <header className="activity-calendar-header">
        <div>
          <p className="activity-section-kicker">월간 기록</p>
          <h2 id="activity-calendar-title">{monthLabel}</h2>
        </div>
        <div className="activity-calendar-navigation">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="이전 달 보기"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMonthAnchor(createMonthAnchor(today));
              onSelectDate(today);
            }}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            disabled={nextMonthStart > today}
            aria-label="다음 달 보기"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="activity-calendar-grid" role="group" aria-label={`${monthLabel} 달력`}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="activity-calendar-weekday" aria-hidden="true">
            {label}
          </span>
        ))}

        {cells.map((cell) => {
          const count = countsByDate[cell.dateKey] ?? 0;
          const isFuture = cell.dateKey > today;
          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === today;

          return (
            <button
              key={cell.dateKey}
              type="button"
              className="activity-calendar-day"
              data-outside-month={cell.isCurrentMonth ? undefined : "true"}
              data-has-records={count > 0 ? "true" : undefined}
              data-calendar-date={cell.dateKey}
              disabled={isFuture}
              aria-label={`${cell.dateKey}${count > 0 ? `, 기록 ${count}개` : ", 기록 없음"}`}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              onClick={() => {
                if (!cell.isCurrentMonth) {
                  setMonthAnchor(createMonthAnchor(cell.dateKey));
                }
                onSelectDate(cell.dateKey);
              }}
              onKeyDown={(event) => handleDateKeyDown(event, cell.dateKey)}
            >
              <span className="activity-calendar-day-number">{cell.day}</span>
              {count > 0 ? (
                <span className="activity-calendar-count" aria-hidden="true">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
