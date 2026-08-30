"use client";

import { CheckCircle2, RotateCcw, Sparkles, X, XCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  useAIBackgroundTasks,
  type AITaskSnapshot,
} from "@/components/ai/AIBackgroundTaskProvider";

function getTaskResultHref(task: AITaskSnapshot): string {
  if (task.type !== "recommendation" || !task.result) {
    return task.resultHref;
  }

  const recommendationId = (task.result as { id?: unknown }).id;

  return typeof recommendationId === "string" && recommendationId
    ? `/recommend/history?recommendationId=${encodeURIComponent(recommendationId)}`
    : task.resultHref;
}

function getPendingMessages(task: AITaskSnapshot): string[] {
  return Array.from(
    new Set(
      [task.statusMessage, task.pendingMessage, ...task.pendingMessages]
        .map((message) => message.trim())
        .filter(Boolean),
    ),
  );
}

function AIBackgroundTaskPendingMessage({
  task,
}: {
  task: AITaskSnapshot;
}) {
  const messages = getPendingMessages(task);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentMessageIndex(
        (previousIndex) => (previousIndex + 1) % messages.length,
      );
    }, 2_400);

    return () => window.clearInterval(intervalId);
  }, [messages.length]);

  return (
    <p aria-hidden="true">
      {messages[currentMessageIndex % messages.length] ?? task.pendingMessage}
    </p>
  );
}

export function AIBackgroundTaskCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const { tasks, dismissTask, focusTask, retryTask } =
    useAIBackgroundTasks();
  const visibleTasks = tasks.filter(
    (task) =>
      task.mode === "background" ||
      pathname !== task.sourceHref,
  );

  if (visibleTasks.length === 0) {
    return null;
  }

  return (
    <aside
      className="ai-background-task-center"
      aria-label="AI 작업 상태"
      aria-live="polite"
    >
      {visibleTasks.map((task) => {
        const isPending = task.status === "pending";
        const isSuccess = task.status === "success";

        return (
          <section
            key={task.key}
            className={`ai-background-task is-${task.status}`}
            role={task.status === "error" ? "alert" : "status"}
          >
            <span className="ai-background-task-icon" aria-hidden="true">
              {isPending ? (
                <Sparkles />
              ) : isSuccess ? (
                <CheckCircle2 />
              ) : (
                <XCircle />
              )}
            </span>

            <div className="ai-background-task-copy">
              <strong>{task.title}</strong>
              {isPending ? (
                <>
                  <span className="sr-only">
                    {task.statusMessage || task.pendingMessage}
                  </span>
                  <AIBackgroundTaskPendingMessage task={task} />
                </>
              ) : (
                <p>{isSuccess ? task.successMessage : task.errorMessage}</p>
              )}
            </div>

            <div className="ai-background-task-actions">
              {isPending ? (
                <button
                  type="button"
                  onClick={() => {
                    focusTask(task.key);
                    router.push(task.sourceHref);
                  }}
                >
                  작업 화면 보기
                </button>
              ) : isSuccess ? (
                <button
                  type="button"
                  onClick={() => {
                    const resultHref = getTaskResultHref(task);
                    dismissTask(task.key);
                    router.push(resultHref);
                  }}
                >
                  결과 보기
                </button>
              ) : task.isCancelled ? null : (
                <button type="button" onClick={() => retryTask(task.key)}>
                  <RotateCcw aria-hidden="true" />
                  다시 시도
                </button>
              )}

              {!isPending ? (
                <button
                  type="button"
                  className="ai-background-task-dismiss"
                  onClick={() => dismissTask(task.key)}
                  aria-label={`${task.title} 알림 닫기`}
                >
                  <X aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </section>
        );
      })}
    </aside>
  );
}
