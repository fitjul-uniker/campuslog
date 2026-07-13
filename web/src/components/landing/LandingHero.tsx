"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { ScrollFloat } from "@/components/ui/scroll-float";

const RECORDING_SUBJECTS = [
  { text: "대학생활", particle: "을", emphasis: true },
  { text: "공모전", particle: "을" },
  { text: "해커톤", particle: "을" },
  { text: "프로젝트", particle: "를" },
  { text: "대회", particle: "를" },
] as const;

export function LandingHero() {
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isMotionDisabled = prefersReducedMotion === true;
  const isRotationPaused = isPaused || isMotionDisabled;
  const controlLabel = isMotionDisabled
    ? "문구 자동 전환 꺼짐. 동작 줄이기 설정이 적용되었습니다."
    : isPaused
      ? "문구 자동 전환 재생. 현재 일시정지됨."
      : "문구 자동 전환 일시정지. 현재 재생 중.";
  const statusMessage = isMotionDisabled
    ? "동작 줄이기 설정에 따라 문구 자동 전환이 꺼져 있습니다."
    : isPaused
      ? "문구 자동 전환이 일시정지되었습니다."
      : "문구 자동 전환이 재생 중입니다.";

  return (
    <ScrollFloat
      containerClassName="w-full py-8"
      textClassName="landing-hero-content"
      scrollStart="center top+=40%"
      scrollEnd="center top+=12%"
    >
      <h1
        id="landing-title"
        aria-label="대학생활을 기록하다."
        className="landing-statement"
      >
        <LayoutTextFlip
          isPaused={isRotationPaused}
          words={RECORDING_SUBJECTS}
          suffix="기록하다."
        />
      </h1>

      <button
        aria-label={controlLabel}
        className="landing-motion-control"
        disabled={isMotionDisabled}
        onClick={() => setIsPaused((previousValue) => !previousValue)}
        type="button"
      >
        {isMotionDisabled || !isPaused ? (
          <Pause aria-hidden="true" />
        ) : (
          <Play aria-hidden="true" />
        )}
        <span>
          {isMotionDisabled ? "자동 전환 꺼짐" : isPaused ? "재생" : "일시정지"}
        </span>
      </button>

      <span className="sr-only" aria-live="polite">
        {statusMessage}
      </span>
    </ScrollFloat>
  );
}
