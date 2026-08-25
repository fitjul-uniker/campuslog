import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
const scaffoldSource = await readFile(
  new URL("./RecommendationPageScaffold.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(new URL("../globals.css", import.meta.url), "utf8");

test("AI 추천 취소는 오류 알림을 만들지 않고 실제 실패만 표시한다", () => {
  assert.doesNotMatch(
    source,
    /AI 추천 요청을 취소했습니다\. 입력은 그대로 유지했어요\./,
  );
  assert.match(
    source,
    /cancelled:\s*response\.error\.code === "REQUEST_CANCELLED"/,
  );
  assert.match(source, /if \(recommendationTask\.isCancelled\)/);
  assert.match(source, /setRecommendationError\(recommendationTask\.errorMessage\)/);
});

test("AI 추천은 이미지와 정규화된 문항을 전달하고 이미지 출처를 저장한다", () => {
  assert.match(source, /images:\s*input\.images/);
  assert.match(source, /prompt:\s*response\.resolvedPrompt/);
  assert.match(source, /inputSource:/);
  assert.match(source, /첨부 이미지/);
});

test("AI 추천 페이지는 선택 시안의 Liquid Glass 작업 공간을 사용한다", () => {
  assert.match(source, /form-panel liquid-workspace/);
  assert.match(
    scaffoldSource,
    /button button-ghost recommendation-header-link liquid-capsule/,
  );
  assert.match(source, /placeholder-panel liquid-section/);
});

test("추천 화면과 추천 기록의 우측 상단 액션은 공통 44px 기준을 사용한다", () => {
  assert.match(
    styles,
    /\.product-surface \.page-header\s*\{[^}]*align-items:\s*flex-start/,
  );
  assert.match(
    styles,
    /\.recommendation-header-link\.liquid-capsule,[\s\S]*\.recommendation-history-new\.liquid-capsule\s*\{[^}]*min-height:\s*44px/,
  );
  assert.match(
    styles,
    /\.recommendation-history-new svg\s*\{[^}]*width:\s*18px[^}]*height:\s*18px/,
  );
});
