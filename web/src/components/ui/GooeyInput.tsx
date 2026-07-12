"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { cn } from "@/lib/utils";

type GooeyInputProps = {
  placeholder?: string;
  className?: string;
  collapsedWidth?: number;
  expandedWidth?: number;
  expandedOffset?: number;
  gooeyBlur?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
};

function GooeyFilter({ filterId, blur }: { filterId: string; blur: number }) {
  return (
    <svg className="gooey-input-filter" aria-hidden="true">
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

const GOOEY_TRANSITION = {
  type: "spring" as const,
  duration: 0.4,
  bounce: 0.2,
};

export function GooeyInput({
  placeholder = "검색",
  className,
  collapsedWidth = 96,
  expandedWidth = 240,
  expandedOffset = 42,
  gooeyBlur = 5,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  onOpenChange,
  disabled = false,
}: GooeyInputProps) {
  const reactId = useId().replace(/:/g, "");
  const filterId = `gooey-filter-${reactId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const searchText = isControlled ? controlledValue : uncontrolledValue;

  const setSearchText = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const setExpanded = useCallback(
    (nextValue: boolean) => {
      setIsExpanded(nextValue);
      onOpenChange?.(nextValue);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const handleExpand = () => {
    if (!disabled) {
      setExpanded(true);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const handleBlur = () => {
    window.requestAnimationFrame(() => {
      if (!searchText && !rootRef.current?.contains(document.activeElement)) {
        setExpanded(false);
      }
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || !isExpanded) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setSearchText("");
    setExpanded(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleBubbleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleCollapse = () => {
    setSearchText("");
    setExpanded(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div
      ref={rootRef}
      className={cn("gooey-input", className)}
      data-expanded={isExpanded ? "true" : "false"}
      onKeyDown={handleKeyDown}
    >
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />
      <div
        className="gooey-input-filter-wrap"
        style={{ filter: `url(#${filterId})` }}
      >
        <motion.div
          className="gooey-input-surface"
          initial={false}
          animate={{
            width: isExpanded ? expandedWidth : collapsedWidth,
            marginLeft: isExpanded ? expandedOffset : 0,
          }}
          transition={GOOEY_TRANSITION}
        >
          {isExpanded ? (
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={searchText}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={disabled}
              placeholder={placeholder}
              aria-label={placeholder}
            />
          ) : (
            <button
              ref={triggerRef}
              className="gooey-input-trigger"
              type="button"
              disabled={disabled}
              onClick={handleExpand}
              aria-label={`${placeholder} 열기`}
            >
              <Search aria-hidden="true" size={20} strokeWidth={2.25} />
              <span>{placeholder}</span>
            </button>
          )}
        </motion.div>

        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.button
              className="gooey-input-bubble"
              type="button"
              onMouseDown={handleBubbleMouseDown}
              onClick={handleCollapse}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileTap={{ scale: 0.94 }}
              transition={GOOEY_TRANSITION}
              aria-label="검색어 지우고 검색 닫기"
            >
              <Search aria-hidden="true" size={20} strokeWidth={2.25} />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
