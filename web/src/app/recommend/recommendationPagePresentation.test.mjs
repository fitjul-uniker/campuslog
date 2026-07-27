import assert from "node:assert/strict";
import test from "node:test";

import {
  RECOMMENDATION_PAGE_DESCRIPTION,
  getRecommendationEmptyStatePresentation,
} from "./recommendationPagePresentation.ts";

test("추천 화면은 사용자가 경험을 고르는 상황을 설명한다", () => {
  assert.equal(
    RECOMMENDATION_PAGE_DESCRIPTION,
    "지원 문항이나 JD에 어떤 경험을 쓸지 고민될 때 활용해 보세요.",
  );
});

test("활동이 없으면 새 활동과 과거 활동 기록을 안내한다", () => {
  assert.deepEqual(getRecommendationEmptyStatePresentation(0), {
    title: "추천에 사용할 경험이 아직 없어요",
    description:
      "새 활동을 시작해 기록을 쌓거나, 이미 끝난 활동을 바로 등록해 주세요.",
    primaryAction: {
      href: "/activities/new",
      label: "활동 추가",
    },
    secondaryAction: {
      href: "/experiences/new",
      label: "과거 활동 기록하기",
    },
  });
});

test("진행 활동이 있으면 완료 경험 정리를 먼저 안내한다", () => {
  assert.deepEqual(getRecommendationEmptyStatePresentation(1), {
    title: "진행 중인 활동을 경험으로 정리해 주세요",
    description:
      "쌓아 둔 기록을 확인하고 완료 경험으로 정리하면 추천에 활용할 수 있어요.",
    primaryAction: {
      href: "/dashboard",
      label: "진행 활동 확인하기",
    },
    secondaryAction: {
      href: "/experiences/new",
      label: "과거 활동 기록하기",
    },
  });
});
