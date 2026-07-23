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

test("분석 페이지 복귀 링크는 상단 헤더에만 배치한다", () => {
  assert.match(headerSource, /href=\{`\/experiences\/\$\{experience\.id\}`\}/);
  assert.match(headerSource, /활동 경험 상세로 돌아가기/);
  assert.match(headerSource, /href="\/experiences"/);
  assert.match(headerSource, /나의 활동으로 돌아가기/);
  assert.equal(count(source, "활동 경험 상세로 돌아가기"), 1);
  assert.equal(count(source, "나의 활동으로 돌아가기"), 2);
});

test("분석 페이지 하단에는 분석 실행 버튼만 유지한다", () => {
  assert.match(source, /다시 분석하기/);
  assert.match(source, /AI 분석 요청/);
  assert.doesNotMatch(source, /href="\/recommend"/);
  assert.doesNotMatch(source, /AI 기반 활동 추천/);
});

test("저장된 분석 결과와 재분석 버튼 사이에 24px 여백을 둔다", () => {
  assert.equal(count(source, "analysis-page-footer-actions-spaced"), 1);
  assert.match(
    styles,
    /\.analysis-page-footer-actions-spaced\s*\{[^}]*margin-top:\s*24px;/s,
  );
});
