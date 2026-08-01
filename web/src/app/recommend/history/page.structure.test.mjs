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

test("추천 기록 검색은 Liquid Glass 검색 캡슐을 사용한다", () => {
  assert.match(
    source,
    /className="recommendation-history-search liquid-capsule"/,
  );
  assert.match(
    styles,
    /\.product-shell\[data-liquid-glass="true"\][\s\S]{0,100}\.gooey-input\.liquid-capsule[\s\S]{0,120}\.gooey-input-filter-wrap\s*\{[^}]*filter:\s*none\s*!important/is,
  );
  assert.match(
    styles,
    /\.gooey-input\.liquid-capsule[\s\S]{0,160}\.gooey-input-trigger,[\s\S]{0,220}\.gooey-input-surface input\s*\{[^}]*color:\s*var\(--liquid-text-primary\)/is,
  );
});

test("추천 기록 페이지 제목은 목록 Glass 밖에 있고 목록은 전체 기록 H2로 시작한다", () => {
  const pageHeadingStart = source.indexOf(
    '<header className="recommendation-history-page-heading primary-page-heading">',
  );
  const layoutGroupStart = source.indexOf(
    '<LayoutGroup id="recommendation-history-layout">',
  );
  const listPaneStart = source.indexOf(
    'className="recommendation-history-list-pane liquid-workspace"',
  );
  const listHeadingStart = source.indexOf(
    '<header className="recommendation-history-heading">',
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

test("추천 기록 제목은 다른 주요 화면과 같은 1200px 프레임과 gutter를 사용한다", () => {
  assert.match(
    styles,
    /\.product-surface\s+\.recommendation-history-page\.sub-page\s*\{[\s\S]*--sub-page-gutter:\s*clamp\(24px,\s*3\.2vw,\s*48px\)[\s\S]*width:\s*min\(100%,\s*1200px\)[\s\S]*max-width:\s*1200px/,
  );
  assert.match(
    styles,
    /\.product-surface\s+\.primary-page-heading\s+h1\s*\{[\s\S]*font-size:\s*clamp\(2\.15rem,\s*3vw,\s*2\.5rem\)/,
  );
});

test("추천 기록 상세는 한 겹의 frosted Glass와 질문 중심 읽기 흐름을 사용한다", () => {
  assert.match(
    styles,
    /\.recommendation-history-detail\.liquid-section\s*\{[^}]*background:\s*var\(--liquid-frosted-fill\)[^}]*backdrop-filter:\s*blur\(28px\)\s+saturate\(1\.12\)/,
  );
  assert.match(
    styles,
    /\.recommendation-history-detail\s*>\s*\.recommendation-result\.is-embedded\.liquid-section\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/,
  );
  assert.match(
    styles,
    /\.recommendation-history-detail\s+\.recommendation-result\.is-embedded\s+\.detail-section\s*\{[^}]*background:\s*transparent/,
  );
  assert.match(
    recommendationResultSource,
    /isEmbedded \? result\.prompt : result\.recommendedExperienceTitle/,
  );
  assert.match(
    recommendationResultSource,
    /experience && !isEmbedded/,
  );
});
