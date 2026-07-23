"use client";

import { RefreshCcw, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

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
  onClose: () => void;
  onReanalyze: () => void;
};

export function DashboardAnalysisSplitPanel({
  experience,
  analysis,
  isAnalyzing,
  analysisError = "",
  onClose,
  onReanalyze,
}: DashboardAnalysisSplitPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `${DASHBOARD_ANALYSIS_SPLIT_PANEL_ID}-title`;

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
