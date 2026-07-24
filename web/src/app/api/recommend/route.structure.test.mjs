import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const imageInputSource = await readFile(
  new URL("../../../lib/recommendationImageInput.ts", import.meta.url),
  "utf8",
);

test("추천 API는 이미지 입력을 검증해 기존 Structured Output 요청에 함께 보낸다", () => {
  assert.match(source, /parseRecommendationImageInputs\(candidate\.images\)/);
  assert.match(
    source,
    /createRecommendationOpenAiContent\(\s*createRecommendationPrompt\(parsedBody\),\s*parsedBody\.images/,
  );
  assert.match(imageInputSource, /detail:\s*"high"/);
});

test("추천 API는 같은 응답에서 이미지 문항을 정규화하고 읽기 실패를 안내한다", () => {
  assert.match(source, /"resolvedPrompt"/);
  assert.match(source, /resolvedPrompt:\s*recommendation\.resolvedPrompt/);
  assert.match(source, /이미지의 텍스트를 읽지 못했어요/);
  assert.match(source, /읽을 수 없는 내용은 추측하지/);
});
