import assert from "node:assert/strict";
import test from "node:test";

import {
  IMAGE_COVER_LETTER_TITLE_FALLBACK,
  LONG_JD_TITLE_FALLBACK,
  getRecommendationResultTitle,
} from "./recommendationResultTitle.ts";

function createResult(overrides = {}) {
  return {
    purpose: "cover_letter",
    prompt: "이미지에서 추출한 긴 자기소개서 문항 원문",
    inputSource: "image",
    extractedRequirements: {
      intent: "지원 동기와 입사 후 성장 계획.",
      keywords: ["지원 동기", "성장 계획"],
    },
    ...overrides,
  };
}

test("이미지 단독 자기소개서는 추출 원문 대신 정리된 의도를 제목으로 사용한다", () => {
  assert.equal(
    getRecommendationResultTitle(createResult()),
    "지원 동기와 입사 후 성장 계획",
  );
});

test("자기소개서 의도가 너무 길면 중복을 제거한 핵심 키워드를 사용한다", () => {
  const longIntent = "가".repeat(61);

  assert.equal(
    getRecommendationResultTitle(
      createResult({
        extractedRequirements: {
          intent: longIntent,
          keywords: [" 문제 해결 ", "협업 역량", "문제 해결", "성과"],
        },
      }),
    ),
    "문제 해결 · 협업 역량 · 성과",
  );
});

test("의도와 핵심 키워드가 없으면 자연스러운 자기소개서 기본 제목을 사용한다", () => {
  assert.equal(
    getRecommendationResultTitle(
      createResult({
        extractedRequirements: { intent: "", keywords: [] },
      }),
    ),
    IMAGE_COVER_LETTER_TITLE_FALLBACK,
  );
});

test("텍스트 및 텍스트와 이미지 혼합 자기소개서는 사용자가 입력한 제목을 유지한다", () => {
  const prompt = "협업 과정에서 갈등을 해결한 경험을 작성해 주세요.";

  assert.equal(
    getRecommendationResultTitle(
      createResult({ inputSource: "text", prompt }),
    ),
    prompt,
  );
  assert.equal(
    getRecommendationResultTitle(
      createResult({ inputSource: "text_and_image", prompt }),
    ),
    prompt,
  );
});

test("긴 JD는 기존의 짧은 의도와 기본 제목 규칙을 유지한다", () => {
  assert.equal(
    getRecommendationResultTitle(
      createResult({
        purpose: "jd",
        inputSource: "text",
        prompt: "J".repeat(241),
        extractedRequirements: {
          intent: "백엔드 직무 요구사항과 경험 적합도",
          keywords: [],
        },
      }),
    ),
    "백엔드 직무 요구사항과 경험 적합도",
  );
  assert.equal(
    getRecommendationResultTitle(
      createResult({
        purpose: "jd",
        inputSource: "text",
        prompt: "J".repeat(241),
        extractedRequirements: {
          intent: "가".repeat(101),
          keywords: [],
        },
      }),
    ),
    LONG_JD_TITLE_FALLBACK,
  );
});
