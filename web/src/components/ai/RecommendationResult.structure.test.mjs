import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./RecommendationResult.tsx", import.meta.url),
  "utf8",
);

test("추천 결과는 요청한 보조 정보 블록을 렌더링하지 않는다", () => {
  assert.doesNotMatch(source, /requirements\.requiredCompetencies/);
  assert.doesNotMatch(source, /requirements\.keywords/);
  assert.doesNotMatch(source, /requirements\.constraints/);
  assert.doesNotMatch(source, /recommendation-legacy-summary/);
  assert.doesNotMatch(source, /<h3>참고 문장<\/h3>/);
  assert.doesNotMatch(source, /recommendation-copy-button/);
});

test("추천 결과는 핵심 비교와 생성 흐름을 유지한다", () => {
  assert.match(source, /requirements\.preferredCompetencies/);
  assert.match(source, /matches\.map/);
  assert.match(source, /추천 이유/);
  assert.match(source, /AnswerDraftViewer/);
  assert.match(source, /초안 본문을 클립보드에 복사했습니다/);
});
