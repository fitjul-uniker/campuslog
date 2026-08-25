"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ACTIVITY_WORKFLOW_STATE_LABELS,
  formatDateKey,
  getTrackedActivityWorkflowState,
  type ActivityWorkflowState,
} from "@/components/activities/activityViewUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TrackedActivity } from "@/lib/types";

type SortKey = "title" | "status" | "startDate" | "endDate";
type SortDirection = "ascending" | "descending";

type ActivityGridRow = {
  activity: TrackedActivity;
  endDate: string;
  status: ActivityWorkflowState;
};

type ActivityOverviewDataGridProps = {
  activities: TrackedActivity[];
  disabled?: boolean;
  editingActivityId?: string;
  onDelete: (activity: TrackedActivity) => void;
  onEdit: (activity: TrackedActivity) => void;
  onTogglePin: (activityId: string) => void | Promise<void>;
  pendingPinIds: ReadonlySet<string>;
  pinnedItems: Readonly<Record<string, string>>;
  today: string;
};

const STATUS_ORDER: Record<ActivityWorkflowState, number> = {
  active: 0,
  planned: 1,
  completion_due: 2,
  completion_required: 3,
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

function getSortValue(row: ActivityGridRow, sortKey: SortKey): string | number {
  switch (sortKey) {
    case "status":
      return STATUS_ORDER[row.status];
    case "startDate":
      return row.activity.startDate;
    case "endDate":
      return row.endDate || "9999-12-31";
    default:
      return row.activity.title.toLocaleLowerCase("ko-KR");
  }
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return <ArrowUpDown aria-hidden="true" />;
  }

  return direction === "ascending" ? (
    <ArrowUp aria-hidden="true" />
  ) : (
    <ArrowDown aria-hidden="true" />
  );
}

