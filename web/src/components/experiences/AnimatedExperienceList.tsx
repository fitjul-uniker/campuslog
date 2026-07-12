"use client";

import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent, UIEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type MyActivityListItem = {
  key: string;
  id: string;
  title: string;
  kind: "experience" | "tracked";
  updatedAt: string;
};

type AnimatedExperienceListProps = {
  items: MyActivityListItem[];
  selectedItemKey: string | null;
  detailId: string;
  onSelect: (item: MyActivityListItem, trigger: HTMLButtonElement) => void;
};

type ScrollFadeState = {
  top: number;
  bottom: number;
};

const SCROLL_FADE_DISTANCE = 48;

export function AnimatedExperienceList({
  items,
  selectedItemKey,
  detailId,
  onSelect,
}: AnimatedExperienceListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldReduceMotion = useReducedMotion();
  const [scrollFades, setScrollFades] = useState<ScrollFadeState>({
    top: 0,
    bottom: 0,
  });

  const updateScrollFades = useCallback((container: HTMLDivElement) => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const bottomDistance = scrollHeight - scrollTop - clientHeight;

    setScrollFades({
      top: Math.min(scrollTop / SCROLL_FADE_DISTANCE, 1),
      bottom:
        scrollHeight <= clientHeight
          ? 0
          : Math.min(bottomDistance / SCROLL_FADE_DISTANCE, 1),
    });
  }, []);

  useEffect(() => {
    const container = listRef.current;

    if (!container) {
      return;
    }

    updateScrollFades(container);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollFades(container);
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [items.length, selectedItemKey, updateScrollFades]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    updateScrollFades(event.currentTarget);
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

  return (
    <div className="dashboard-animated-list-shell">
      <motion.div
        layoutScroll
        ref={listRef}
        className="dashboard-animated-list"
        onScroll={handleScroll}
      >
        <ul aria-label="나의 활동 목록">
          {items.map((item, index) => {
            const isSelected = item.key === selectedItemKey;

            return (
              <motion.li
                layout="position"
                key={item.key}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, y: 8 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.2,
                  delay: shouldReduceMotion
                    ? 0
                    : Math.min(index * 0.03, 0.18),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <button
                  ref={(button) => {
                    buttonRefs.current[index] = button;
                  }}
                  className="dashboard-experience-title-button"
                  type="button"
                  aria-controls={isSelected ? detailId : undefined}
                  aria-expanded={isSelected}
                  data-selected={isSelected ? "true" : "false"}
                  onClick={(event) =>
                    onSelect(item, event.currentTarget)
                  }
                  onKeyDown={(event) => handleItemKeyDown(event, index)}
                >
                  <span className="dashboard-activity-title">{item.title}</span>
                  {item.kind === "tracked" ? (
                    <span className="dashboard-activity-progress-badge">
                      진행 중
                    </span>
                  ) : null}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>

      <span
        className="dashboard-list-fade dashboard-list-fade-top"
        style={{ opacity: scrollFades.top }}
        aria-hidden="true"
      />
      <span
        className="dashboard-list-fade dashboard-list-fade-bottom"
        style={{ opacity: scrollFades.bottom }}
        aria-hidden="true"
      />
    </div>
  );
}
