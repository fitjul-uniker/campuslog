import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./TodayDashboard.tsx", import.meta.url),
  "utf8",
);
const dataGridSource = await readFile(
  new URL("./ActivityOverviewDataGrid.tsx", import.meta.url),
  "utf8",
);
const viewUtilsSource = await readFile(
  new URL("./activityViewUtils.ts", import.meta.url),
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

test("활동 공통 피드백은 활동 현황 Data Grid보다 먼저 표시한다", () => {
  const feedbackIndex = source.indexOf("{activityActionError ? (");
  const dataGridIndex = source.indexOf("<ActivityOverviewDataGrid");

  assert.notEqual(feedbackIndex, -1, "공통 피드백 영역을 찾을 수 없습니다.");
  assert.notEqual(dataGridIndex, -1, "활동 현황 Data Grid를 찾을 수 없습니다.");
  assert.ok(
    feedbackIndex < dataGridIndex,
    "공통 피드백은 활동 현황 Data Grid 위에 있어야 합니다.",
  );
});

test("활동 현황 Data Grid는 상태·기간·고정·한국어 행 메뉴를 제공한다", () => {
  assert.match(source, /<h2 id="activity-overview-title">활동 현황<\/h2>/);
  assert.match(dataGridSource, /활동[\s\S]*상태[\s\S]*시작일[\s\S]*종료일/);
  assert.match(viewUtilsSource, /active: "진행 중"/);
  assert.match(viewUtilsSource, /planned: "시작 예정"/);
  assert.match(viewUtilsSource, /completion_due: "종료 확인 필요"/);
  assert.match(viewUtilsSource, /completion_required: "경험 정리 필요"/);
  assert.match(dataGridSource, /className="activity-workflow-status"/);
  assert.match(dataGridSource, /상단에 고정/);
  assert.match(dataGridSource, /활동 수정/);
  assert.match(dataGridSource, /활동 삭제/);
  assert.doesNotMatch(dataGridSource, /Copy ID|ID 복사|RefreshCw/);
});

test("활동 현황 빈 상태는 진행 중인 활동과 다음 행동을 간결하게 안내한다", () => {
  assert.match(dataGridSource, /진행 중인 활동이 없습니다\./);
  assert.match(dataGridSource, /새 활동을 추가하면 이곳에서 바로 확인할 수 있어요\./);
  assert.doesNotMatch(dataGridSource, /표시할 활동이 아직 없습니다/);
  assert.match(
    styles,
    /\.activity-overview-empty\s*\{[^}]*min-height:\s*112px;[^}]*place-content:\s*center;[^}]*background:\s*transparent;[^}]*text-align:\s*center;/s,
  );
});

test("대시보드 불러오기 오류는 본문 배너 대신 재시도 가능한 Glass 팝업으로 표시한다", () => {
  assert.match(source, /activity-inline-alert activity-load-error-toast/);
  assert.match(source, /기록을 불러오지 못했어요/);
  assert.match(source, /계정 데이터는 그대로 있어요/);
  assert.match(source, /activity-load-error-retry/);
  assert.match(
    styles,
    /\.activity-inline-alert\.activity-load-error-toast\s*\{[^}]*position:\s*fixed;[^}]*width:\s*min\(360px, calc\(100vw - 48px\)\);[^}]*border-radius:\s*22px;[^}]*backdrop-filter:\s*blur\(24px\)/s,
  );
});

test("활동 현황 Data Grid는 고정 5개 페이지와 행 상세 진입을 제공한다", () => {
  assert.match(dataGridSource, /const pageSize = 5;/);
  assert.doesNotMatch(dataGridSource, /페이지당 행|<select/);
  assert.match(dataGridSource, /router\.push\(`\/activities\/\$\{activityId\}`\)/);
  assert.match(dataGridSource, /aria-label=\{`\$\{row\.activity\.title\} 활동 상세 보기`\}/);
});

