"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getDashboardActivityPins,
  setDashboardActivityPin,
  type DashboardActivityPinMap,
} from "@/lib/dashboardActivityPins";

export function useDashboardActivityPins() {
  const [pinnedItems, setPinnedItems] = useState<DashboardActivityPinMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const pinnedItemsRef = useRef(pinnedItems);
  const pendingIdsRef = useRef(pendingIds);

  useEffect(() => {
    pinnedItemsRef.current = pinnedItems;
  }, [pinnedItems]);

  useEffect(() => {
    pendingIdsRef.current = pendingIds;
  }, [pendingIds]);

  useEffect(() => {
    let isActive = true;

    const loadPins = () => {
      if (pendingIdsRef.current.size > 0) {
        return;
      }

      getDashboardActivityPins()
        .then((storedPins) => {
          if (isActive) {
            pinnedItemsRef.current = storedPins;
            setPinnedItems(storedPins);
            setError("");
            setIsLoaded(true);
          }
        })
        .catch(() => {
          if (isActive) {
            setError(
              "활동 고정 상태를 불러오지 못했습니다. 목록은 그대로 사용할 수 있습니다.",
            );
            setIsLoaded(true);
          }
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadPins();
      }
    };

    loadPins();
    window.addEventListener("focus", loadPins);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.removeEventListener("focus", loadPins);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const togglePinned = useCallback(async (activityId: string) => {
    if (pendingIdsRef.current.has(activityId)) {
      return;
    }

    const previousPins = pinnedItemsRef.current;
    const shouldPin = !previousPins[activityId];
    const optimisticPins = { ...previousPins };

    if (shouldPin) {
      optimisticPins[activityId] = new Date().toISOString();
    } else {
      delete optimisticPins[activityId];
    }

    pinnedItemsRef.current = optimisticPins;
    setPinnedItems(optimisticPins);
    setError("");
    setPendingIds((current) => {
      const next = new Set(current);
      next.add(activityId);
      pendingIdsRef.current = next;
      return next;
    });

    try {
      const storedPins = await setDashboardActivityPin(
        activityId,
        shouldPin,
      );
      pinnedItemsRef.current = storedPins;
      setPinnedItems(storedPins);
    } catch {
      pinnedItemsRef.current = previousPins;
      setPinnedItems(previousPins);
      setError(
        "활동 고정 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(activityId);
        pendingIdsRef.current = next;
        return next;
      });
    }
  }, []);

  return {
    pinnedItems,
    isLoaded,
    pendingIds,
    error,
    clearError: () => setError(""),
    togglePinned,
  };
}
