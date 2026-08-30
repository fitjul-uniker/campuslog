"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AITaskType =
  | "experience-analysis"
  | "recommendation"
  | "activity-synthesis"
  | "answer-draft";

export type AITaskStatus = "pending" | "success" | "error";
export type AITaskMode = "focused" | "background";

export type AITaskDefinition = {
  key: string;
  type: AITaskType;
  targetId: string;
  title: string;
  pendingMessage: string;
  pendingMessages: string[];
  successMessage: string;
  sourceHref: string;
  resultHref: string;
};

export type AITaskSnapshot<T = unknown> = AITaskDefinition & {
  status: AITaskStatus;
  mode: AITaskMode;
  statusMessage: string;
  errorMessage: string;
  isCancelled: boolean;
  startedAt: number;
  finishedAt?: number;
  result?: T;
};

export type AITaskRunResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: string;
      cancelled?: boolean;
    };

type AITaskRunnerContext = {
  signal: AbortSignal;
  setStatusMessage: (message: string) => void;
};

export type AITaskRunner<T> = (
  context: AITaskRunnerContext,
) => Promise<AITaskRunResult<T>>;

type StoredRunner = {
  definition: AITaskDefinition;
  runner: AITaskRunner<unknown>;
};

type AIBackgroundTaskContextValue = {
  tasks: AITaskSnapshot[];
  startTask: <T>(
    definition: AITaskDefinition,
    runner: AITaskRunner<T>,
  ) => Promise<AITaskRunResult<T>>;
  cancelTask: (key: string) => void;
  retryTask: (key: string) => void;
  sendTaskToBackground: (key: string) => void;
  focusTask: (key: string) => void;
  dismissTask: (key: string) => void;
};

const AIBackgroundTaskContext =
  createContext<AIBackgroundTaskContextValue | null>(null);

export function AIBackgroundTaskProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasksByKey, setTasksByKey] = useState<
    Record<string, AITaskSnapshot>
  >({});
  const controllersRef = useRef(new Map<string, AbortController>());
  const promisesRef = useRef(
    new Map<string, Promise<AITaskRunResult<unknown>>>(),
  );
  const runnersRef = useRef(new Map<string, StoredRunner>());

  const startTask = useCallback(
    <T,>(
      definition: AITaskDefinition,
      runner: AITaskRunner<T>,
    ): Promise<AITaskRunResult<T>> => {
      const existingPromise = promisesRef.current.get(definition.key);

      if (existingPromise) {
        return existingPromise as Promise<AITaskRunResult<T>>;
      }

      const abortController = new AbortController();
      const startedAt = Date.now();

      controllersRef.current.set(definition.key, abortController);
      runnersRef.current.set(definition.key, {
        definition,
        runner: runner as AITaskRunner<unknown>,
      });
      setTasksByKey((current) => ({
        ...current,
        [definition.key]: {
          ...definition,
          status: "pending",
          mode: "focused",
          statusMessage: "",
          errorMessage: "",
          isCancelled: false,
          startedAt,
        },
      }));

      const taskPromise = (async (): Promise<AITaskRunResult<T>> => {
        let result: AITaskRunResult<T>;

        try {
          result = await runner({
            signal: abortController.signal,
            setStatusMessage: (message) => {
              if (
                controllersRef.current.get(definition.key) !== abortController
              ) {
                return;
              }

              setTasksByKey((current) => {
                const task = current[definition.key];

                if (!task || task.status !== "pending") {
                  return current;
                }

                return {
                  ...current,
                  [definition.key]: {
                    ...task,
                    statusMessage: message,
                  },
                };
              });
            },
          });
        } catch (error) {
          result = {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "AI 작업 중 문제가 발생했습니다. 다시 시도해 주세요.",
          };
        }

        if (controllersRef.current.get(definition.key) === abortController) {
          setTasksByKey((current) => {
            const task = current[definition.key];

            if (!task) {
              return current;
            }

            return {
              ...current,
              [definition.key]: result.ok
                ? {
                    ...task,
                    status: "success",
                    statusMessage: "",
                    errorMessage: "",
                    isCancelled: false,
                    finishedAt: Date.now(),
                    result: result.value,
                  }
                : {
                    ...task,
                    status: "error",
                    statusMessage: "",
                    errorMessage: result.error,
                    isCancelled: result.cancelled === true,
                    finishedAt: Date.now(),
                  },
            };
          });
          controllersRef.current.delete(definition.key);
          promisesRef.current.delete(definition.key);
        }

        return result;
      })();

      promisesRef.current.set(
        definition.key,
        taskPromise as Promise<AITaskRunResult<unknown>>,
      );

      return taskPromise;
    },
    [],
  );

  const cancelTask = useCallback((key: string) => {
    controllersRef.current.get(key)?.abort();
  }, []);

  const retryTask = useCallback(
    (key: string) => {
      const storedRunner = runnersRef.current.get(key);

      if (!storedRunner || promisesRef.current.has(key)) {
        return;
      }

      void startTask(storedRunner.definition, storedRunner.runner);
      setTasksByKey((current) => {
        const task = current[key];

        return task
          ? {
              ...current,
              [key]: { ...task, mode: "background" },
            }
          : current;
      });
    },
    [startTask],
  );

  const setTaskMode = useCallback((key: string, mode: AITaskMode) => {
    setTasksByKey((current) => {
      const task = current[key];

      return task
        ? {
            ...current,
            [key]: { ...task, mode },
          }
        : current;
    });
  }, []);

  const dismissTask = useCallback((key: string) => {
    if (promisesRef.current.has(key)) {
      return;
    }

    setTasksByKey((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
    runnersRef.current.delete(key);
  }, []);

  const sendTaskToBackground = useCallback(
    (key: string) => setTaskMode(key, "background"),
    [setTaskMode],
  );
  const focusTask = useCallback(
    (key: string) => setTaskMode(key, "focused"),
    [setTaskMode],
  );

  const tasks = useMemo(
    () =>
      Object.values(tasksByKey).sort(
        (first, second) => first.startedAt - second.startedAt,
      ),
    [tasksByKey],
  );
  const value = useMemo<AIBackgroundTaskContextValue>(
    () => ({
      tasks,
      startTask,
      cancelTask,
      retryTask,
      sendTaskToBackground,
      focusTask,
      dismissTask,
    }),
    [
      cancelTask,
      dismissTask,
      focusTask,
      retryTask,
      sendTaskToBackground,
      startTask,
      tasks,
    ],
  );

  return (
    <AIBackgroundTaskContext.Provider value={value}>
      {children}
    </AIBackgroundTaskContext.Provider>
  );
}

export function useAIBackgroundTasks(): AIBackgroundTaskContextValue {
  const context = useContext(AIBackgroundTaskContext);

  if (!context) {
    throw new Error(
      "useAIBackgroundTasks must be used inside AIBackgroundTaskProvider.",
    );
  }

  return context;
}

export function useAITask<T = unknown>(
  key: string,
): AITaskSnapshot<T> | null {
  const { tasks } = useAIBackgroundTasks();
  return (tasks.find((task) => task.key === key) as
    | AITaskSnapshot<T>
    | undefined) ?? null;
}
