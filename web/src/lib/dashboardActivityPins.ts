import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type DashboardActivityPinMap = Record<string, string>;

type DashboardActivityPinRow = {
  activity_id: string;
  pinned_at: string;
};

type LocalDashboardActivityPinStore = {
  version: 1;
  pinnedItems: DashboardActivityPinMap;
};

const DASHBOARD_ACTIVITY_PINS_STORAGE_KEY =
  "campuslog:v1:dashboard-activity-pins";

function canUseLocalStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function normalizePinMap(value: unknown): DashboardActivityPinMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<DashboardActivityPinMap>(
    (normalized, [activityId, pinnedAt]) => {
      if (
        activityId.trim() &&
        typeof pinnedAt === "string" &&
        !Number.isNaN(Date.parse(pinnedAt))
      ) {
        normalized[activityId] = pinnedAt;
      }

      return normalized;
    },
    {},
  );
}

function readLocalPins(): DashboardActivityPinMap {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(
      DASHBOARD_ACTIVITY_PINS_STORAGE_KEY,
    );

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as Partial<LocalDashboardActivityPinStore>;

    if (parsed.version !== 1) {
      return {};
    }

    return normalizePinMap(parsed.pinnedItems);
  } catch {
    return {};
  }
}

function writeLocalPins(pinnedItems: DashboardActivityPinMap) {
  if (!canUseLocalStorage()) {
    throw new Error("활동 고정 상태를 저장할 브라우저 저장소가 없습니다.");
  }

  const store: LocalDashboardActivityPinStore = {
    version: 1,
    pinnedItems,
  };

  window.localStorage.setItem(
    DASHBOARD_ACTIVITY_PINS_STORAGE_KEY,
    JSON.stringify(store),
  );
}

async function resolvePinStorage() {
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    return { source: "local" as const };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("활동 고정 상태의 사용자 정보를 확인하지 못했습니다.");
  }

  return {
    source: "supabase" as const,
    supabase,
    userId: user.id,
  };
}

async function readDatabasePins(
  storage: Extract<
    Awaited<ReturnType<typeof resolvePinStorage>>,
    { source: "supabase" }
  >,
): Promise<DashboardActivityPinMap> {
  const { data, error } = await storage.supabase
    .from("dashboard_activity_pins")
    .select("activity_id,pinned_at")
    .order("pinned_at", { ascending: false });

  if (error) {
    throw new Error("활동 고정 상태를 불러오지 못했습니다.");
  }

  return ((data ?? []) as DashboardActivityPinRow[]).reduce<
    DashboardActivityPinMap
  >((pinnedItems, row) => {
    pinnedItems[row.activity_id] = row.pinned_at;
    return pinnedItems;
  }, {});
}

export async function getDashboardActivityPins(): Promise<DashboardActivityPinMap> {
  const storage = await resolvePinStorage();

  if (storage.source === "local") {
    return readLocalPins();
  }

  return readDatabasePins(storage);
}

export async function setDashboardActivityPin(
  activityId: string,
  pinned: boolean,
): Promise<DashboardActivityPinMap> {
  const normalizedActivityId = activityId.trim();

  if (!normalizedActivityId) {
    throw new Error("고정할 활동을 확인할 수 없습니다.");
  }

  const storage = await resolvePinStorage();

  if (storage.source === "local") {
    const nextPinnedItems = readLocalPins();

    if (pinned) {
      nextPinnedItems[normalizedActivityId] = new Date().toISOString();
    } else {
      delete nextPinnedItems[normalizedActivityId];
    }

    writeLocalPins(nextPinnedItems);
    return nextPinnedItems;
  }

  if (pinned) {
    const { error } = await storage.supabase
      .from("dashboard_activity_pins")
      .upsert(
        {
          user_id: storage.userId,
          activity_id: normalizedActivityId,
          pinned_at: new Date().toISOString(),
        },
        { onConflict: "user_id,activity_id" },
      );

    if (error) {
      throw new Error("활동 고정 상태를 저장하지 못했습니다.");
    }
  } else {
    const { error } = await storage.supabase
      .from("dashboard_activity_pins")
      .delete()
      .eq("activity_id", normalizedActivityId);

    if (error) {
      throw new Error("활동 고정을 해제하지 못했습니다.");
    }
  }

  return readDatabasePins(storage);
}
