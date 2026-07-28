"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getPinnedItems,
  setPinnedItem,
  type PinnableItemType,
  type PinnedItemMap,
} from "@/lib/pinnedItems";

export function usePinnedItems(type: PinnableItemType) {
  const [pinnedItems, setPinnedItems] = useState<PinnedItemMap>({});
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

    getPinnedItems(type)
      .then((storedPins) => {
        if (isActive) {
          setPinnedItems(storedPins);
        }
      })
      .catch(() => {
        if (isActive) {
          setError(
            "즐겨찾기를 불러오지 못했습니다. 목록은 그대로 사용할 수 있습니다.",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [type]);

  const togglePinned = useCallback(
    async (itemId: string) => {
      if (pendingIdsRef.current.has(itemId)) {
        return;
      }

      const previousPins = pinnedItemsRef.current;
      const shouldPin = !previousPins[itemId];
      const optimisticPins = { ...previousPins };

      if (shouldPin) {
        optimisticPins[itemId] = new Date().toISOString();
      } else {
        delete optimisticPins[itemId];
      }

      pinnedItemsRef.current = optimisticPins;
      setPinnedItems(optimisticPins);
      setError("");
      setPendingIds((current) => {
        const next = new Set(current);
        next.add(itemId);
        pendingIdsRef.current = next;
        return next;
      });

      try {
        const storedPins = await setPinnedItem(type, itemId, shouldPin);
        pinnedItemsRef.current = storedPins;
        setPinnedItems(storedPins);
      } catch {
        pinnedItemsRef.current = previousPins;
        setPinnedItems(previousPins);
        setError(
          "즐겨찾기를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(itemId);
          pendingIdsRef.current = next;
          return next;
        });
      }
    },
    [type],
  );

  const pinnedIds = useMemo(
    () => new Set(Object.keys(pinnedItems)),
    [pinnedItems],
  );

  return {
    pinnedItems,
    pinnedIds,
    pendingIds,
    error,
    clearError: () => setError(""),
    togglePinned,
  };
}
