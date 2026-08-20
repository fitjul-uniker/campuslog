import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detailSource = await readFile(
  new URL("./DashboardExperienceDetail.tsx", import.meta.url),
  "utf8",
);
const dashboardSource = await readFile(
  new URL("./ExperienceDashboard.tsx", import.meta.url),
  "utf8",
);
const trackedDetailSource = await readFile(
  new URL("./DashboardTrackedActivityDetail.tsx", import.meta.url),
  "utf8",
);
const globalCssSource = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("인라인 완료 경험 상세에 삭제 액션을 연결한다", () => {
  const actionsStart = detailSource.indexOf(
    '<div className="dashboard-detail-actions">',
  );
  const inlineBranchStart = detailSource.indexOf(") : (", actionsStart);
  const inlineBranchEnd = detailSource.indexOf("</div>", inlineBranchStart);
  const inlineBranch = detailSource.slice(inlineBranchStart, inlineBranchEnd);

  assert.notEqual(actionsStart, -1, "상세 액션 영역을 찾을 수 없습니다.");
  assert.notEqual(
    inlineBranchStart,
    -1,
    "인라인 상세 액션 분기를 찾을 수 없습니다.",
  );
  assert.match(inlineBranch, /dashboard-detail-delete/);
  assert.match(inlineBranch, /<Trash2/);
  assert.match(inlineBranch, /삭제/);
  assert.ok(
    inlineBranch.indexOf("{editAction}") <
      inlineBranch.indexOf("dashboard-detail-delete"),
    "삭제 액션은 수정 다음에 표시되어야 합니다.",
  );
  assert.ok(
    inlineBranch.indexOf("dashboard-detail-delete") <
      inlineBranch.indexOf("{analysisAction}"),
    "삭제 액션은 AI 분석 액션보다 먼저 표시되어야 합니다.",
  );
  assert.match(dashboardSource, /onDelete=\{\(\) =>/);
  assert.match(
    dashboardSource,
    /handleDeleteExperience\(selectedExperience\)/,
  );
});

test("분석 스플릿뷰가 열리면 왼쪽 상세는 중복 로딩 오버레이를 만들지 않는다", () => {
  assert.match(detailSource, /\{isAnalyzing && !isAnalysisOpen \? \(/);
  assert.match(detailSource, /\{analysisError && !isAnalysisOpen \? \(/);
});

test("나의 활동 목록과 상세는 서로 다른 Liquid Glass 계층을 사용한다", () => {
  assert.match(
    dashboardSource,
    /dashboard-experience-list-pane liquid-workspace/,
  );
  assert.match(detailSource, /dashboard-experience-detail liquid-section/);
});

test("나의 활동 목록은 상세를 열기 전 공통 페이지 폭 전체를 사용한다", () => {
  assert.match(
    globalCssSource,
    /\.dashboard-experience-list-pane\s*\{[^}]*flex:\s*0 0 100%/s,
  );
  assert.doesNotMatch(
    globalCssSource,
    /\.dashboard-experience-list-pane\s*\{[^}]*flex-basis:\s*(?:520|560)px/s,
  );
  assert.match(
    globalCssSource,
    /\.dashboard-experience-workspace\[data-detail-open="true"\][\s\S]*?\.dashboard-experience-list-pane\s*\{[^}]*flex-basis:\s*360px/s,
  );
});

test("활동 선택 시 목록 너비와 상세 진입을 순차적으로 전환한다", () => {
  assert.match(
    globalCssSource,
    /\.dashboard-experience-workspace\s*\{[^}]*transition:\s*column-gap 420ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/s,
  );
  assert.match(
    globalCssSource,
    /\.dashboard-experience-list-pane\s*\{[^}]*transition:\s*flex-basis 420ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/s,
  );
  assert.match(
    dashboardSource,
    /initial=\{[\s\S]*?shouldReduceMotion \? \{ opacity: 0 \} : \{ opacity: 0, x: 32 \}/,
  );
  assert.match(
    dashboardSource,
    /duration: shouldReduceMotion \? 0\.1 : 0\.34,[\s\S]*?delay: shouldReduceMotion \? 0 : 0\.08/,
  );
  assert.match(
    globalCssSource,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.dashboard-experience-workspace,[\s\S]*?\.dashboard-experience-list-pane\s*\{[^}]*transition:\s*none/s,
  );
});

test("상세는 현재 우측 슬롯에서 퇴장한 뒤 선택을 해제한다", () => {
  assert.match(
    dashboardSource,
    /const \[isDetailClosing, setIsDetailClosing\] = useState\(false\)/,
  );
  assert.match(
    dashboardSource,
    /const handleCloseDetail = useCallback\(\(\) => \{[\s\S]*?setIsDetailClosing\(true\);/,
  );
  assert.match(
    dashboardSource,
    /animate=\{[\s\S]*?isDetailClosing[\s\S]*?opacity: 0, x: 48[\s\S]*?opacity: 1, x: 0/,
  );
  assert.match(
    dashboardSource,
    /duration: shouldReduceMotion \? 0\.1 : 0\.2/,
  );
  assert.match(
    dashboardSource,
    /const handleDetailCloseAnimationComplete = useCallback\(\(\) => \{[\s\S]*?if \(!isDetailClosing\)[\s\S]*?setSelectedItemKey\(null\);[\s\S]*?setIsDetailClosing\(false\)/,
  );
  assert.match(
    dashboardSource,
    /lastSelectionTriggerRef\.current\.focus\(\{ preventScroll: true \}\)/,
  );
  assert.doesNotMatch(
    dashboardSource,
    /key=\{selectedItemKey\}\s+layout\s+initial=\{false\}/,
  );
  assert.doesNotMatch(
    detailSource,
    /<motion\.section\s+layout\s+id=\{DASHBOARD_EXPERIENCE_DETAIL_ID\}/,
  );
  assert.doesNotMatch(
    trackedDetailSource,
    /<motion\.section\s+layout\s+id=\{DASHBOARD_EXPERIENCE_DETAIL_ID\}/,
  );
});

test("활동 기간과 역할은 각각 전체 폭의 독립 행으로 표시한다", () => {
  assert.match(
    globalCssSource,
    /\.dashboard-detail-meta\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*gap:\s*0[^}]*padding:\s*0/s,
  );
  assert.match(
    globalCssSource,
    /\.dashboard-detail-meta\s*>\s*div\s*\{[^}]*border-bottom:\s*1px solid var\(--liquid-divider, #ededeb\)[^}]*padding:\s*24px 0/s,
  );
});

test("독립 경험 상세는 상태부터 읽히는 하나의 Liquid Glass 표면을 사용한다", () => {
  const headerStart = detailSource.indexOf(
    '<div className="dashboard-detail-header">',
  );
  const headerEnd = detailSource.indexOf(
    '<dl className="dashboard-detail-meta">',
    headerStart,
  );
  const headerSource = detailSource.slice(headerStart, headerEnd);

  assert.ok(
    headerSource.indexOf("dashboard-detail-status") <
      headerSource.indexOf("<h1"),
    "독립 상세의 분석 상태는 제목보다 먼저 읽혀야 합니다.",
  );
  assert.match(
    globalCssSource,
    /\.product-surface\s+\.sub-page\s+\.dashboard-experience-detail\.is-fullscreen\s*\{[^}]*border:\s*1px solid var\(--liquid-hairline\)[^}]*border-radius:\s*32px[^}]*background:\s*var\(--liquid-frosted-fill\)[^}]*backdrop-filter:\s*blur\(28px\)/s,
  );
  assert.doesNotMatch(
    globalCssSource,
    /\.product-surface\s+\.sub-page\s+\.dashboard-experience-detail\.is-fullscreen\s*\{[^}]*border:\s*0[;}]/s,
  );
  assert.match(
    globalCssSource,
    /\.dashboard-experience-detail\.is-fullscreen[\s\S]*\.dashboard-detail-action\s*\{[^}]*border-radius:\s*999px/s,
  );
  assert.match(
    globalCssSource,
    /\.dashboard-experience-detail\.is-fullscreen[\s\S]*\.dashboard-detail-tags span[\s\S]*background:\s*var\(--liquid-control-fill\)/s,
  );
});
