import assert from "node:assert/strict";
import test from "node:test";

import { getAnswerDraftRecommendationEvidence } from "./answerDraftEvidencePresentation.ts";

test("답변 초안 근거는 추천 매칭 근거만 접두 제목 없이 표시한다", () => {
  assert.deepEqual(
    getAnswerDraftRecommendationEvidence([
      "추천 매칭 근거: 문제를 정의하고 팀의 실행 방향을 조율한 경험",
      "사용자 흐름과 MVP 화면을 설계한 경험",
    ]),
    [
      "문제를 정의하고 팀의 실행 방향을 조율한 경험",
      "사용자 흐름과 MVP 화면을 설계한 경험",
    ],
  );
});

test("답변 초안 추천 근거의 빈 문장과 중복 문장은 제거한다", () => {
  assert.deepEqual(
    getAnswerDraftRecommendationEvidence([
      "추천 매칭 근거: 같은 근거",
      "같은 근거",
      "   ",
    ]),
    ["같은 근거"],
  );
});
