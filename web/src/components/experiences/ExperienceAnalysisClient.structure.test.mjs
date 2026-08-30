import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./ExperienceAnalysisClient.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const headerStart = source.indexOf(
  '<section className="page-header sub-page-heading">',
);
const headerEnd = source.indexOf("</section>", headerStart);
const headerSource = source.slice(headerStart, headerEnd);

function count(text, pattern) {
  return text.split(pattern).length - 1;
}

test("분석 페이지 헤더는 활동 경험 상세 복귀 링크만 배치한다", () => {
  assert.match(source, /className="page-stack sub-page analysis-detail-page"/);
  assert.match(headerSource, /href=\{`\/experiences\/\$\{experience\.id\}`\}/);
  assert.match(
    headerSource,
    /<ArrowLeft className="button-icon" aria-hidden="true" \/>[\s\S]*활동 경험 상세/,
  );
  assert.equal(count(headerSource, "<Link"), 1);
  assert.doesNotMatch(headerSource, /href="\/experiences"/);
  assert.doesNotMatch(headerSource, /나의 활동으로 돌아가기/);
  assert.doesNotMatch(headerSource, /활동 경험 상세로 돌아가기/);
  assert.equal(count(source, "나의 활동으로 돌아가기"), 1);
});

test("단일 활동 경험 상세 액션은 기존 두 번째 버튼 위치와 한 줄 높이를 유지한다", () => {
  assert.match(
    styles,
    /\.analysis-page-header-actions\s+\.button\s*\{[^}]*white-space:\s*nowrap[^}]*\}/s,
  );
  assert.match(
    styles,
    /@media \(min-width: 861px\)[\s\S]*?\.analysis-detail-page\s+\.analysis-page-header-actions\s*\{[^}]*margin-top:\s*54px[^}]*\}/s,
  );
});

test("단일 활동 경험 상세 액션은 모바일에서도 헤더 우측 상단을 유지한다", () => {
  assert.match(
    styles,
    /@media \(max-width: 860px\)[\s\S]*?\.analysis-detail-page\s*>\s*\.standalone-page-intro\s*>\s*\.sub-page-heading\s*\{[^}]*position:\s*relative[^}]*display:\s*block[^}]*height:\s*auto[^}]*min-height:\s*var\(--product-page-heading-min-height\)[^}]*\}/s,
  );
  assert.match(
    styles,
    /@media \(max-width: 860px\)[\s\S]*?\.analysis-detail-page\s+\.sub-page-heading\s+h1\s*\{[^}]*padding-right:\s*161px[^}]*\}[\s\S]*?\.analysis-detail-page\s+\.analysis-page-header-actions\s*\{[^}]*position:\s*absolute[^}]*top:\s*0[^}]*right:\s*0[^}]*width:\s*auto[^}]*flex-direction:\s*row[^}]*\}[\s\S]*?\.analysis-detail-page\s+\.analysis-page-header-actions\s+\.button\s*\{[^}]*width:\s*auto[^}]*flex:\s*0 0 auto[^}]*\}/s,
  );
});

test("분석 페이지 하단에는 분석 실행 버튼만 유지한다", () => {
  assert.match(source, /다시 분석하기/);
  assert.match(source, /AI 분석 요청/);
  assert.doesNotMatch(source, /href="\/recommend"/);
  assert.doesNotMatch(source, /AI 기반 활동 추천/);
});

test("저장된 분석 결과의 재분석 버튼은 결과 표면 내부 footer에 둔다", () => {
  assert.doesNotMatch(source, /analysis-page-footer-actions-spaced/);
  assert.match(source, /<AnalysisResult[\s\S]*?footer=\{/);
  assert.match(
    styles,
    /\.analysis-result-footer\s*\{[^}]*border-top:[^}]*padding-top:\s*22px;/s,
  );
});

test("독립 분석 결과는 좌측 메뉴 하단에 맞춘 내부 스크롤 표면을 사용한다", () => {
  assert.match(
    styles,
    /\.analysis-detail-page\s*\{[^}]*height:\s*100svh[^}]*padding:\s*var\(--analysis-detail-viewport-inset\) var\(--sub-page-gutter\)/s,
  );
  assert.match(
    styles,
    /\.analysis-detail-page[\s\S]*?>\s*\.analysis-result\.liquid-section\s*\{[^}]*flex:\s*1\s+1\s+auto[^}]*overflow:\s*hidden[^}]*border-radius:\s*32px[^}]*padding:\s*0;/s,
  );
  assert.match(
    styles,
    /\.analysis-result-scroll\s*\{[^}]*overflow-y:\s*auto[^}]*padding:\s*30px clamp\(30px, 3\.2vw, 40px\)\s*calc\(30px \+ var\(--standalone-page-intro-max-offset\)\)[^}]*scroll-padding-bottom:\s*calc\(30px \+ var\(--standalone-page-intro-max-offset\)\)/s,
  );
  assert.match(
    styles,
    /\.product-shell\[data-liquid-glass="true"\]\s+\.analysis-detail-page\s+\.analysis-result-header\s*\+\s*\.detail-section\s*\{[^}]*border-top:\s*0/s,
  );
  assert.match(
    styles,
    /\.product-shell\[data-liquid-glass="true"\]\s+\.analysis-detail-page\s+\.analysis-result-header\s*\{[^}]*margin-bottom:\s*0/s,
  );
  assert.match(source, /const pageHeader = \([\s\S]*standalone-page-intro/);
  assert.match(
    source,
    /className="page-stack sub-page analysis-detail-page"[\s\S]*\{pageHeader\}[\s\S]*<AnalysisResult/,
  );
  assert.match(source, /data-scroll-page-intro="true"/);
  assert.match(
    styles,
    /\.analysis-detail-page\s*\{[^}]*--standalone-page-viewport-inset:\s*var\(--analysis-detail-viewport-inset\)/s,
  );
  assert.match(
    styles,
    /\.analysis-result-scroll\s*>\s*\*\s*\{[^}]*transform:\s*translateY\(var\(--standalone-page-intro-scroll-offset\)\)/s,
  );
});
