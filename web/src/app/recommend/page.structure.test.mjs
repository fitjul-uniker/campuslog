import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

test("AI 추천 취소는 오류 알림을 만들지 않고 실제 실패만 표시한다", () => {
  assert.doesNotMatch(
    source,
    /AI 추천 요청을 취소했습니다\. 입력은 그대로 유지했어요\./,
  );
  assert.match(
    source,
    /if \(response\.error\.code === "REQUEST_CANCELLED"\) \{\s*return;\s*\}/,
  );
  assert.match(source, /setRecommendationError\(response\.error\.message\)/);
});
