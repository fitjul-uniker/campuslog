"use client";

import { useCallback } from "react";

import {
  useAIBackgroundTasks,
  useAITask,
  type AITaskDefinition,
} from "@/components/ai/AIBackgroundTaskProvider";
import {
  analyzeCurrentExperience,
  type AnalyzeCurrentExperienceResult,
} from "@/lib/experienceAnalysisWorkflow";

export type ExperienceAnalysisTaskResult = Extract<
  AnalyzeCurrentExperienceResult,
  { ok: true }
>;

export function getExperienceAnalysisTaskKey(experienceId: string): string {
  return `experience-analysis:${experienceId}`;
}

export function useExperienceAnalysisTask({
  experienceId,
  experienceTitle,
  sourceHref,
}: {
  experienceId: string;
  experienceTitle: string;
  sourceHref: string;
}) {
  const key = getExperienceAnalysisTaskKey(experienceId);
  const task = useAITask<ExperienceAnalysisTaskResult>(key);
  const {
    startTask,
    cancelTask,
    dismissTask,
    sendTaskToBackground,
  } = useAIBackgroundTasks();

  const start = useCallback(() => {
    const definition: AITaskDefinition = {
      key,
      type: "experience-analysis",
      targetId: experienceId,
      title: `${experienceTitle} 경험 분석`,
      pendingMessage: "CampusLog AI가 경험을 정리하고 있어요.",
      pendingMessages: [
        "경험 기록의 핵심 내용을 살펴보고 있어요.",
        "STAR 구조와 주요 성과를 정리하고 있어요.",
        "부족한 정보와 활용 키워드를 확인하고 있어요.",
      ],
      successMessage: "경험 분석이 완료되었습니다.",
      sourceHref,
      resultHref: `/experiences/${experienceId}/analysis`,
    };

    return startTask(definition, async ({ signal, setStatusMessage }) => {
      const response = await analyzeCurrentExperience(experienceId, {
        signal,
        stream: true,
        onStatus: setStatusMessage,
      });

      return response.ok
        ? { ok: true, value: response }
        : {
            ok: false,
            error: response.error.message,
            cancelled: response.error.code === "REQUEST_CANCELLED",
          };
    });
  }, [experienceId, experienceTitle, key, sourceHref, startTask]);
  const cancel = useCallback(() => cancelTask(key), [cancelTask, key]);
  const dismiss = useCallback(() => dismissTask(key), [dismissTask, key]);
  const sendToBackground = useCallback(
    () => sendTaskToBackground(key),
    [key, sendTaskToBackground],
  );

  return {
    key,
    task,
    isPending: task?.status === "pending",
    start,
    cancel,
    dismiss,
    sendToBackground,
  };
}
