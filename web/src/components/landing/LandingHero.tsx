"use client";

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
  const prefersReducedMotion = useReducedMotion();

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
          isPaused={prefersReducedMotion === true}
          words={RECORDING_SUBJECTS}
          suffix="기록하다."
        />
      </h1>
    </ScrollFloat>
  );
}
