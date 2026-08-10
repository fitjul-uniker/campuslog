import assert from "node:assert/strict";
import test from "node:test";

import {
  getAnswerDraftCharacterLimit,
  getAnswerDraftTargetGuide,
  isValidCustomAnswerDraftCharacterCount,
  normalizeAnswerDraft,
} from "./answerDraftResult.ts";

test("직접 입력 자기소개서는 100~2000자 제한을 허용한다", () => {
  assert.equal(isValidCustomAnswerDraftCharacterCount(100), true);
  assert.equal(isValidCustomAnswerDraftCharacterCount(700), true);
  assert.equal(isValidCustomAnswerDraftCharacterCount(1_500), true);
  assert.equal(isValidCustomAnswerDraftCharacterCount(2_000), true);
  assert.equal(isValidCustomAnswerDraftCharacterCount(99), false);
  assert.equal(isValidCustomAnswerDraftCharacterCount(2_001), false);
  assert.equal(isValidCustomAnswerDraftCharacterCount(50_000), false);
  assert.equal(isValidCustomAnswerDraftCharacterCount(700.5), false);
});

test("직접 입력 글자 수는 수정 여백을 둔 생성 범위로 바뀐다", () => {
  assert.deepEqual(getAnswerDraftCharacterLimit("custom", 700), {
    min: 616,
    max: 665,
  });
  assert.deepEqual(getAnswerDraftCharacterLimit("custom", 1_500), {
    min: 1_320,
    max: 1_425,
  });
  assert.equal(
    getAnswerDraftTargetGuide("custom", 700),
    "616~665자 자기소개서 초안 (700자 제한)",
  );
});

test("직접 입력 목표 글자 수는 저장 결과 정규화 뒤에도 유지된다", () => {
  const draft = normalizeAnswerDraft({
    type: "custom",
    title: "700자 자기소개서",
    content: "근거가 있는 자기소개서 초안",
    targetGuide: "616~665자 자기소개서 초안 (700자 제한)",
    targetCharacterCount: 700,
    usedEvidence: ["근거"],
    missingEvidenceNotes: [],
    cautions: [],
  });

  assert.equal(draft?.targetCharacterCount, 700);
  assert.equal(draft?.targetGuide, "616~665자 자기소개서 초안 (700자 제한)");
});
