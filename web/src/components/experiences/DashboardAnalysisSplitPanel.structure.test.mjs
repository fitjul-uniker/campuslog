import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./DashboardAnalysisSplitPanel.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

test("분석 스플릿뷰 하단에 독립 분석 상세 링크를 제공한다", () => {
  assert.match(
    source,
    /href=\{`\/experiences\/\$\{experience\.id\}\/analysis`\}/,
  );
  assert.match(source, /분석 상세 보기\s*<ArrowRight/);
  assert.match(
    source,
    /분석 상세 보기[\s\S]*?AnimatedGradientActionButton[\s\S]*?다시 분석하기/,
  );
});

test("분석 스플릿 패널은 상세와 나란한 Liquid Glass section을 사용한다", () => {
  assert.match(source, /dashboard-analysis-split-panel liquid-section/);
});

test("분석 외곽 Glass와 내부 스크롤 영역을 분리한다", () => {
  assert.match(source, /className="dashboard-analysis-split-scroll"/);
  assert.match(
    source,
    /dashboard-analysis-split-scroll[\s\S]*data-transient-scrollbar="true"[\s\S]*onScroll=\{handleTransientScroll\}/,
  );
  assert.doesNotMatch(
    source,
    /className="dashboard-analysis-split-panel liquid-section"\s*data-transient-scrollbar/,
  );
});

test("데스크톱 분석 패널은 좌측 메뉴 하단선과 내부 스크롤 규칙을 공유한다", () => {
  assert.match(
    styles,
    /@media \(min-width: 861px\)[\s\S]*?\.dashboard-experience-page\s*\{[^}]*height:\s*calc\(100svh\s*-\s*var\(--experience-panel-viewport-inset\)\)[^}]*padding-bottom:\s*0/,
  );
  assert.match(
    styles,
    /\.dashboard-experience-workspace\[data-analysis-open="true"\][\s\S]*?\.dashboard-analysis-split-panel\s*\{[^}]*align-self:\s*stretch[^}]*flex:\s*1\s+1\s+auto[^}]*max-height:\s*none/,
  );
  assert.match(
    styles,
    /\.dashboard-analysis-split-scroll\s*\{[^}]*overflow-x:\s*hidden[^}]*overflow-y:\s*auto[^}]*scrollbar-gutter:\s*stable/,
  );
  assert.match(
    styles,
    /\.dashboard-experience-workspace\[data-analysis-open="true"\][\s\S]*?\.dashboard-experience-detail-slot\s*\{[^}]*display:\s*none/,
  );
});

test("데스크톱 분석 스크롤바는 둥근 외곽 모서리 안쪽에서만 움직인다", () => {
  assert.match(
    styles,
    /\.dashboard-analysis-split-panel\s*\{[^}]*overflow:\s*hidden/,
  );
  assert.match(
    styles,
    /@media \(min-width: 861px\)[\s\S]*?\.dashboard-experience-workspace\[data-analysis-open="true"\][\s\S]*?\.dashboard-analysis-split-panel\s*\{[^}]*padding-block:\s*30px/,
  );
  assert.match(
    styles,
    /\.dashboard-experience-workspace\[data-analysis-open="true"\][\s\S]*?\.dashboard-analysis-split-header\s*\{[^}]*padding-top:\s*0/,
  );
  assert.match(
    styles,
    /\.dashboard-experience-workspace\[data-analysis-open="true"\][\s\S]*?\.dashboard-analysis-split-content\s*\{[^}]*padding-bottom:\s*0/,
  );
});

test("분석 스플릿 헤더는 생성일과 결과 제목 위계를 사용한다", () => {
  assert.doesNotMatch(source, /AI 경험 분석 결과/);
  assert.match(source, /formatDateTime\(analysis\.generatedAt\)/);
  assert.match(source, /analysis-result-kicker-row/);
  assert.match(source, /<h2 id=\{titleId\}>AI 분석 결과<\/h2>/);
});

test("분석 스플릿 헤더는 패널 스크롤에 고정되지 않는다", () => {
  const header =
    styles.match(
      /\.dashboard-analysis-split-header \{([\s\S]*?)\}/,
    )?.[1] ?? "";

  assert.match(header, /position:\s*relative/);
  assert.doesNotMatch(header, /position:\s*sticky/);
  assert.doesNotMatch(header, /backdrop-filter/);
});