test("활동 수 요약 줄을 제거하고 고정 핀은 선택 시 채워진다", () => {
  assert.doesNotMatch(dataGridSource, /개 활동|activity-data-grid-toolbar/);
  assert.match(
    source,
    /activity-overview-actions[\s\S]*activity-overview-count[\s\S]*overviewActivityCount[\s\S]*activity-create-expanding-button/,
  );
  assert.match(dataGridSource, /<Pin aria-hidden="true" \/>/);
  assert.match(
    styles,
    /\.activity-data-grid-pin-cell > button\[aria-pressed="true"\] svg\s*\{[^}]*fill:\s*currentColor/,
  );
  assert.match(dataGridSource, /:\s*"-"/);
});

test("활동 표는 데스크톱에서 가로 스크롤 없이 한 행으로 맞춘다", () => {
  assert.match(
    styles,
    /\.activity-data-grid-scroll\s*\{[^}]*overflow-x:\s*hidden/,
  );
  assert.match(
    styles,
    /\.activity-data-grid table\s*\{[^}]*min-width:\s*0/,
  );
});

test("행 hover와 고정 상태를 배경·채움으로만 구분하고 메뉴 열림은 폭을 잠그지 않는다", () => {
  assert.match(
    styles,
    /\.activity-data-grid tbody tr:is\([^)]*:hover[^)]*\)\s*\{[^}]*background:\s*rgb\(232 237 244 \/ 72%\)/,
  );
  assert.doesNotMatch(
    styles,
    /\.activity-data-grid tbody tr:is\([^)]*:hover[^)]*\)\s*\{[^}]*box-shadow/,
  );
  assert.doesNotMatch(
    styles,
    /\.activity-data-grid tbody tr\.is-pinned\s*\{/,
  );
  assert.match(dataGridSource, /<DropdownMenu modal=\{false\}>/);
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

test("활동 추가와 날짜별 기록 overlay는 같은 쿨 뉴트럴 Glass 언어를 사용한다", () => {
  assert.match(source, /className="activity-floating-record-panel"/);
  assert.match(
    styles,
    /Liquid Glass creation overlays[\s\S]*?\.glass-overlay-surface\.activity-floating-record-panel\s*\{[\s\S]*?border-radius:\s*28px;[\s\S]*?background:\s*rgb\(248 249 251 \/ 90%\);[\s\S]*?backdrop-filter:\s*blur\(28px\)/,
  );
  assert.match(
    styles,
    /\.glass-overlay-surface\.activity-floating-record-panel[\s\S]*?\.floating-panel-header\s+p\s*\{[^}]*border-radius:\s*999px;[^}]*background:\s*var\(--liquid-overlay-clear\)/,
  );
  assert.match(
    styles,
    /\.activity-floating-record-footer[\s\S]*?:is\(\.activity-primary-button, \.activity-secondary-button\)\s*\{[^}]*border-radius:\s*999px;[^}]*box-shadow:\s*var\(--liquid-overlay-action-shadow\)/,
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

test("날짜별 기록 추가는 활동 추가와 같은 차콜 primary 원형 버튼을 사용한다", () => {
  assert.match(source, /className="activity-add-record-button"/);
  assert.match(
    styles,
    /\.product-shell\[data-liquid-glass="true"\]\s+\.activity-add-record-button\s*\{[^}]*border:\s*1px solid var\(--activity-green-strong\)[^}]*border-radius:\s*999px[^}]*background:\s*var\(--activity-green\)[^}]*color:\s*#ffffff/s,
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
});

test("미래 날짜는 계획 작성 문구와 별도 표시를 제공한다", () => {
  assert.match(calendarSource, /getActivityPlanningHorizonDateKey\(today\)/);
  assert.match(calendarSource, /data-future=\{isFuture \? "true" : undefined\}/);
  assert.match(source, /계획 미리 세우기/);
  assert.match(source, /미래 계획은 완료 경험의 근거에서 제외돼요/);
  assert.match(source, /activity-event-plan-label/);
  assert.match(
    source,
    /isActivityRecordableOnDate\(activity, log\.date, today\)/,
  );
});
