import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type PinnableItemType = "experience" | "recommendation";
export type PinnedItemMap = Record<string, string>;

type FavoriteItemType = "experience" | "tracked_activity" | "recommendation";

type FavoriteItemRow = {
  item_type: FavoriteItemType;
  item_id: string;
  pinned_at: string;
};

type PinScope = Record<PinnableItemType, PinnedItemMap>;

type PinnedItemStore = {
  version: 1;
  scopes: Record<string, PinScope>;
};

const PINNED_ITEMS_STORAGE_KEY = "campuslog:v1:pinned-items";

function createEmptyScope(): PinScope {
  return {
    experience: {},
    recommendation: {},
  };
}

function createEmptyStore(): PinnedItemStore {
  return {
    version: 1,
    scopes: {},
  };
}

function canUseLocalStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function normalizePinnedItemMap(value: unknown): PinnedItemMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<PinnedItemMap>(
    (normalized, [id, pinnedAt]) => {
      if (
        id.trim() &&
        typeof pinnedAt === "string" &&
        !Number.isNaN(Date.parse(pinnedAt))
      ) {
        normalized[id] = pinnedAt;
      }

      return normalized;
    },
    {},
  );
}

function readPinnedItemStore(): PinnedItemStore {
  if (!canUseLocalStorage()) {
    return createEmptyStore();
  }

  try {
    const rawValue = window.localStorage.getItem(PINNED_ITEMS_STORAGE_KEY);

    if (!rawValue) {
      return createEmptyStore();
    }

    const parsed = JSON.parse(rawValue) as {
      version?: unknown;
      scopes?: unknown;
    };

    if (
      parsed.version !== 1 ||
      !parsed.scopes ||
      typeof parsed.scopes !== "object" ||
      Array.isArray(parsed.scopes)
    ) {
      return createEmptyStore();
    }

    const scopes = Object.entries(parsed.scopes).reduce<
      PinnedItemStore["scopes"]
    >((normalizedScopes, [scopeId, value]) => {
      if (!scopeId.trim() || !value || typeof value !== "object") {
        return normalizedScopes;
      }

      const candidate = value as Partial<Record<PinnableItemType, unknown>>;
      normalizedScopes[scopeId] = {
        experience: normalizePinnedItemMap(candidate.experience),
        recommendation: normalizePinnedItemMap(candidate.recommendation),
      };
      return normalizedScopes;
    }, {});

    return { version: 1, scopes };
  } catch {
    return createEmptyStore();
  }
}

function writePinnedItemStore(store: PinnedItemStore) {
  if (!canUseLocalStorage()) {
    throw new Error("즐겨찾기를 저장할 브라우저 저장소를 사용할 수 없습니다.");
  }

  window.localStorage.setItem(PINNED_ITEMS_STORAGE_KEY, JSON.stringify(store));
}

function getLocalPinnedItems(
  scopeId: string,
  type: PinnableItemType,
): PinnedItemMap {
  const scope = readPinnedItemStore().scopes[scopeId] ?? createEmptyScope();
  return { ...scope[type] };
}

function setLocalPinnedItems(
  scopeId: string,
  type: PinnableItemType,
  pinnedItems: PinnedItemMap,
) {
  const store = readPinnedItemStore();
  const currentScope = store.scopes[scopeId] ?? createEmptyScope();

  writePinnedItemStore({
    version: 1,
    scopes: {
      ...store.scopes,
      [scopeId]: {
        ...currentScope,
        [type]: pinnedItems,
      },
    },
  });
}

function clearLocalPinnedItems(scopeId: string, type: PinnableItemType) {
  setLocalPinnedItems(scopeId, type, {});
}

function getFavoriteItemTypes(type: PinnableItemType): FavoriteItemType[] {
  return type === "experience"
    ? ["experience", "tracked_activity"]
    : ["recommendation"];
}

function toFavoriteTarget(type: PinnableItemType, itemId: string) {
  if (type === "experience" && itemId.startsWith("tracked:")) {
    return {
      itemType: "tracked_activity" as const,
      itemId: itemId.slice("tracked:".length),
    };
  }

  return {
    itemType: type,
    itemId,
  };
}

function toPinnedItemId(row: FavoriteItemRow) {
  return row.item_type === "tracked_activity"
    ? `tracked:${row.item_id}`
    : row.item_id;
}