export function ActivityOverviewDataGrid({
  activities,
  disabled = false,
  editingActivityId = "",
  onDelete,
  onEdit,
  onTogglePin,
  pendingPinIds,
  pinnedItems,
  today,
}: ActivityOverviewDataGridProps) {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("ascending");

  const rows = useMemo<ActivityGridRow[]>(
    () =>
      activities.flatMap((activity) => {
        const status = getTrackedActivityWorkflowState(activity, today);

        if (!status) {
          return [];
        }

        return [
          {
            activity,
            status,
            endDate:
              activity.status === "completed"
                ? activity.completedAt || activity.expectedEndDate
                : activity.expectedEndDate,
          },
        ];
      }),
    [activities, today],
  );

  const orderedRows = useMemo(() => {
    const direction = sortDirection === "ascending" ? 1 : -1;
    const sortedRows = [...rows].sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue), "ko-KR") * direction;
    });
    return sortedRows.sort((a, b) => {
      const aPinned = pinnedItems[a.activity.id];
      const bPinned = pinnedItems[b.activity.id];

      if (aPinned && bPinned) {
        return bPinned.localeCompare(aPinned);
      }

      if (aPinned) {
        return -1;
      }

      if (bPinned) {
        return 1;
      }

      return 0;
    });
  }, [pinnedItems, rows, sortDirection, sortKey]);

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(orderedRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageRows = orderedRows.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize,
  );
  const rangeStart = orderedRows.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const rangeEnd = Math.min((safePageIndex + 1) * pageSize, orderedRows.length);

  useEffect(() => {
    if (pageIndex !== safePageIndex) {
      setPageIndex(safePageIndex);
    }
  }, [pageIndex, safePageIndex]);

  function toggleSort(nextSortKey: SortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) =>
        current === "ascending" ? "descending" : "ascending",
      );
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("ascending");
  }

  function togglePin(activityId: string) {
    setPageIndex(0);
    void onTogglePin(activityId);
  }

  function openActivity(activityId: string) {
    router.push(`/activities/${activityId}`);
  }

  return (
    <div className="activity-data-grid" data-testid="activity-data-grid">
      {rows.length > 0 ? (
        <div className="activity-data-grid-scroll">
          <table>
            <caption className="sr-only">
              활동별 상태, 시작일과 종료일
            </caption>
            <thead>
              <tr>
                <th className="activity-data-grid-pin-column" scope="col">
                  <span className="sr-only">고정</span>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => toggleSort("title")}>
                    활동
                    <SortIcon
                      active={sortKey === "title"}
                      direction={sortDirection}
                    />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => toggleSort("status")}>
                    상태
                    <SortIcon
                      active={sortKey === "status"}
                      direction={sortDirection}
                    />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => toggleSort("startDate")}>
                    시작일
                    <SortIcon
                      active={sortKey === "startDate"}
                      direction={sortDirection}
                    />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => toggleSort("endDate")}>
                    종료일
                    <SortIcon
                      active={sortKey === "endDate"}
                      direction={sortDirection}
                    />
                  </button>
                </th>
                <th className="activity-data-grid-actions-column" scope="col">
                  <span className="sr-only">활동 메뉴</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const isPinned = Boolean(pinnedItems[row.activity.id]);
                const isPinPending = pendingPinIds.has(row.activity.id);
                const isEditing = editingActivityId === row.activity.id;

                return (
                  <tr
                    key={row.activity.id}
                    className={isPinned ? "is-pinned" : undefined}
                    data-editing={isEditing ? "true" : undefined}
                    onClick={(event) => {
                      if (
                        (event.target as HTMLElement).closest(
                          "button, a, [role='menuitem']",
                        )
                      ) {
                        return;
                      }

                      openActivity(row.activity.id);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.currentTarget === event.target &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        openActivity(row.activity.id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`${row.activity.title} 활동 상세 보기`}
                  >
                    <td className="activity-data-grid-pin-cell">
                      <button
                        type="button"
                        aria-label={
                          isPinned
                            ? `${row.activity.title} 상단 고정 해제`
                            : `${row.activity.title} 상단에 고정`
                        }
                        aria-pressed={isPinned}
                        aria-busy={isPinPending}
                        disabled={disabled || isPinPending}
                        onClick={() => togglePin(row.activity.id)}
                      >
                        <Pin aria-hidden="true" />
                      </button>
                    </td>
                    <td className="activity-data-grid-title-cell" data-label="활동">
                      <strong>{row.activity.title}</strong>
                    </td>
                    <td data-label="상태">
                      <span
                        className="activity-workflow-status"
                        data-status={row.status}
                      >
                        <span aria-hidden="true" />
                        {ACTIVITY_WORKFLOW_STATE_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="activity-data-grid-date-cell" data-label="시작일">
                      {formatDateKey(row.activity.startDate, DATE_FORMAT)}
                    </td>
                    <td className="activity-data-grid-date-cell" data-label="종료일">
                      {row.endDate
                        ? formatDateKey(row.endDate, DATE_FORMAT)
                        : "-"}
                    </td>
                    <td className="activity-data-grid-actions-cell">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`${row.activity.title} 활동 메뉴`}
                            disabled={disabled}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="activity-data-grid-menu"
                        >
                          <DropdownMenuItem
                            disabled={disabled || isPinPending}
                            onSelect={() => togglePin(row.activity.id)}
                          >
                            {isPinned ? (
                              <PinOff aria-hidden="true" />
                            ) : (
                              <Pin aria-hidden="true" />
                            )}
                            {isPinned ? "고정 해제" : "상단에 고정"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onEdit(row.activity)}>
                            <Pencil aria-hidden="true" />
                            활동 수정
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="activity-data-grid-delete"
                            onSelect={() => onDelete(row.activity)}
                          >
                            <Trash2 aria-hidden="true" />
                            활동 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="activity-overview-empty">
          <strong>진행 중인 활동이 없습니다.</strong>
          <p>새 활동을 추가하면 이곳에서 바로 확인할 수 있어요.</p>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="activity-data-grid-pagination">
          <span className="activity-data-grid-range">
            {rangeStart}–{rangeEnd} / {orderedRows.length}
          </span>
          <div
            className="activity-data-grid-page-actions"
            aria-label="페이지 이동"
          >
            <button
              type="button"
              onClick={() => setPageIndex(0)}
              disabled={safePageIndex === 0}
              aria-label="첫 페이지"
            >
              <ChevronsLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              disabled={safePageIndex === 0}
              aria-label="이전 페이지"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <span>
              {safePageIndex + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setPageIndex((current) => Math.min(pageCount - 1, current + 1))
              }
              disabled={safePageIndex >= pageCount - 1}
              aria-label="다음 페이지"
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={safePageIndex >= pageCount - 1}
              aria-label="마지막 페이지"
            >
              <ChevronsRight aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
