import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPERIENCE_INPUT_LIMITS,
  getExperienceLengthState,
} from "./experienceInputLimits.ts";

test("경험 내용과 성과 제한은 AI API가 허용하는 분량과 일치한다", () => {
  assert.equal(EXPERIENCE_INPUT_LIMITS.description, 8_000);
  assert.equal(EXPERIENCE_INPUT_LIMITS.achievements, 4_000);
});

test("글자 수 안내는 제한의 90%부터만 표시한다", () => {
  assert.equal(getExperienceLengthState("가".repeat(7_199), 8_000).showGuidance, false);
  assert.equal(getExperienceLengthState("가".repeat(7_200), 8_000).showGuidance, true);
  assert.equal(getExperienceLengthState("가".repeat(3_600), 4_000).showGuidance, true);
});

test("초과 입력은 자르지 않고 줄여야 할 분량을 계산한다", () => {
  const state = getExperienceLengthState("가".repeat(8_530), 8_000);

  assert.equal(state.count, 8_530);
  assert.equal(state.excess, 530);
  assert.equal(state.isOverLimit, true);
});
