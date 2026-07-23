"use client";

import { RefreshCcw, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { AIProcessingPanel } from "@/components/ai/AIProcessingPanel";
import { AnalysisResult } from "@/components/ai/AnalysisResult";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Experience, ExperienceAnalysis } from "@/lib/types";

export const DASHBOARD_ANALYSIS_SPLIT_PANEL_ID =
  "dashboard-analysis-split-panel";

type DashboardAnalysisSplitPanelProps = {
  experience: Experience;
  analysis: ExperienceAnalysis;
  isAnalyzing: boolean;
  analysisError?: string;
  analysisStatusMessage?: string;
  onClose: () => void;
  onReanalyze: () => void;
  onCancelAnalysis?: () => void;
};

export function DashboardAnalysisSplitPanel({
  experience,
  analysis,
  isAnalyzing,
  analysisError = "",
  analysisStatusMessage = "",
  onClose,
  onReanalyze,
  onCancelAnalysis,
}: DashboardAnalysisSplitPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `${DASHBOARD_ANALYSIS_SPLIT_PANEL_ID}-title`;
  const sourceCharacterCount =
    experience.title.length +
    experience.role.length +
    experience.description.length +
    experience.achievements.length;

  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.aside
      id={DASHBOARD_ANALYSIS_SPLIT_PANEL_ID}
      className="dashboard-analysis-split-panel"
      aria-labelledby={titleId}
      initial={
        shouldReduceMotion ? false : { opacity: 0, x: 28, scale: 0.985 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={
        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.99 }
      }
      transition={{
        duration: shouldReduceMotion ? 0.12 : 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <header className="dashboard-analysis-split-header">
        <div>
          <h2 id={titleId}>AI 분석 결과</h2>
        </div>
        <div className="dashboard-analysis-split-header-actions">
          <StatusBadge status={experience.analysisStatus} />
          <button
            ref={closeButtonRef}
            type="button"
            className="dashboard-detail-close"
            onClick={onClose}
            aria-label="AI 분석 결과 닫기"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="dashboard-analysis-split-content">
        <AnalysisResult
          experience={experience}
          analysis={analysis}
          variant="embedded"
        />

        {isAnalyzing ? (
          <AIProcessingPanel
            className="analysis-ai-processing"
            title="경험을 다시 분석하고 있어요"
            description="현재 결과는 그대로 두고, 최신 기록과 보완 답변을 반영해 새 결과를 준비합니다."
            contextItems={[
              { label: "분석 대상", value: experience.title },
              { label: "원본 분량", value: `${sourceCharacterCount}자` },
              { label: "현재 상태", value: "기존 결과 유지" },
            ]}
            steps={[
              "활동 내용과 성과 단서를 확인하고 있어요.",
              "STAR 구조로 다시 활용할 정보를 나누고 있어요.",
              "부족한 정보와 키워드를 정리하고 있어요.",
            ]}
            messages={[
              {
                afterMs: 0,
                text: "경험 기록의 핵심 내용을 다시 살펴보고 있어요.",
              },
              {
                afterMs: 7_000,
                text: "STAR 구조와 주요 성과를 정리하고 있어요.",
              },
              {
                afterMs: 16_000,
                text: "부족한 정보와 활용 키워드를 확인하고 있어요.",
              },
            ]}
            statusMessage={analysisStatusMessage || undefined}
            skeletonVariant="analysis"
            longWaitThresholdMs={20_000}
            longWaitMessage="경험 원문이나 보완 답변이 길면 분석 결과 형식 검증에 시간이 더 걸릴 수 있어요."
            canCancel={Boolean(onCancelAnalysis)}
            onCancel={onCancelAnalysis}
          />
        ) : null}

        {analysisError ? (
          <p className="dashboard-detail-analysis-error" role="alert">
            {analysisError}
          </p>
        ) : null}

        <div className="dashboard-analysis-split-footer">
          <RippleButton
            type="button"
            className="dashboard-detail-action"
            onClick={onReanalyze}
            disabled={isAnalyzing}
          >
            <RefreshCcw aria-hidden="true" />
            {isAnalyzing ? "분석 중..." : "다시 분석하기"}
            <RippleButtonRipples />
          </RippleButton>
        </div>
      </div>
    </motion.aside>
  );
}
