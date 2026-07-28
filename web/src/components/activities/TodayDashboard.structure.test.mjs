import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./TodayDashboard.tsx", import.meta.url),
  "utf8",
);
const calendarSource = await readFile(
  new URL("./ActivityCalendar.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("활동 공통 피드백은 개별 활동 목록보다 먼저 표시한다", () => {
  const feedbackIndex = source.indexOf("{activityActionError ? (");
  const activeListIndex = source.indexOf("{activeActivities.length > 0 ? (");
  const completionListIndex = source.indexOf(
    "{activitiesRequiringCompletion.length > 0 ? (",
  );

  assert.notEqual(feedbackIndex, -1, "공통 피드백 영역을 찾을 수 없습니다.");
  assert.notEqual(activeListIndex, -1, "진행 활동 목록을 찾을 수 없습니다.");
  assert.notEqual(
    completionListIndex,
    -1,
    "경험 정리 필요 목록을 찾을 수 없습니다.",
  );
  assert.ok(
    feedbackIndex < activeListIndex && feedbackIndex < completionListIndex,
    "공통 피드백은 특정 활동 목록 아래가 아니라 모든 목록 위에 있어야 합니다.",
  );
});

test("오늘의 기록 핵심 영역은 페이지별 Liquid Glass 계층을 사용한다", () => {
  assert.match(source, /activity-overview liquid-workspace/);
  assert.match(
    source,
    /activity-day-records activity-calendar-event-panel liquid-section/,
  );
  assert.match(calendarSource, /activity-calendar liquid-section/);
  assert.match(
    calendarSource,
    /activity-calendar-navigation liquid-control-group/,
  );
});

test("활동 추가는 포인터 환경에서 아이콘에서 라벨로 확장한다", () => {
  assert.match(source, /activity-create-expanding-button/);
  assert.match(source, /activity-create-expanding-icon/);
  assert.match(source, /activity-create-expanding-label/);
  assert.match(
    styles,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*\.activity-create-expanding-button\s*\{[^}]*width:\s*44px;[^}]*border-radius:\s*999px;/i,
  );
  assert.match(
    styles,
    /\.activity-create-expanding-button:is\([^)]*:hover[^)]*:focus-visible[^)]*\)\s*\{[^}]*width:\s*118px;/i,
  );
  assert.match(
    styles,
    /\.activity-create-expanding-label\s*\{[^}]*white-space:\s*nowrap;/i,
  );
});

test("모바일 완료 활동의 수정과 삭제는 한 줄의 보조 액션으로 정리한다", () => {
  assert.match(
    styles,
    /@media \(max-width: 640px\)[\s\S]*\.activity-finishing-list li\s*\{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    styles,
    /\.activity-finishing-list li > a\s*\{[\s\S]*grid-column:\s*1 \/ -1/,
  );
  assert.match(
    styles,
    /\.activity-inline-alert\s*\{[^}]*flex-direction:\s*column/,
  );
});
