import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const styles = await readFile(
  new URL("../../globals.css", import.meta.url),
  "utf8",
);
const recommendationResultSource = await readFile(
  new URL("../../../components/ai/RecommendationResult.tsx", import.meta.url),
  "utf8",
);
const recommendationListSource = await readFile(
  new URL(
    "../../../components/recommendations/AnimatedRecommendationList.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("추천 기록 검색은 나의 활동과 같은 차콜 Gooey 검색을 사용한다", () => {
  assert.match(
    source,
    /className="recommendation-history-search dashboard-experience-search"/,
  );
  assert.doesNotMatch(source, /recommendation-history-search liquid-capsule/);
  assert.match(styles, /\.gooey-input-surface\s*\{[\s\S]*height:\s*42px/);
  assert.match(styles, /\.gooey-input-trigger,\s*\.gooey-input-surface,[\s\S]*background:\s*#1d1d1f/);
});

test("추천 기록 페이지 제목은 목록 Glass 밖에 있고 목록은 전체 기록 H2로 시작한다", () => {
  const pageHeadingStart = source.indexOf(
    '<header className="recommendation-history-page-heading primary-page-heading">',
  );
  const layoutGroupStart = source.indexOf(
    '<LayoutGroup id="recommendation-history-layout">',
  );
  const listPaneStart = source.indexOf(
    'className="recommendation-history-list-pane dashboard-experience-list-pane liquid-workspace"',
  );
  const listHeadingStart = source.indexOf(
    '<header className="recommendation-history-heading dashboard-experience-section-heading">',
  );

  assert.ok(pageHeadingStart > -1);
  assert.ok(layoutGroupStart > pageHeadingStart);
  assert.ok(listPaneStart > layoutGroupStart);
  assert.ok(listHeadingStart > listPaneStart);
  assert.match(
    source.slice(pageHeadingStart, layoutGroupStart),
    /<h1>추천 기록<\/h1>[\s\S]*primary-page-description/,
  );
  assert.match(
    source.slice(listHeadingStart),
    /<h2 id="recommendation-history-heading">전체 기록<\/h2>/,
  );
  assert.match(
    source,
    /aria-labelledby="recommendation-history-heading"/,
  );
});

test("추천 기록은 나의 활동과 같은 primary page 1120px 프레임을 사용한다", () => {
  assert.match(
    source,
    /className=\{`recommendation-history-page primary-page/,
  );
  assert.match(
    styles,
    /\.product-surface\s+\.primary-page\s*\{[\s\S]*width:\s*min\(100%,\s*1120px\)[\s\S]*max-width:\s*1120px/,
  );
  assert.match(source, /recommendation-history-workspace dashboard-experience-workspace/);
  assert.match(source, /dashboard-experience-title-group/);
});

test("추천 기록 초기 로딩은 시각적 스켈레톤 없이 접근성 상태만 제공한다", () => {
  assert.match(
    source,
    /recommendations === null \|\| !recommendationPins\.isLoaded[\s\S]*?<LoadingStatus message="추천 기록을 불러오는 중입니다\."/,
  );
  assert.doesNotMatch(source, /<LoadingState\b/);
});

test("추천 기록 상세는 한 겹의 frosted Glass와 질문 중심 읽기 흐름을 사용한다", () => {
  assert.match(
    styles,
    /\.recommendation-history-page[\s\S]{0,100}\.recommendation-history-detail\.liquid-section\s*\{[^}]*background:\s*var\(--liquid-frosted-fill\)[^}]*backdrop-filter:\s*blur\(28px\)\s+saturate\(1\.12\)/,
  );
  assert.match(
    styles,
    /\.recommendation-history-detail\s+\.recommendation-history-detail-scroll\s+>\s*\.recommendation-result\.is-embedded\.liquid-section\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/,
  );
  assert.match(
    styles,
    /\.recommendation-history-detail\s+\.recommendation-result\.is-embedded\s+\.detail-section\s*\{[^}]*background:\s*transparent/,
  );
  assert.match(
    recommendationResultSource,
    /<h2 id="recommendation-title">\{resultTitle\}<\/h2>/,
  );
  assert.match(
    recommendationResultSource,
    /!isEmbedded[\s\S]*AI 기반 활동 추천 결과/,
  );
  assert.match(recommendationResultSource, /입력한 JD 보기/);
  assert.doesNotMatch(
    recommendationResultSource,
    /className="dashboard-detail-meta recommendation-meta"/,
  );
});

test("추천 기록 목록과 상세는 나의 활동과 같은 transient scrollbar를 사용한다", () => {
  assert.match(recommendationListSource, /useTransientScrollbar<HTMLDivElement>/);
  assert.match(recommendationListSource, /dashboard-animated-list pinned-list/);
  assert.match(recommendationListSource, /data-transient-scrollbar="true"/);
  assert.match(source, /className="recommendation-history-detail-scroll"/);
  assert.match(source, /onScroll=\{handleDetailTransientScroll\}/);
  assert.match(
    styles,
    /\.recommendation-history-detail-scroll\[data-transient-scrollbar="true"\]::\-webkit-scrollbar\s*\{\s*width:\s*10px/,
  );
});

test("추천 기록 master-detail은 모바일에서 목록 다음 상세로 전환한다", () => {
  assert.match(
    styles,
    /@media \(max-width:\s*860px\)[\s\S]*\.recommendation-history-page\.primary-page[\s\S]*\.recommendation-history-workspace[\s\S]*display:\s*grid[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );
  assert.match(
    styles,
    /\.recommendation-history-page\.has-selection\s+\.recommendation-animated-list\s*\{[^}]*max-height:\s*min\(34svh,\s*330px\)/,
  );
});
