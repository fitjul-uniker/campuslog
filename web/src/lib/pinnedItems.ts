import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type PinnableItemType = "experience" | "recommendation";
export type PinnedItemMap = Record<string, string>;

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

async function resolvePinScopeId() {
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    return "local";
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error("즐겨찾기 사용자 정보를 확인하지 못했습니다.");
  }

  return user ? `user:${user.id}` : "local";
}

export async function getPinnedItems(
  type: PinnableItemType,
): Promise<PinnedItemMap> {
  const scopeId = await resolvePinScopeId();
  const scope = readPinnedItemStore().scopes[scopeId] ?? createEmptyScope();
  return { ...scope[type] };
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

  const scopeId = await resolvePinScopeId();
  const store = readPinnedItemStore();
  const currentScope = store.scopes[scopeId] ?? createEmptyScope();
  const nextPinnedItems = { ...currentScope[type] };

  if (pinned) {
    nextPinnedItems[normalizedItemId] = new Date().toISOString();
  } else {
    delete nextPinnedItems[normalizedItemId];
  }

  const nextStore: PinnedItemStore = {
    version: 1,
    scopes: {
      ...store.scopes,
      [scopeId]: {
        ...currentScope,
        [type]: nextPinnedItems,
      },
    },
  };

  writePinnedItemStore(nextStore);
  return nextPinnedItems;
}
