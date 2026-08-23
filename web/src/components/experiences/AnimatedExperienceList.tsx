"use client";

import { Star } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import type { KeyboardEvent, UIEvent } from "react";
import { useRef } from "react";

import {
  ACTIVITY_DISPLAY_STATE_LABELS,
  type TrackedActivityDisplayState,
} from "@/components/activities/activityViewUtils";
import { useTransientScrollbar } from "@/hooks/use-transient-scrollbar";

export type MyActivityListItem = {
  key: string;
  id: string;
  title: string;
  kind: "experience" | "tracked";
  updatedAt: string;
  displayState?: TrackedActivityDisplayState;
};

type AnimatedExperienceListProps = {
  items: MyActivityListItem[];
  selectedItemKey: string | null;
  detailId: string;
  pinnedItems: Record<string, string>;
  pendingPinIds: Set<string>;
  onSelect: (item: MyActivityListItem, trigger: HTMLButtonElement) => void;
  onTogglePin: (itemId: string) => void;
};

export function AnimatedExperienceList({
  items,
  selectedItemKey,
  detailId,
  pinnedItems,
  pendingPinIds,
  onSelect,
  onTogglePin,
}: AnimatedExperienceListProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldReduceMotion = useReducedMotion();
  const handleTransientScroll = useTransientScrollbar<HTMLDivElement>();

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    handleTransientScroll(event);
  };

  const moveFocus = (index: number) => {
    const nextButton = buttonRefs.current[index];

    if (!nextButton) {
      return;
    }

    nextButton.focus();
    nextButton.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const handleItemKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = Math.min(index + 1, items.length - 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(index - 1, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    moveFocus(nextIndex);
  };

  const getFavoriteId = (item: MyActivityListItem) =>
    item.kind === "tracked" ? `tracked:${item.id}` : item.id;
  const pinnedActivityItems = items
    .filter((item) => Boolean(pinnedItems[getFavoriteId(item)]))
    .sort((a, b) =>
      pinnedItems[getFavoriteId(b)].localeCompare(
        pinnedItems[getFavoriteId(a)],
      ),
    );
  const remainingItems = items.filter(
    (item) => !pinnedItems[getFavoriteId(item)],
  );
  const orderedItems = [...pinnedActivityItems, ...remainingItems];

  const renderItem = (item: MyActivityListItem) => {
    const index = orderedItems.findIndex(
      (orderedItem) => orderedItem.key === item.key,
    );
    const isSelected = item.key === selectedItemKey;
    const favoriteId = getFavoriteId(item);
    const isPinned = Boolean(pinnedItems[favoriteId]);
    const isPinPending = pendingPinIds.has(favoriteId);

    return (
      <motion.li
        layout
        layoutId={`activity-list-item:${item.key}`}
        key={item.key}
        className="pinned-list-item"
        data-pinned={isPinned ? "true" : "false"}
        data-selected={isSelected ? "true" : "false"}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
        transition={{
          layout: {
            duration: shouldReduceMotion ? 0 : 0.32,
            ease: [0.22, 1, 0.36, 1],
          },
          opacity: { duration: shouldReduceMotion ? 0 : 0.18 },
          y: {
            duration: shouldReduceMotion ? 0 : 0.2,
            delay: shouldReduceMotion ? 0 : Math.min(index * 0.025, 0.15),
            ease: [0.22, 1, 0.36, 1],
          },
        }}
      >
        <div className="pinned-list-row">
          <button
            ref={(button) => {
              buttonRefs.current[index] = button;
            }}
            className="dashboard-experience-title-button"
            type="button"
            aria-controls={isSelected ? detailId : undefined}
            aria-expanded={isSelected}
            data-selected={isSelected ? "true" : "false"}
            onClick={(event) => onSelect(item, event.currentTarget)}
            onKeyDown={(event) => handleItemKeyDown(event, index)}
          >
            <span className="dashboard-activity-title">{item.title}</span>
            {item.kind === "tracked" ? (
              <span
                className="activity-workflow-status dashboard-activity-progress-badge"
                data-status={item.displayState}
              >
                <span aria-hidden="true" />
                {ACTIVITY_DISPLAY_STATE_LABELS[item.displayState!]}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className="pinned-list-pin-button"
            aria-label={`${item.title} ${isPinned ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}`}
            aria-pressed={isPinned}
            aria-busy={isPinPending}
            disabled={isPinPending}
            onClick={() => onTogglePin(favoriteId)}
          >
            <Star aria-hidden="true" />
          </button>
        </div>
      </motion.li>
    );
  };

  return (
    <div className="dashboard-animated-list-shell">
      <LayoutGroup id="experience-pinned-list">
        <motion.div
          layoutScroll
          className="dashboard-animated-list pinned-list"
          data-transient-scrollbar="true"
          onScroll={handleScroll}
        >
          <ul aria-label="나의 활동 목록">
            <AnimatePresence initial={false} mode="popLayout">
              {pinnedActivityItems.length > 0 ? (
                <motion.li
                  layout="position"
                  key="experience-pinned-heading"
                  className="pinned-list-section-heading"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>즐겨찾기</span>
                </motion.li>
              ) : null}
              {pinnedActivityItems.map(renderItem)}
              {pinnedActivityItems.length > 0 &&
              remainingItems.length > 0 ? (
                <motion.li
                  layout="position"
                  key="experience-all-heading"
                  className="pinned-list-section-heading is-all"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>모든 활동</span>
                </motion.li>
              ) : null}
              {remainingItems.map(renderItem)}
            </AnimatePresence>
          </ul>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
