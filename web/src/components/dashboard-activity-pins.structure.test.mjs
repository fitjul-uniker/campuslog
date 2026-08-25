import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboardSource = await readFile(
  new URL("./activities/TodayDashboard.tsx", import.meta.url),
  "utf8",
);
const dataGridSource = await readFile(
  new URL("./activities/ActivityOverviewDataGrid.tsx", import.meta.url),
  "utf8",
);
const pinStorageSource = await readFile(
  new URL("../lib/dashboardActivityPins.ts", import.meta.url),
  "utf8",
);
const pinHookSource = await readFile(
  new URL("../hooks/use-dashboard-activity-pins.ts", import.meta.url),
  "utf8",
);
const migrationSource = await readFile(
  new URL(
    "../../../supabase/migrations/20260825000100_dashboard_activity_pins.sql",
    import.meta.url,
  ),
  "utf8",
);
const styles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("오늘의 기록 활동 고정은 별도 사용자별 DB 테이블에 저장한다", () => {
  assert.match(pinStorageSource, /\.from\("dashboard_activity_pins"\)/);
  assert.match(pinStorageSource, /user_id:\s*storage\.userId/);
  assert.match(pinStorageSource, /activity_id:\s*normalizedActivityId/);
  assert.match(pinStorageSource, /pinned_at:\s*new Date\(\)\.toISOString\(\)/);
  assert.match(pinStorageSource, /onConflict:\s*"user_id,activity_id"/);
  assert.match(pinStorageSource, /\.delete\(\)[\s\S]*?\.eq\("activity_id"/);
});

test("활동 고정 테이블은 활동과 함께 삭제되고 본인 RLS만 허용한다", () => {
  assert.match(
    migrationSource,
    /create table if not exists public\.dashboard_activity_pins/i,
  );
  assert.match(migrationSource, /primary key \(user_id, activity_id\)/i);
  assert.match(
    migrationSource,
    /references public\.tracked_activities \(user_id, id\)[\s\S]*?on delete cascade/i,
  );
  assert.match(migrationSource, /enable row level security/i);
  assert.match(migrationSource, /force row level security/i);
  assert.match(migrationSource, /auth\.uid\(\)\) = user_id/i);
});

test("오늘의 기록은 핀 상태를 준비한 뒤 고정 시각 순으로 활동을 올린다", () => {
  assert.match(dashboardSource, /useDashboardActivityPins\(\)/);
  assert.match(dashboardSource, /pinnedItems=\{activityPins\.pinnedItems\}/);
  assert.match(dashboardSource, /onTogglePin=\{activityPins\.togglePinned\}/);
  assert.match(
    dataGridSource,
    /bPinned\.localeCompare\(aPinned\)/,
  );
  assert.match(
    dashboardSource,
    /if \(activities === null \|\| !activityPins\.isLoaded\)/,
  );
  assert.match(pinHookSource, /setDashboardActivityPin/);
  assert.match(pinHookSource, /pinnedItemsRef\.current = previousPins/);
});

test("압정은 독립 44px 토글과 저장 중·오류 상태를 제공한다", () => {
  assert.match(dataGridSource, /<Pin aria-hidden="true" \/>/);
  assert.match(dataGridSource, /aria-pressed=\{isPinned\}/);
  assert.match(dataGridSource, /aria-busy=\{isPinPending\}/);
  assert.match(dataGridSource, /disabled=\{disabled \|\| isPinPending\}/);
  assert.match(dataGridSource, /상단에 고정/);
  assert.match(dashboardSource, /activityPins\.error/);
  assert.match(
    styles,
    /\.activity-data-grid-pin-cell > button[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/i,
  );
  assert.match(
    styles,
    /\.activity-data-grid-pin-cell > button\[aria-pressed="true"\] svg\s*\{[^}]*fill:\s*currentColor;/i,
  );
});
