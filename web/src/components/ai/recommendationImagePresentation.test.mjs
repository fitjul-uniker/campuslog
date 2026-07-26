import assert from "node:assert/strict";
import test from "node:test";

import { getRecommendationImageSelectionSummary } from "./recommendationImagePresentation.ts";

test("선택한 추천 이미지의 개수와 전체 용량을 Gallery 헤더에 표시한다", () => {
  const files = [
    { size: 1_048_576 },
    { size: 524_288 },
  ];

  assert.deepEqual(getRecommendationImageSelectionSummary(files, 3), {
    heading: "첨부 이미지 (2/3)",
    totalBytes: 1_572_864,
  });
});
