import assert from "node:assert/strict";
import test from "node:test";

import {
  RECOMMENDATION_PAGE_DESCRIPTION,
  getRecommendationEmptyStatePresentation,
} from "./recommendationPagePresentation.ts";

test("추천 화면은 사용자가 경험을 고르는 상황을 설명한다", () => {
  assert.equal(
    RECOMMENDATION_PAGE_DESCRIPTION,
    "지원 문항·JD에 맞는 경험을 찾아보세요.",
  );
});

test("활동이 없으면 나의 활동 경험 추가만 안내한다", () => {
  assert.deepEqual(getRecommendationEmptyStatePresentation(0), {
    title: "추천에 사용할 경험이 아직 없어요",
    description:
      "나의 활동에 경험을 등록하면 바로 추천에 활용할 수 있어요.",
    primaryAction: {
      href: "/experiences/new",
      label: "활동 추가",
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
      label: "활동 추가",
    },
  });
});
