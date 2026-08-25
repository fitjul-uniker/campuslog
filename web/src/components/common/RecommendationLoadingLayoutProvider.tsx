"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RecommendationLoadingLayout = "empty" | "form";

type RecommendationLoadingLayoutContextValue = {
  mode: RecommendationLoadingLayout;
  setMode: (mode: RecommendationLoadingLayout) => void;
};

const RecommendationLoadingLayoutContext =
  createContext<RecommendationLoadingLayoutContextValue | null>(null);

type RecommendationLoadingLayoutProviderProps = {
  children: ReactNode;
  initialMode: RecommendationLoadingLayout;
};

export function RecommendationLoadingLayoutProvider({
  children,
  initialMode,
}: RecommendationLoadingLayoutProviderProps) {
  const [mode, setModeState] =
    useState<RecommendationLoadingLayout>(initialMode);

  const setMode = useCallback((nextMode: RecommendationLoadingLayout) => {
    setModeState(nextMode);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <RecommendationLoadingLayoutContext.Provider value={value}>
      {children}
    </RecommendationLoadingLayoutContext.Provider>
  );
}

export function useRecommendationLoadingLayout() {
  const context = useContext(RecommendationLoadingLayoutContext);

  if (!context) {
    throw new Error(
      "useRecommendationLoadingLayout must be used inside RecommendationLoadingLayoutProvider.",
    );
  }

  return context;
}