function toPinnedItemMap(rows: FavoriteItemRow[]): PinnedItemMap {
  return rows.reduce<PinnedItemMap>((pinnedItems, row) => {
    pinnedItems[toPinnedItemId(row)] = row.pinned_at;
    return pinnedItems;
  }, {});
}

async function resolvePinStorage() {
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    return { source: "local" as const, scopeId: "local" };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error("즐겨찾기 사용자 정보를 확인하지 못했습니다.");
  }

  if (!user) {
    throw new Error("즐겨찾기 사용자 정보를 확인하지 못했습니다.");
  }

  return {
    source: "supabase" as const,
    scopeId: `user:${user.id}`,
    supabase,
    userId: user.id,
  };
}

async function readDatabasePinnedItems(
  storage: Extract<Awaited<ReturnType<typeof resolvePinStorage>>, { source: "supabase" }>,
  type: PinnableItemType,
): Promise<PinnedItemMap> {
  const { data, error } = await storage.supabase
    .from("favorite_items")
    .select("item_type,item_id,pinned_at")
    .in("item_type", getFavoriteItemTypes(type))
    .order("pinned_at", { ascending: false });

  if (error) {
    throw new Error("즐겨찾기를 불러오지 못했습니다.");
  }

  return toPinnedItemMap((data ?? []) as FavoriteItemRow[]);
}

async function migrateLocalPinnedItems(
  storage: Extract<Awaited<ReturnType<typeof resolvePinStorage>>, { source: "supabase" }>,
  type: PinnableItemType,
) {
  const localPinnedItems = getLocalPinnedItems(storage.scopeId, type);
  const rows = Object.entries(localPinnedItems).flatMap(([itemId, pinnedAt]) => {
    const target = toFavoriteTarget(type, itemId);

    if (!target.itemId) {
      return [];
    }

    return [
      {
        user_id: storage.userId,
        item_type: target.itemType,
        item_id: target.itemId,
        pinned_at: pinnedAt,
      },
    ];
  });

  if (rows.length === 0) {
    return;
  }

  const { error } = await storage.supabase.from("favorite_items").upsert(rows, {
    onConflict: "user_id,item_type,item_id",
    ignoreDuplicates: true,
  });

  if (error) {
    throw new Error("기존 즐겨찾기를 계정에 이전하지 못했습니다.");
  }

  clearLocalPinnedItems(storage.scopeId, type);
}

export async function getPinnedItems(
  type: PinnableItemType,
): Promise<PinnedItemMap> {
  const storage = await resolvePinStorage();

  if (storage.source === "local") {
    return getLocalPinnedItems(storage.scopeId, type);
  }

  await migrateLocalPinnedItems(storage, type);
  return readDatabasePinnedItems(storage, type);
}

export async function setPinnedItem(
  type: PinnableItemType,
  itemId: string,
  pinned: boolean,
): Promise<PinnedItemMap> {
  const normalizedItemId = itemId.trim();

  if (!normalizedItemId) {
    throw new Error("즐겨찾기 대상을 확인할 수 없습니다.");
  }

  const storage = await resolvePinStorage();

  if (storage.source === "local") {
    const nextPinnedItems = getLocalPinnedItems(storage.scopeId, type);

    if (pinned) {
      nextPinnedItems[normalizedItemId] = new Date().toISOString();
    } else {
      delete nextPinnedItems[normalizedItemId];
    }

    setLocalPinnedItems(storage.scopeId, type, nextPinnedItems);
    return nextPinnedItems;
  }

  const target = toFavoriteTarget(type, normalizedItemId);

  if (!target.itemId) {
    throw new Error("즐겨찾기 대상을 확인할 수 없습니다.");
  }

  if (pinned) {
    const { error } = await storage.supabase.from("favorite_items").upsert(
      {
        user_id: storage.userId,
        item_type: target.itemType,
        item_id: target.itemId,
        pinned_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_type,item_id" },
    );

    if (error) {
      throw new Error("즐겨찾기를 저장하지 못했습니다.");
    }
  } else {
    const { error } = await storage.supabase
      .from("favorite_items")
      .delete()
      .eq("item_type", target.itemType)
      .eq("item_id", target.itemId);

    if (error) {
      throw new Error("즐겨찾기를 해제하지 못했습니다.");
    }
  }

  return readDatabasePinnedItems(storage, type);
}
